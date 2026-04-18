from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.ventas import Cobro, Caja, TurnoCaja
from app.models.seguridad import Usuario

class RepositorioCobro(BaseRepository[Cobro]):
    def get_by_liquidacion(self, db: Session, id_liquidacion: int) -> Optional[Cobro]:
        """Busca un cobro asociado a una liquidación específica."""
        return db.query(Cobro).filter(Cobro.id_liquidacion == id_liquidacion).first()

class RepositorioTurno(BaseRepository[TurnoCaja]):
    def get_turno_abierto_por_usuario(self, db: Session, id_usuario: int) -> Optional[TurnoCaja]:
        """Busca un turno abierto activo para un usuario específico."""
        return (
            db.query(TurnoCaja)
            .filter(TurnoCaja.id_usuario == id_usuario)
            .filter(TurnoCaja.estado == 'ABIERTO')
            .order_by(TurnoCaja.fecha_hora_apertura.desc())
            .first()
        )

class RepositorioCaja(BaseRepository[Caja]):
    pass

# Instancias pre-configuradas
cobro_repo = RepositorioCobro(Cobro)
turno_repo = RepositorioTurno(TurnoCaja)
caja_repo = RepositorioCaja(Caja)
