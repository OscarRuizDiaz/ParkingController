from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, func, UniqueConstraint
from app.models.base import Base

class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        UniqueConstraint('tipo_documento', 'numero_documento', name='uq_clientes_documento'),
        {"schema": "maestros"}
    )

    id_cliente = Column(BigInteger, primary_key=True, autoincrement=True)
    tipo_documento = Column(String(20), nullable=False)
    numero_documento = Column(String(30), nullable=False)
    nombre_razon_social = Column(String(200), nullable=False)
    direccion = Column(String(255))
    telefono = Column(String(50))
    email = Column(String(150))
    tipo_contribuyente = Column(String(30))
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())
    actualizado_en = Column(DateTime)
