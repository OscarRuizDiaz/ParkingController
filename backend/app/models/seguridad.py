from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base

class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "seguridad"}

    id_rol = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255))
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "seguridad"}

    id_usuario = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    email = Column(String(150))
    id_rol = Column(BigInteger, ForeignKey("seguridad.roles.id_rol"), nullable=False)
    activo = Column(Boolean, nullable=False, default=True)
    ultimo_acceso = Column(DateTime)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    rol = relationship("Rol", back_populates="usuarios")
