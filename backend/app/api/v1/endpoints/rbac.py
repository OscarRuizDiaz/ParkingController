from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps.permissions import require_permission
from app.services.rbac_service import RBACService
from app.models.seguridad import Usuario
from app.schemas.seguridad import (
    RolListItem,
    PermisoItem,
    RolConPermisosResponse,
    ActualizarPermisosRolRequest
)

router = APIRouter()

def get_rbac_service(db: Session = Depends(get_db)) -> RBACService:
    return RBACService(db)

@router.get("/roles", response_model=List[RolListItem])
def listar_roles(
    service: RBACService = Depends(get_rbac_service),
    current_user: Usuario = Depends(require_permission("roles.view"))
) -> List[RolListItem]:
    """
    Obtiene la lista de roles registrados con el conteo de sus permisos actuales.
    """
    roles_db = service.get_roles()
    return [
        RolListItem(
            id_rol=rol.id_rol,
            nombre=rol.nombre,
            descripcion=rol.descripcion,
            activo=rol.activo,
            cantidad_permisos=len(rol.permisos)
        ) for rol in roles_db
    ]

@router.get("/permisos", response_model=List[PermisoItem])
def listar_permisos(
    service: RBACService = Depends(get_rbac_service),
    current_user: Usuario = Depends(require_permission("roles.view"))
) -> List[PermisoItem]:
    """
    Retorna el catálogo maestro de permisos completo (lista plana).
    """
    return service.get_all_permisos()

@router.get("/roles/{id_rol}", response_model=RolConPermisosResponse)
def obtener_detalle_rol(
    id_rol: int,
    service: RBACService = Depends(get_rbac_service),
    current_user: Usuario = Depends(require_permission("roles.view"))
) -> RolConPermisosResponse:
    """
    Obtiene los detalles de un rol específico y su lista de códigos de permisos asignados.
    """
    try:
        rol = service.get_rol_con_permisos(id_rol)
        return RolConPermisosResponse(
            id_rol=rol.id_rol,
            nombre=rol.nombre,
            descripcion=rol.descripcion,
            activo=rol.activo,
            permisos=[p.codigo for p in rol.permisos if p.activo]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/roles/{id_rol}/permisos", status_code=status.HTTP_200_OK)
def actualizar_permisos_rol(
    id_rol: int,
    req: ActualizarPermisosRolRequest,
    service: RBACService = Depends(get_rbac_service),
    current_user: Usuario = Depends(require_permission("roles.manage"))
):
    """
    Actualiza de forma atómica el set completo de permisos de un rol.
    """
    try:
        service.actualizar_permisos_rol(id_rol, req.permisos)
        return {"message": "Permisos actualizados correctamente"}
    except ValueError as e:
        # Diferenciar 404 de 400 basado en el mensaje del servicio
        error_msg = str(e)
        if "no encontrado" in error_msg or "inactivo" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
