from sqlalchemy.orm import Session
from app.models.parking import Ticket, Liquidacion
from app.models.seguridad import Usuario
from app.models.ventas import Cobro, TurnoCaja
from app.repositories.ventas_repo import cobro_repo, turno_repo
from app.repositories.parking_repo import ticket_repo, liquidacion_repo
from app.services.parking_service import ParkingService
from app.schemas.ventas import CobroCreate, CobroResponse

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

        # 2. Validar Ticket
        ticket = ticket_repo.get_by_codigo(self.db, cobro_in.codigo_ticket)
        if not ticket:
            raise ValueError(f"Ticket {cobro_in.codigo_ticket} no encontrado.")

        if ticket.estado == 'COBRADO' or ticket.estado == 'FACTURADO':
            raise ValueError("El ticket ya ha sido cobrado previamente.")

        # 3. Asegurar Liquidación y Validar Estado
        # Iniciamos bloque transaccional explícito
        try:
            # Si está en PENDIENTE, generamos liquidación dentro de nuestra transacción (commit=False)
            if ticket.estado == 'PENDIENTE':
                liquidacion = self.parking_service.generar_liquidacion(
                    ticket.codigo_ticket, 
                    user.id_usuario, 
                    commit=False
                )
            else:
                # Si ya está LIQUIDADO, buscamos la liquidación existente
                liquidacion = liquidacion_repo.get_ultima_by_ticket(self.db, ticket.id_ticket)
                if not liquidacion:
                    # Caso de recuperación de estado
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
