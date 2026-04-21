from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class UsuarioResponse(BaseModel):
    id_usuario: int
    username: str
    nombre_completo: str
    nombre_rol: str
    permisos: List[str] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, user: Any) -> "UsuarioResponse":
        """
        Mapper único para asegurar que el contrato de sesión/autorización 
        sea consistente en todo el sistema.
        """
        return cls(
            id_usuario=user.id_usuario,
            username=user.username,
            nombre_completo=user.nombre_completo,
            nombre_rol=user.rol.nombre if user.rol else "CAJERO",
            permisos=[p.codigo for p in user.rol.permisos if p.activo] if user.rol else []
        )

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UsuarioResponse] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None

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

# --- User Administration Schemas ---

class UsuarioAdminResponse(BaseModel):
    id_usuario: int
    username: str
    nombre_completo: str
    email: Optional[str] = None
    activo: bool
    id_rol: int
    nombre_rol: str
    creado_en: datetime

    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    username: str
    password: str
    nombre_completo: str
    email: Optional[str] = None
    id_rol: int

class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[str] = None
    id_rol: Optional[int] = None

class UsuarioStatusUpdate(BaseModel):
    activo: bool

class UsuarioPasswordReset(BaseModel):
    nueva_password: str
