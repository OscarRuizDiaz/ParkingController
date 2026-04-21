from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.seguridad import Usuario, Rol
from app.repositories.seguridad_repo import usuario_repo
from app.core.security import get_password_hash
from app.schemas.seguridad import UsuarioCreate, UsuarioUpdate

class UsuarioService:
    def __init__(self, db: Session):
        self.db = db

    def get_usuarios(self, skip: int = 0, limit: int = 100) -> List[Usuario]:
        return usuario_repo.get_paginated_users(self.db, skip=skip, limit=limit)

    def get_usuario_por_id(self, id_usuario: int) -> Optional[Usuario]:
        return usuario_repo.get_by_id(self.db, id_usuario)

    def crear_usuario(self, user_in: UsuarioCreate) -> Usuario:
        # Validación de username único
        existing = usuario_repo.get_by_username(self.db, username=user_in.username)
        if existing:
            raise ValueError(f"El nombre de usuario '{user_in.username}' ya está en uso.")

        # Verificar rol existente
        rol = self.db.query(Rol).filter(Rol.id_rol == user_in.id_rol, Rol.activo.is_(True)).first()
        if not rol:
            raise ValueError(f"El rol con ID {user_in.id_rol} no existe o está inactivo.")

        user_data = {
            "username": user_in.username,
            "password_hash": get_password_hash(user_in.password),
            "nombre_completo": user_in.nombre_completo,
            "email": user_in.email,
            "id_rol": user_in.id_rol,
            "activo": True
        }
        user = usuario_repo.create(self.db, obj_in=user_data)
        self.db.commit()
        return usuario_repo.get_by_id(self.db, user.id_usuario)

    def actualizar_usuario(self, id_usuario: int, user_in: UsuarioUpdate) -> Usuario:
        user = usuario_repo.get_by_id(self.db, id_usuario)
        if not user:
            raise ValueError("Usuario no encontrado.")

        if user_in.id_rol is not None:
             rol = self.db.query(Rol).filter(Rol.id_rol == user_in.id_rol, Rol.activo.is_(True)).first()
             if not rol:
                raise ValueError(f"El rol con ID {user_in.id_rol} no existe o está inactivo.")
        
        update_data = user_in.model_dump(exclude_unset=True)
        user = usuario_repo.update(self.db, db_obj=user, obj_in=update_data)
        self.db.commit()
        return usuario_repo.get_by_id(self.db, user.id_usuario)

    def actualizar_estado(self, id_usuario: int, activo: bool, current_user_id: int) -> Usuario:
        user = usuario_repo.get_by_id(self.db, id_usuario)
        if not user:
            raise ValueError("Usuario no encontrado.")

        # REGLAS DE SEGURIDAD PARA DESACTIVACIÓN
        if not activo:
            # 1. Regla de Autodesactivación: Un admin no puede desactivarse a sí mismo
            if user.id_usuario == current_user_id:
                 if user.rol and user.rol.nombre == "ADMINISTRADOR":
                     raise ValueError("Un administrador no puede desactivarse a sí mismo para prevenir bloqueos accidentales.")

            # 2. Regla de Supervivencia: No dejar al sistema sin administradores
            if user.rol and user.rol.nombre == "ADMINISTRADOR":
                admins_activos = (
                    self.db.query(Usuario)
                    .join(Rol)
                    .filter(Rol.nombre == "ADMINISTRADOR", Usuario.activo.is_(True))
                    .count()
                )
                if admins_activos <= 1:
                    raise ValueError("No se puede desactivar al único administrador activo del sistema.")

        user.activo = activo
        self.db.commit()
        return usuario_repo.get_by_id(self.db, user.id_usuario)

    def reset_password(self, id_usuario: int, nueva_password: str) -> bool:
        user = usuario_repo.get_by_id(self.db, id_usuario)
        if not user:
            raise ValueError("Usuario no encontrado.")
        
        new_hash = get_password_hash(nueva_password)
        usuario_repo.update_password(self.db, id_usuario=id_usuario, password_hash=new_hash)
        return True
