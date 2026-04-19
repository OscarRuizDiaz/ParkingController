from typing import Optional, List
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UsuarioResponse(BaseModel):
    id: int
    username: str
    nombre: Optional[str] = None
    role: str
    permissions: List[str] = []

    class Config:
        from_attributes = True

# --- RBAC Administration Schemas ---

class PermisoItem(BaseModel):
    id_permiso: int
    codigo: str
    modulo: str
    descripcion: str
    activo: bool

    class Config:
        from_attributes = True

class RolListItem(BaseModel):
    id_rol: int
    nombre: str
    descripcion: Optional[str] = None
    activo: bool
    cantidad_permisos: int

    class Config:
        from_attributes = True

class RolConPermisosResponse(BaseModel):
    id_rol: int
    nombre: str
    descripcion: Optional[str] = None
    activo: bool
    permisos: List[str]

    class Config:
        from_attributes = True

class ActualizarPermisosRolRequest(BaseModel):
    permisos: List[str]
