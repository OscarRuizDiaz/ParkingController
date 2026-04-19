from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.ventas import Cobro, Caja, TurnoCaja
from decimal import Decimal
from sqlalchemy import func
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

    def get_turno_abierto_por_caja(self, db: Session, id_caja: int) -> Optional[TurnoCaja]:
        """Busca si una caja específica ya tiene un turno abierto activo."""
        return (
            db.query(TurnoCaja)
            .filter(TurnoCaja.id_caja == id_caja)
            .filter(TurnoCaja.estado == 'ABIERTO')
            .first()
        )

    def get_total_por_medio_pago(self, db: Session, id_turno: int, medio_pago: str) -> Decimal:
        """Suma el total cobrado por un medio de pago específico en un turno."""
        resultado = (
            db.query(func.sum(Cobro.monto))
            .filter(Cobro.id_turno == id_turno)
            .filter(Cobro.medio_pago == medio_pago)
            .filter(Cobro.estado == 'COBRADO')
            .scalar()
        )
        return Decimal(str(resultado or 0))

    def get_cantidad_cobros(self, db: Session, id_turno: int) -> int:
        """Retorna la cantidad de cobros realizados en un turno."""
        return db.query(func.count(Cobro.id_cobro)).filter(Cobro.id_turno == id_turno).filter(Cobro.estado == 'COBRADO').scalar()

class RepositorioCaja(BaseRepository[Caja]):
    pass

# Instancias pre-configuradas
cobro_repo = RepositorioCobro(Cobro)
turno_repo = RepositorioTurno(TurnoCaja)
caja_repo = RepositorioCaja(Caja)
