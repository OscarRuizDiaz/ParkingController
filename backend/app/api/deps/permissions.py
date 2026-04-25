from typing import Callable
from fastapi import Depends, HTTPException, status
from app.api.v1.deps import get_current_user
from app.models.seguridad import Usuario

def require_permission(codigo_permiso: str) -> Callable:
    """
    Factory que retorna una dependencia para validar un permiso específico.
    Se apoya en la precarga del rol y permisos realizada en la Fase 1
    dentro del repositorio de seguridad.
    """
    def permission_dependency(
        current_user: Usuario = Depends(get_current_user)
    ) -> Usuario:
        # 1. Validar que el usuario esté activo (ya se hace en get_current_user, pero reforzamos)
        if not current_user.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        # 2. Validar que el rol esté activo y los permisos existan
        rol = current_user.rol
        if not rol or not rol.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El rol del usuario no está activo o no está asignado"
            )

        # 3. Validar existencia del permiso en el set dinámico del usuario
        # Gracias al joinedload de la Fase 1, rol.permisos ya está en memoria
        permisos = rol.permisos or []
        codigos_usuario = {p.codigo for p in permisos if p.activo}
        
        if codigo_permiso not in codigos_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para esta operación"
            )

        return current_user

    return permission_dependency


def require_any_permission(codigos_permiso: list[str]) -> Callable:
    """
    Factory que retorna una dependencia para validar si el usuario tiene al menos
    uno de los permisos en la lista (Lógica OR).
    """
    def permission_dependency(
        current_user: Usuario = Depends(get_current_user)
    ) -> Usuario:
        if not current_user.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        rol = current_user.rol
        if not rol or not rol.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El rol del usuario no está activo o no está asignado"
            )

        permisos = rol.permisos or []
        codigos_usuario = {p.codigo for p in permisos if p.activo}
        
        if not any(codigo in codigos_usuario for codigo in codigos_permiso):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para esta operación"
            )

        return current_user

    return permission_dependency
