from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.parking import Ticket, Liquidacion
from app.models.seguridad import Usuario
from app.models.ventas import Cobro, TurnoCaja, Caja
from app.repositories.ventas_repo import cobro_repo, turno_repo, caja_repo
from app.repositories.parking_repo import ticket_repo, liquidacion_repo
from app.services.parking_service import ParkingService
from app.schemas.ventas import CobroCreate, CobroResponse, TurnoCajaResumenResponse, CierreForzadoRequest

class VentasService:
    def __init__(self, db: Session):
        self.db = db
        self.parking_service = ParkingService(db)

    def registrar_cobro(self, cobro_in: CobroCreate, user_id: int) -> CobroResponse:
        """
        Registra un cobro real vinculando liquidación, turno y ticket.
        Usa el user_id autenticado.
        """
        user = self.db.query(Usuario).get(user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")
        
        # 1. Validar turno abierto
        turno = turno_repo.get_turno_abierto_por_usuario(self.db, user_id)
        if not turno:
            raise ValueError("No hay un turno de caja abierto para este usuario.")

        # 2. Validar-Obtener Ticket
        ticket = ticket_repo.get_by_codigo(self.db, cobro_in.codigo_ticket)
        
        if not ticket and cobro_in.minutos_manuales is None:
            raise ValueError(f"Ticket {cobro_in.codigo_ticket} no encontrado y no se proporcionaron minutos manuales.")

        if ticket and (ticket.estado == 'COBRADO' or ticket.estado == 'FACTURADO'):
            raise ValueError("El ticket ya ha sido cobrado previamente.")

        # 3. Asegurar Liquidación
        try:
            if cobro_in.minutos_manuales is not None:
                liquidacion = self.parking_service.generar_liquidacion_manual(
                    cobro_in.codigo_ticket,
                    cobro_in.minutos_manuales,
                    user_id,
                    commit=False
                )
                if not ticket:
                    ticket = ticket_repo.get_by_codigo(self.db, cobro_in.codigo_ticket)
            
            elif ticket.estado == 'PENDIENTE':
                liquidacion = self.parking_service.generar_liquidacion(
                    ticket.codigo_ticket, 
                    user_id, 
                    commit=False
                )
            else:
                liquidacion = liquidacion_repo.get_ultima_by_ticket(self.db, ticket.id_ticket)
                if not liquidacion:
                    liquidacion = self.parking_service.generar_liquidacion(
                        ticket.codigo_ticket, 
                        user_id, 
                        commit=False
                    )

            if liquidacion.estado == 'CONFIRMADO':
                raise ValueError("La liquidación ya ha sido confirmada/cobrada anteriormente.")
            
            if liquidacion.estado != 'CALCULADO':
                raise ValueError(f"La liquidación está en estado {liquidacion.estado} y no puede ser cobrada.")

            cobro_existente = cobro_repo.get_by_liquidacion(self.db, liquidacion.id_liquidacion)
            if cobro_existente:
                raise ValueError(f"Ya existe un cobro registrado para la liquidación #{liquidacion.id_liquidacion}.")

            # 4. Registrar Cobro
            cobro_data = {
                "id_liquidacion": liquidacion.id_liquidacion,
                "id_turno": turno.id_turno,
                "medio_pago": cobro_in.medio_pago,
                "monto": liquidacion.monto_bruto,
                "estado": 'COBRADO',
                "cobrado_por": user_id,
                "observacion": cobro_in.observacion
            }
            nuevo_cobro = cobro_repo.create(self.db, cobro_data)

            ticket_repo.update(self.db, ticket, {"estado": "COBRADO"})
            liquidacion_repo.update(self.db, liquidacion, {"estado": "CONFIRMADO"})

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
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Error al procesar el cobro: {str(e)}")

    def abrir_turno(self, id_caja: int, monto_inicial: Decimal, user_id: int) -> TurnoCaja:
        """Abre un nuevo turno de caja con validaciones de aislamiento operativo."""
        try:
            # 1. Validar si el USUARIO ya tiene un turno abierto
            existente_usr = turno_repo.get_turno_abierto_por_usuario(self.db, user_id)
            if existente_usr:
                raise ValueError("Usted ya tiene un turno abierto. Debe cerrarlo antes de iniciar uno nuevo.")
            
            # 2. Validar si la CAJA ya tiene un turno abierto
            existente_caja = turno_repo.get_turno_abierto_por_caja(self.db, id_caja)
            if existente_caja:
                raise ValueError("Esta posición de caja ya se encuentra ocupada por otro usuario.")

            turno_data = {
                "id_caja": id_caja,
                "id_usuario": user_id,
                "monto_inicial": monto_inicial,
                "estado": "ABIERTO",
                "fecha_hora_apertura": datetime.now()
            }
            
            nuevo_turno = turno_repo.create(self.db, turno_data)
            self.db.commit()
            return nuevo_turno
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Error de integridad: Ya existe un turno abierto para este usuario o caja.")
        except Exception as e:
            self.db.rollback()
            if isinstance(e, ValueError): raise e
            raise ValueError(f"No se pudo abrir el turno: {str(e)}")

    def get_turno_actual(self, user_id: int) -> Optional[TurnoCaja]:
        """Retorna el turno abierto actual del usuario autenticado."""
        return turno_repo.get_turno_abierto_por_usuario(self.db, user_id)

    def cerrar_turno(self, monto_final_declarado: Decimal, user_id: int) -> TurnoCaja:
        """Cierra el turno propio del usuario."""
        turno = self.get_turno_actual(user_id)
        if not turno:
            raise ValueError("No tiene un turno abierto para cerrar.")
        return self._ejecutar_cierre(turno, monto_final_declarado, user_id)

    def cerrar_turno_forzado(self, id_turno: int, supervisor_id: int, req: CierreForzadoRequest) -> TurnoCaja:
        """Realiza un cierre administrativo auditado de un turno ajeno."""
        turno = turno_repo.get(self.db, id_turno)
        if not turno:
            raise ValueError("Turno no encontrado.")
        if turno.estado != "ABIERTO":
            raise ValueError(f"El turno ya se encuentra en estado {turno.estado}.")
        
        # Validación: No auto-cerrarse forzadamente
        if turno.id_usuario == supervisor_id:
            raise ValueError("No puede realizar un cierre forzado sobre su propio turno. Use el cierre estándar.")
        
        return self._ejecutar_cierre(turno, req.monto_final_declarado, supervisor_id, req.motivo)

    def _ejecutar_cierre(self, turno: TurnoCaja, monto_final: Decimal, id_usuario_cierre: int, motivo: str = None) -> TurnoCaja:
        """Lógica común de cierre con cálculo de diferencia."""
        resumen = self.get_resumen_turno(turno.id_turno)
        diferencia = monto_final - (turno.monto_inicial + resumen.total_efectivo)
        
        update_data = {
            "fecha_hora_cierre": datetime.now(),
            "monto_final": monto_final,
            "diferencia": diferencia,
            "estado": "CERRADO",
            "id_usuario_cierre": id_usuario_cierre,
            "motivo_cierre": motivo
        }
        
        turno_cerrado = turno_repo.update(self.db, turno, update_data)
        self.db.commit()
        return turno_cerrado

    def get_turnos_abiertos(self) -> List[TurnoCaja]:
        """Lista todos los turnos abiertos del sistema (Supervisión)."""
        return self.db.query(TurnoCaja).filter(TurnoCaja.estado == 'ABIERTO').all()

    def get_resumen_turno(self, id_turno: int) -> TurnoCajaResumenResponse:
        """Genera un resumen completo del estado de un turno."""
        turno = turno_repo.get(self.db, id_turno)
        if not turno:
            raise ValueError("Turno no encontrado.")
            
        caja = caja_repo.get(self.db, turno.id_caja)
        user = self.db.query(Usuario).get(turno.id_usuario)
        
        total_efectivo = turno_repo.get_total_por_medio_pago(self.db, id_turno, "EFECTIVO")
        total_transferencia = turno_repo.get_total_por_medio_pago(self.db, id_turno, "TRANSFERENCIA")
        total_tarjeta = turno_repo.get_total_por_medio_pago(self.db, id_turno, "TARJETA")
        cantidad_cobros = turno_repo.get_cantidad_cobros(self.db, id_turno)
        
        total_cobrado = total_efectivo + total_transferencia + total_tarjeta
        
        # Calcular diferencia si está cerrado
        diferencia = None
        if turno.estado == "CERRADO":
            diferencia = turno.monto_final - (turno.monto_inicial + total_efectivo)
            
        # Obtener nombre de quien cerró
        usuario_cierre_nombre = None
        if turno.id_usuario_cierre:
            u_cierre = self.db.query(Usuario).get(turno.id_usuario_cierre)
            if u_cierre: usuario_cierre_nombre = u_cierre.nombre_completo

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
            usuario_nombre=user.nombre_completo if user else "---",
            id_usuario=turno.id_usuario,
            id_usuario_cierre=turno.id_usuario_cierre,
            usuario_cierre_nombre=usuario_cierre_nombre,
            motivo_cierre=turno.motivo_cierre
        )
