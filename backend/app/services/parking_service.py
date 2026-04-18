from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.parking import Ticket, Liquidacion
from app.repositories.parking_repo import ticket_repo, tarifa_repo, liquidacion_repo
from app.schemas.parking import TicketCreate, LiquidacionCalculadaResponse
from app.services.tarifador import Tarifador


class ParkingService:
    """
    Servicio de capa de negocio para el dominio de Parking.
    """

    def __init__(self, db: Session):
        self.db = db
        self.tarifador = Tarifador()

    def registrar_ticket_recibido(self, ticket_in: TicketCreate) -> Ticket:
        """
        Registra un ticket generado por un proveedor externo.
        """
        existente = ticket_repo.get_by_codigo(self.db, ticket_in.codigo_ticket)
        if existente:
            raise ValueError(
                f"El ticket con código {ticket_in.codigo_ticket} ya existe en el sistema."
            )

        ticket_data = {
            "codigo_ticket": ticket_in.codigo_ticket,
            "fecha_hora_ingreso": ticket_in.fecha_hora_ingreso,
            "proveedor_origen": ticket_in.proveedor_origen,
            "estado": "PENDIENTE",
        }
        ticket_obj = ticket_repo.create(self.db, ticket_data)
        self.db.commit()
        return ticket_obj

    def buscar_ticket(self, codigo_ticket: str) -> Optional[Ticket]:
        """
        Busca y retorna un ticket por su código.
        """
        return ticket_repo.get_by_codigo(self.db, codigo_ticket)

    def simular_liquidacion(
        self,
        codigo_ticket: str,
        fecha_salida_simulada: Optional[datetime] = None,
    ) -> LiquidacionCalculadaResponse:
        """
        Simula el cálculo del importe a pagar usando las reglas tarifarias activas.
        Si el ticket ya está liquidado/cobrado/facturado, retorna el cálculo histórico congelado.
        """
        ticket = self.buscar_ticket(codigo_ticket)
        if not ticket:
            raise ValueError("Ticket no encontrado.")

        # Modo histórico: no recalcular
        if ticket.estado in ["LIQUIDADO", "COBRADO", "FACTURADO"]:
            ultima_liq = liquidacion_repo.get_ultima_by_ticket(self.db, ticket.id_ticket)
            if not ultima_liq:
                raise ValueError(
                    f"Inconsistencia: El ticket está en estado {ticket.estado} "
                    "pero no posee registros de liquidación."
                )

            return LiquidacionCalculadaResponse(
                codigo_ticket=ticket.codigo_ticket,
                minutos_calculados=ultima_liq.minutos,
                tolerancia_aplicada=False,
                bloques=ultima_liq.bloques,
                monto_a_cobrar=ultima_liq.monto_bruto,
                detalle_calculo=ultima_liq.detalle_calculo_json or {},
                modo_visualizacion="HISTORICO",
            )

        tarifa = tarifa_repo.get_tarifa_activa(self.db)
        if not tarifa:
            raise ValueError("Base de datos sin tarifa activa configurada.")

        salida_real = fecha_salida_simulada or datetime.now()
        diferencia = salida_real - ticket.fecha_hora_ingreso
        minutos = max(0, int(diferencia.total_seconds() / 60))

        res_calculo = self.tarifador.calcular(tarifa, minutos)

        return LiquidacionCalculadaResponse(
            codigo_ticket=ticket.codigo_ticket,
            minutos_calculados=minutos,
            tolerancia_aplicada=False,
            bloques=res_calculo["cant_bloques"],
            monto_a_cobrar=res_calculo["monto_total"],
            detalle_calculo=res_calculo["detalle"],
            modo_visualizacion="DINAMICO",
        )

    def generar_liquidacion(
        self,
        codigo_ticket: str,
        id_usuario_creador: Optional[int] = None,
        commit: bool = True,
    ) -> Liquidacion:
        """
        Persiste el cálculo de una liquidación real en la base de datos con estado CALCULADO.
        """
        ticket = self.buscar_ticket(codigo_ticket)
        if not ticket:
            raise ValueError("Ticket no encontrado para generar liquidación.")

        tarifa = tarifa_repo.get_tarifa_activa(self.db)
        if not tarifa:
            raise ValueError("Tarifa activa no encontrada para generar liquidación.")

        if ticket.estado not in ["PENDIENTE"]:
            raise ValueError(
                f"El ticket está en estado {ticket.estado} y no puede ser liquidado de nuevo."
            )

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
                "creado_por": id_usuario_creador,
            }

            liquidacion = liquidacion_repo.create(self.db, liq_data)
            ticket_repo.update(self.db, ticket, {"estado": "LIQUIDADO"})

            if commit:
                self.db.commit()
                self.db.refresh(liquidacion)

            return liquidacion

        except Exception as e:
            if commit:
                self.db.rollback()
            raise ValueError(f"Error al generar liquidación: {str(e)}")

    def simular_liquidacion_manual(
        self,
        codigo_ticket: str,
        minutos: int,
    ) -> LiquidacionCalculadaResponse:
        """
        Simula el cálculo del importe usando minutos ingresados manualmente.
        Permite simulación incluso si el ticket no existe aún en la base de datos.
        """
        if minutos < 0:
            raise ValueError("Los minutos no pueden ser negativos para el cálculo manual.")

        tarifa = tarifa_repo.get_tarifa_activa(self.db)
        if not tarifa:
            raise ValueError("Base de datos sin tarifa activa configurada.")

        ticket_existia = ticket_repo.get_by_codigo(self.db, codigo_ticket) is not None
        res_calculo = self.tarifador.calcular(tarifa, minutos)

        detalle_manual = {
            **res_calculo["detalle"],
            "origen_calculo": "MANUAL",
            "tipo_ticket": "MANUAL",
            "ticket_existia_previamente": ticket_existia,
        }

        return LiquidacionCalculadaResponse(
            codigo_ticket=codigo_ticket,
            minutos_calculados=minutos,
            tolerancia_aplicada=False,
            bloques=res_calculo["cant_bloques"],
            monto_a_cobrar=res_calculo["monto_total"],
            detalle_calculo=detalle_manual,
            modo_visualizacion="DINAMICO",
        )

    def generar_liquidacion_manual(
        self,
        codigo_ticket: str,
        minutos: int,
        id_usuario_creador: Optional[int] = None,
        commit: bool = True,
    ) -> Liquidacion:
        """
        Genera una liquidación persistida basada en entrada manual.
        Si el ticket no existe, lo crea automáticamente con proveedor_origen='MANUAL'.
        """
        ticket = self.buscar_ticket(codigo_ticket)
        ticket_existia = ticket is not None

        try:
            if not ticket:
                ticket_data = {
                    "codigo_ticket": codigo_ticket,
                    "fecha_hora_ingreso": datetime.now(),  # referencial
                    "proveedor_origen": "MANUAL",
                    "estado": "PENDIENTE",
                }
                ticket = ticket_repo.create(self.db, ticket_data)

            if ticket.estado not in ["PENDIENTE"]:
                raise ValueError(
                    f"El ticket está en estado {ticket.estado} y no puede ser reliquidado manualmente."
                )

            simulacion = self.simular_liquidacion_manual(codigo_ticket, minutos)

            tarifa = tarifa_repo.get_tarifa_activa(self.db)
            if not tarifa:
                raise ValueError("Tarifa activa no encontrada para generar liquidación manual.")

            simulacion.detalle_calculo["ticket_existia_previamente"] = ticket_existia

            liq_data = {
                "id_ticket": ticket.id_ticket,
                "id_tarifa": tarifa.id_tarifa,
                "minutos": simulacion.minutos_calculados,
                "bloques": simulacion.bloques,
                "monto_bruto": simulacion.monto_a_cobrar,
                "detalle_calculo_json": simulacion.detalle_calculo,
                "estado": "CALCULADO",
                "creado_por": id_usuario_creador,
            }

            liquidacion = liquidacion_repo.create(self.db, liq_data)
            ticket_repo.update(self.db, ticket, {"estado": "LIQUIDADO"})

            if commit:
                self.db.commit()
                self.db.refresh(liquidacion)

            return liquidacion

        except Exception as e:
            if commit:
                self.db.rollback()
            raise ValueError(f"Error al generar liquidación manual: {str(e)}")