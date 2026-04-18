import math
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.parking import Ticket, Tarifa, Liquidacion
from app.repositories.parking_repo import ticket_repo, tarifa_repo, liquidacion_repo
from app.schemas.parking import TicketCreate, LiquidacionCalculadaResponse

class ParkingService:
    """
    Servicio de capa de negocio para el dominio de Parking.
    En esta fase inicial, contiene la estructura base para manejo de tickets
    y previsualización de cálculos; el motor tarifario complejo se añadirá en la siguiente iteración.
    """
    def __init__(self, db: Session):
        self.db = db

    def registrar_ticket_recibido(self, ticket_in: TicketCreate) -> Ticket:
        """
        Registra un ticket generado por un proveedor externo.
        """
        existente = ticket_repo.get_by_codigo(self.db, ticket_in.codigo_ticket)
        if existente:
            raise ValueError(f"El ticket con código {ticket_in.codigo_ticket} ya existe en el sistema.")
            
        ticket_data = {
            "codigo_ticket": ticket_in.codigo_ticket,
            "fecha_hora_ingreso": ticket_in.fecha_hora_ingreso,
            "proveedor_origen": ticket_in.proveedor_origen,
            "estado": "PENDIENTE"
        }
        ticket_obj = ticket_repo.create(self.db, ticket_data)
        self.db.commit()
        return ticket_obj

    def buscar_ticket(self, codigo_ticket: str) -> Optional[Ticket]:
        """Busca y retorna un ticket por su código."""
        return ticket_repo.get_by_codigo(self.db, codigo_ticket)

    def simular_liquidacion(self, codigo_ticket: str, fecha_salida_simulada: Optional[datetime] = None) -> LiquidacionCalculadaResponse:
        """
        Simula el cálculo del importe a pagar usando las reglas tarifarias activas.
        Si el ticket ya está liquidado/cobrado, retorna el cálculo histórico congelado.
        """
        ticket = self.buscar_ticket(codigo_ticket)
        if not ticket:
            raise ValueError("Ticket no encontrado.")
            
        # --- NUEVA LÓGICA DE CONGELAMIENTO ---
        if ticket.estado in ["LIQUIDADO", "COBRADO", "FACTURADO"]:
            ultima_liq = liquidacion_repo.get_ultima_by_ticket(self.db, ticket.id_ticket)
            if not ultima_liq:
                raise ValueError(f"Inconsistencia: El ticket está en estado {ticket.estado} pero no posee registros de liquidación.")
            
            return LiquidacionCalculadaResponse(
                codigo_ticket=ticket.codigo_ticket,
                minutos_calculados=ultima_liq.minutos,
                tolerancia_aplicada=False, # Por ahora no aplica en este flujo
                bloques=ultima_liq.bloques,
                monto_a_cobrar=ultima_liq.monto_bruto,
                detalle_calculo=ultima_liq.detalle_calculo_json or {},
                modo_visualizacion="HISTORICO"
            )
        # -------------------------------------

        tarifa = tarifa_repo.get_tarifa_activa(self.db)
        if not tarifa:
            raise ValueError("Base de datos sin tarifa activa configurada.")

        salida_real = fecha_salida_simulada or datetime.now()
        
        # Calcular diferencia en minutos bruta
        diferencia = salida_real - ticket.fecha_hora_ingreso
        minutos = int(diferencia.total_seconds() / 60)
        if minutos < 0:
            minutos = 0
            
        # Calcular bloques usando redondeo hacia arriba basado en fraccion_minutos. Cobro mínimo 1 bloque.
        fraccion = tarifa.fraccion_minutos if tarifa.fraccion_minutos > 0 else 60
        bloques = max(1, math.ceil(minutos / fraccion))
            
        monto = tarifa.valor_base * bloques
        
        return LiquidacionCalculadaResponse(
            codigo_ticket=ticket.codigo_ticket,
            minutos_calculados=minutos,
            tolerancia_aplicada=False,
            bloques=bloques,
            monto_a_cobrar=monto,
            detalle_calculo={
                "tarifa_aplicada": tarifa.nombre,
                "mensaje": f"Cálculo: {minutos} min / {tarifa.fraccion_minutos} min por bloque = {bloques} bloque(s)"
            },
            modo_visualizacion="DINAMICO"
        )

    def generar_liquidacion(self, codigo_ticket: str, id_usuario_creador: Optional[int] = None, commit: bool = True) -> Liquidacion:
        """
        Persiste el cálculo de una liquidación real en la base de datos con estado CALCULADO.
        Si commit=False, la transacción debe ser manejada externamente.
        """
        ticket = self.buscar_ticket(codigo_ticket)
        if not ticket:
            raise ValueError("Ticket no encontrado para generar liquidación.")
            
        tarifa = tarifa_repo.get_tarifa_activa(self.db)
        if not tarifa:
            raise ValueError("Tarifa activa no encontrada para generar liquidación.")
            
        if ticket.estado not in ["PENDIENTE"]:
            raise ValueError(f"El ticket está en estado {ticket.estado} y no puede ser liquidado de nuevo.")
            
        simulacion = self.simular_liquidacion(codigo_ticket)
        
        try:
            liq_data = {
                "id_ticket": ticket.id_ticket,
                "id_tarifa": tarifa.id_tarifa,
                "minutos": simulacion.minutos_calculados,
                "bloques": simulacion.bloques,
                "monto_bruto": simulacion.monto_a_cobrar,
                "detalle_calculo_json": simulacion.detalle_calculo,
                "estado": "CALCULADO",
                "creado_por": id_usuario_creador
            }
            
            liquidacion = liquidacion_repo.create(self.db, liq_data)
            
            # Transición de estado del ticket
            ticket_repo.update(self.db, ticket, {"estado": "LIQUIDADO"})
            
            if commit:
                self.db.commit()
                self.db.refresh(liquidacion)
                
            return liquidacion
        except Exception as e:
            if commit:
                self.db.rollback()
            raise ValueError(f"Error al generar liquidación: {str(e)}")
