from sqlalchemy import Column, BigInteger, String, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base

class Evento(Base):
    __tablename__ = "eventos"
    __table_args__ = {"schema": "audit"}

    id_evento = Column(BigInteger, primary_key=True, autoincrement=True)
    modulo = Column(String(50), nullable=False)
    entidad = Column(String(50), nullable=False)
    id_entidad = Column(BigInteger)
    accion = Column(String(50), nullable=False)
    detalle_json = Column(JSONB)
    usuario = Column(String(100))
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())
    ip_origen = Column(String(50))
