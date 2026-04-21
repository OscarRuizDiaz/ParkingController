import logging
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from app.models.seguridad import Usuario, Rol
from app.core.security import verify_password
from app.repositories.base import BaseRepository

logger = logging.getLogger("app.repository.seguridad")


class UsuarioRepository(BaseRepository[Usuario]):
    def authenticate(self, db: Session, username: str, password: str) -> Optional[Usuario]:
        logger.info(f"Intentando autenticar usuario: {username}")

        user = (
            db.query(self.model)
            .options(joinedload(self.model.rol).joinedload(Rol.permisos))
            .filter(
                self.model.username == username,
                self.model.activo.is_(True)
            )
            .first()
        )

        if not user:
            logger.warning(f"Autenticación fallida: Usuario '{username}' no encontrado en BD")
            return None

        if not verify_password(password, user.password_hash):
            logger.warning(f"Autenticación fallida: Contraseña incorrecta para usuario '{username}'")
            return None

        logger.info(f"Autenticación exitosa: Usuario '{username}' validado correctamente")
        return user

    def get_by_id(self, db: Session, id_usuario: int) -> Optional[Usuario]:
        return (
            db.query(self.model)
            .options(joinedload(self.model.rol).joinedload(Rol.permisos))
            .filter(self.model.id_usuario == id_usuario)
            .first()
        )

    def get_by_username(self, db: Session, username: str) -> Optional[Usuario]:
        return (
            db.query(self.model)
            .options(joinedload(self.model.rol).joinedload(Rol.permisos))
            .filter(self.model.username == username)
            .first()
        )

    def get_paginated_users(self, db: Session, skip: int = 0, limit: int = 100):
        return (
            db.query(self.model)
            .options(joinedload(self.model.rol).joinedload(Rol.permisos))
            .order_by(self.model.id_usuario)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_password(self, db: Session, id_usuario: int, password_hash: str):
        db.query(self.model).filter(self.model.id_usuario == id_usuario).update({"password_hash": password_hash})
        db.commit()


usuario_repo = UsuarioRepository(Usuario)