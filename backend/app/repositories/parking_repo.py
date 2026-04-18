from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.parking import Ticket, Tarifa, Liquidacion
from datetime import datetime

class RepositorioTicket(BaseRepository[Ticket]):
    def get_by_codigo(self, db: Session, codigo: str) -> Optional[Ticket]:
        """Busca un ticket específico usando su código único impreso."""
        return db.query(Ticket).filter(Ticket.codigo_ticket == codigo).first()

class RepositorioTarifa(BaseRepository[Tarifa]):
    def get_tarifa_activa(self, db: Session) -> Optional[Tarifa]:
        ahora = datetime.now()
        return (
            db.query(Tarifa)
            .filter(Tarifa.activo.is_(True))
            .filter(Tarifa.vigencia_desde <= ahora)
            .filter((Tarifa.vigencia_hasta.is_(None)) | (Tarifa.vigencia_hasta >= ahora))
            .first()
        )

class RepositorioLiquidacion(BaseRepository[Liquidacion]):
    def get_ultima_by_ticket(self, db: Session, id_ticket: int) -> Optional[Liquidacion]:
        """Obtiene el último cálculo de liquidación generado para un ticket."""
        return db.query(Liquidacion).filter(
            Liquidacion.id_ticket == id_ticket
        ).order_by(Liquidacion.creado_en.desc()).first()


# Instancias pre-configuradas para uso rápido
ticket_repo = RepositorioTicket(Ticket)
tarifa_repo = RepositorioTarifa(Tarifa)
liquidacion_repo = RepositorioLiquidacion(Liquidacion)
