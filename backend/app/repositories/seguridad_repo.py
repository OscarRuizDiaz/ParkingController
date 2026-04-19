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


usuario_repo = UsuarioRepository(Usuario)