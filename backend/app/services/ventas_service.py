from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.parking import Ticket, Liquidacion
from app.models.seguridad import Usuario
from app.models.ventas import Cobro, TurnoCaja
from app.repositories.ventas_repo import cobro_repo, turno_repo, caja_repo
from app.repositories.parking_repo import ticket_repo, liquidacion_repo
from app.services.parking_service import ParkingService
from app.schemas.ventas import CobroCreate, CobroResponse, TurnoCajaResumenResponse

class VentasService:
    def __init__(self, db: Session):
        self.db = db
        self.parking_service = ParkingService(db)

    def _get_demo_user(self) -> Usuario:
        """Obtiene el usuario demo para esta fase del proyecto."""
        user = self.db.query(Usuario).filter(Usuario.username == 'cajero_demo').first()
        if not user:
            raise ValueError("Usuario demo 'cajero_demo' no encontrado. Ejecute seeds.")
        return user

    def registrar_cobro(self, cobro_in: CobroCreate) -> CobroResponse:
        """
        Registra un cobro real vinculando liquidación, turno y ticket.
        Usa una transacción atómica controlada íntegramente por este método.
        """
        user = self._get_demo_user()
        
        # 1. Validar turno abierto
        turno = turno_repo.get_turno_abierto_por_usuario(self.db, user.id_usuario)
        if not turno:
            raise ValueError("No hay un turno de caja abierto para este usuario.")

        # 2. Validar-Obtener Ticket (Ahora soportamos creación automática en manual)
        ticket = ticket_repo.get_by_codigo(self.db, cobro_in.codigo_ticket)
        
        # Si no existe y NO es manual, error
        if not ticket and cobro_in.minutos_manuales is None:
            raise ValueError(f"Ticket {cobro_in.codigo_ticket} no encontrado y no se proporcionaron minutos manuales.")

        if ticket and (ticket.estado == 'COBRADO' or ticket.estado == 'FACTURADO'):
            raise ValueError("El ticket ya ha sido cobrado previamente.")

        # 3. Asegurar Liquidación y Validar Estado
        try:
            # FLUJO MANUAL: Si vienen minutos_manuales, usamos la lógica manual persistida
            if cobro_in.minutos_manuales is not None:
                liquidacion = self.parking_service.generar_liquidacion_manual(
                    cobro_in.codigo_ticket,
                    cobro_in.minutos_manuales,
                    user.id_usuario,
                    commit=False
                )
                # Refrescamos el ticket porque pudo haber sido creado en el paso anterior
                if not ticket:
                    ticket = ticket_repo.get_by_codigo(self.db, cobro_in.codigo_ticket)
            
            # FLUJO AUTOMÁTICO: Lógica actual basada en tiempo
            elif ticket.estado == 'PENDIENTE':
                liquidacion = self.parking_service.generar_liquidacion(
                    ticket.codigo_ticket, 
                    user.id_usuario, 
                    commit=False
                )
            else:
                # Si ya está LIQUIDADO, buscamos la liquidación existente
                liquidacion = liquidacion_repo.get_ultima_by_ticket(self.db, ticket.id_ticket)
                if not liquidacion:
                    liquidacion = self.parking_service.generar_liquidacion(
                        ticket.codigo_ticket, 
                        user.id_usuario, 
                        commit=False
                    )

            # --- VALIDACIONES DE LIQUIDACIÓN ---
            if liquidacion.estado == 'CONFIRMADO':
                raise ValueError("La liquidación ya ha sido confirmada/cobrada anteriormente.")
            
            if liquidacion.estado != 'CALCULADO':
                raise ValueError(f"La liquidación está en estado {liquidacion.estado} y no puede ser cobrada.")

            # Validación explícita de duplicado por liquidación (Ajuste solicitado)
            cobro_existente = cobro_repo.get_by_liquidacion(self.db, liquidacion.id_liquidacion)
            if cobro_existente:
                raise ValueError(f"Ya existe un cobro registrado para la liquidación #{liquidacion.id_liquidacion}. Operación cancelada para evitar duplicidad.")

            # 4. Registrar Cobro
            cobro_data = {
                "id_liquidacion": liquidacion.id_liquidacion,
                "id_turno": turno.id_turno,
                "medio_pago": cobro_in.medio_pago,
                "monto": liquidacion.monto_bruto,
                "estado": 'COBRADO',
                "cobrado_por": user.id_usuario,
                "observacion": cobro_in.observacion
            }
            nuevo_cobro = cobro_repo.create(self.db, cobro_data)

            # Actualizar estados corporativos
            ticket_repo.update(self.db, ticket, {"estado": "COBRADO"})
            liquidacion_repo.update(self.db, liquidacion, {"estado": "CONFIRMADO"})

            # COMMIT FINAL ÚNICO (Control total de la transacción)
            self.db.commit()
            self.db.refresh(nuevo_cobro)

            return CobroResponse(
                id_cobro=nuevo_cobro.id_cobro,
                id_liquidacion=nuevo_cobro.id_liquidacion,
                medio_pago=nuevo_cobro.medio_pago,
                monto=nuevo_cobro.monto,
                estado=nuevo_cobro.estado,
                cobrado_en=nuevo_cobro.cobrado_en,
                codigo_ticket=ticket.codigo_ticket,
                nombre_cajero=user.nombre_completo
            )
        except Exception as e:
            self.db.rollback()
            # Si el error es una de nuestras validaciones, propagamos el mensaje
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Error al procesar el cobro: {str(e)}")

    def abrir_turno(self, id_caja: int, monto_inicial: Decimal) -> TurnoCaja:
        """Abre un nuevo turno de caja para el usuario demo."""
        user = self._get_demo_user()
        
        # 1. Validar si el USUARIO ya tiene un turno abierto
        existente_usr = turno_repo.get_turno_abierto_por_usuario(self.db, user.id_usuario)
        if existente_usr:
            raise ValueError(f"El usuario {user.username} ya tiene un turno abierto (ID {existente_usr.id_turno}).")
        
        # 2. Validar si la CAJA ya tiene un turno abierto (Evitar duplicidad física)
        existente_caja = turno_repo.get_turno_abierto_por_caja(self.db, id_caja)
        if existente_caja:
            raise ValueError(f"La caja #{id_caja} ya tiene un turno abierto activo por otro usuario.")

        turno_data = {
            "id_caja": id_caja,
            "id_usuario": user.id_usuario,
            "monto_inicial": monto_inicial,
            "estado": "ABIERTO",
            "fecha_hora_apertura": datetime.now()
        }
        
        nuevo_turno = turno_repo.create(self.db, turno_data)
        self.db.commit()
        return nuevo_turno

    def get_turno_actual(self) -> Optional[TurnoCaja]:
        """Retorna el turno abierto actual del usuario demo."""
        user = self._get_demo_user()
        return turno_repo.get_turno_abierto_por_usuario(self.db, user.id_usuario)

    def cerrar_turno(self, monto_final_declarado: Decimal) -> TurnoCaja:
        """Cierra el turno actual y calcula la diferencia operativa."""
        turno = self.get_turno_actual()
        if not turno:
            raise ValueError("No hay un turno abierto para cerrar.")
        
        resumen = self.get_resumen_turno(turno.id_turno)
        
        # Regla: diferencia = monto_final_declarado - (monto_inicial + total_efectivo)
        diferencia = monto_final_declarado - (turno.monto_inicial + resumen.total_efectivo)
        
        update_data = {
            "fecha_hora_cierre": datetime.now(),
            "monto_final": monto_final_declarado,
            "diferencia": diferencia,
            "estado": "CERRADO"
        }
        
        turno_cerrado = turno_repo.update(self.db, turno, update_data)
        self.db.commit()
        return turno_cerrado

    def get_resumen_turno(self, id_turno: int) -> TurnoCajaResumenResponse:
        """Genera un resumen completo del estado de un turno."""
        turno = turno_repo.get(self.db, id_turno)
        if not turno:
            raise ValueError("Turno no encontrado.")
            
        caja = caja_repo.get(self.db, turno.id_caja)
        user = self._get_demo_user()
        
        total_efectivo = turno_repo.get_total_por_medio_pago(self.db, id_turno, "EFECTIVO")
        total_transferencia = turno_repo.get_total_por_medio_pago(self.db, id_turno, "TRANSFERENCIA")
        total_tarjeta = turno_repo.get_total_por_medio_pago(self.db, id_turno, "TARJETA")
        cantidad_cobros = turno_repo.get_cantidad_cobros(self.db, id_turno)
        
        total_cobrado = total_efectivo + total_transferencia + total_tarjeta
        
        # Calcular diferencia si está cerrado
        diferencia = None
        if turno.estado == "CERRADO":
            diferencia = turno.monto_final - (turno.monto_inicial + total_efectivo)
            
        return TurnoCajaResumenResponse(
            id_turno=turno.id_turno,
            id_caja=turno.id_caja,
            nombre_caja=caja.nombre if caja else "Caja desconocida",
            estado=turno.estado,
            fecha_hora_apertura=turno.fecha_hora_apertura,
            fecha_hora_cierre=turno.fecha_hora_cierre,
            monto_inicial=turno.monto_inicial,
            monto_final=turno.monto_final,
            total_cobrado=total_cobrado,
            total_efectivo=total_efectivo,
            total_transferencia=total_transferencia,
            total_tarjeta=total_tarjeta,
            cantidad_cobros=cantidad_cobros,
            diferencia=diferencia,
            usuario_nombre=user.nombre_completo
        )
