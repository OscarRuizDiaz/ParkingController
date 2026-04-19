from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Text, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base


class Permiso(Base):
    __tablename__ = "permisos"
    __table_args__ = {"schema": "seguridad"}

    id_permiso = Column(BigInteger, primary_key=True, autoincrement=True)
    codigo = Column(String(100), nullable=False, unique=True, index=True)
    modulo = Column(String(50), nullable=False)
    descripcion = Column(String(255))
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    roles = relationship("Rol", secondary="seguridad.roles_permisos", back_populates="permisos")


class RolPermiso(Base):
    __tablename__ = "roles_permisos"
    __table_args__ = (
        UniqueConstraint("id_rol", "id_permiso", name="uix_rol_permiso"),
        {"schema": "seguridad"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_rol = Column(BigInteger, ForeignKey("seguridad.roles.id_rol"), nullable=False)
    id_permiso = Column(BigInteger, ForeignKey("seguridad.permisos.id_permiso"), nullable=False)


class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "seguridad"}

    id_rol = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255))
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    usuarios = relationship("Usuario", back_populates="rol")
    permisos = relationship("Permiso", secondary="seguridad.roles_permisos", back_populates="roles")


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