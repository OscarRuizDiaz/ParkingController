from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1 import deps
from app.api.deps.permissions import require_permission
from app.models.seguridad import Usuario
from app.schemas.seguridad import (
    UsuarioAdminResponse, 
    UsuarioCreate, 
    UsuarioUpdate, 
    UsuarioStatusUpdate, 
    UsuarioPasswordReset
)
from app.services.usuario_service import UsuarioService

router = APIRouter()

def build_usuario_admin_response(u: Usuario) -> dict:
    """
    Helper para normalizar la respuesta de usuario administrativo y evitar repetición de mapping manual.
    """
    return {
        "id_usuario": u.id_usuario,
        "username": u.username,
        "nombre_completo": u.nombre_completo,
        "email": u.email,
        "activo": u.activo,
        "id_rol": u.id_rol,
        "nombre_rol": u.rol.nombre if u.rol else "N/A",
        "creado_en": u.creado_en
    }

@router.get("/", response_model=List[UsuarioAdminResponse])
def get_usuarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    _perm: Any = Depends(require_permission("usuarios.view"))
) -> Any:
    """
    Listar usuarios (solo lectura).
    """
    service = UsuarioService(db)
    users = service.get_usuarios(skip=skip, limit=limit)
    return [build_usuario_admin_response(u) for u in users]

@router.post("/", response_model=UsuarioAdminResponse)
def crear_usuario(
    user_in: UsuarioCreate,
    db: Session = Depends(get_db),
    _perm: Any = Depends(require_permission("usuarios.manage"))
) -> Any:
    """
    Crear un nuevo usuario.
    """
    service = UsuarioService(db)
    try:
        u = service.crear_usuario(user_in)
        return build_usuario_admin_response(u)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id_usuario}", response_model=UsuarioAdminResponse)
def get_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    _perm: Any = Depends(require_permission("usuarios.view"))
) -> Any:
    """
    Obtener detalle de un usuario.
    """
    service = UsuarioService(db)
    u = service.get_usuario_por_id(id_usuario)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return build_usuario_admin_response(u)

@router.put("/{id_usuario}", response_model=UsuarioAdminResponse)
def actualizar_usuario(
    id_usuario: int,
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    _perm: Any = Depends(require_permission("usuarios.manage"))
) -> Any:
    """
    Actualizar datos generales de un usuario.
    """
    service = UsuarioService(db)
    try:
        u = service.actualizar_usuario(id_usuario, user_in)
        return build_usuario_admin_response(u)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{id_usuario}/estado", response_model=UsuarioAdminResponse)
def actualizar_estado_usuario(
    id_usuario: int,
    status_in: UsuarioStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    _perm: Any = Depends(require_permission("usuarios.manage"))
) -> Any:
    """
    Activar o desactivar un usuario.
    """
    service = UsuarioService(db)
    try:
        u = service.actualizar_estado(id_usuario, status_in.activo, current_user.id_usuario)
        return build_usuario_admin_response(u)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id_usuario}/reset-password")
def reset_password_usuario(
    id_usuario: int,
    pw_in: UsuarioPasswordReset,
    db: Session = Depends(get_db),
    _perm: Any = Depends(require_permission("usuarios.reset_password"))
) -> Any:
    """
    Resetear contraseña de un usuario (admin action).
    """
    service = UsuarioService(db)
    try:
        service.reset_password(id_usuario, pw_in.nueva_password)
        return {"msg": "Contraseña actualizada con éxito"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
