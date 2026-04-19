from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ClienteBase(BaseModel):
    tipo_documento: str = Field(..., description="CI o RUC")
    numero_documento: str
    nombre_razon_social: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id_cliente: int
    activo: bool
    creado_en: datetime

    class Config:
        from_attributes = True

class ClienteSearch(BaseModel):
    tipo_documento: str
    numero_documento: str

class CajaResponse(BaseModel):
    id_caja: int
    nombre: str
    sucursal: Optional[str] = None
    activo: bool

    class Config:
        from_attributes = True
