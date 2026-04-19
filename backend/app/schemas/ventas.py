from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal
from app.schemas.base import BaseSchema

class CobroCreate(BaseSchema):
    codigo_ticket: str = Field(..., min_length=1)
    medio_pago: Literal["EFECTIVO", "TRANSFERENCIA", "TARJETA"]
    minutos_manuales: Optional[int] = Field(None, ge=0)
    observacion: Optional[str] = None

class CobroResponse(BaseSchema):
    id_cobro: int
    id_liquidacion: int
    medio_pago: str
    monto: Decimal
    estado: str
    cobrado_en: datetime
    codigo_ticket: str
    nombre_cajero: str

class AperturaCajaRequest(BaseSchema):
    id_caja: int
    monto_inicial: Decimal = Field(..., ge=0)

class CierreCajaRequest(BaseSchema):
    monto_final_declarado: Decimal = Field(..., ge=0)

class CierreForzadoRequest(BaseSchema):
    monto_final_declarado: Decimal = Field(..., ge=0)
    motivo: str = Field(..., min_length=5)

class TurnoCajaResumenResponse(BaseSchema):
    id_turno: int
    id_caja: int
    nombre_caja: str
    estado: str
    fecha_hora_apertura: datetime
    fecha_hora_cierre: Optional[datetime] = None
    monto_inicial: Decimal
    monto_final: Optional[Decimal] = None
    total_cobrado: Decimal
    total_efectivo: Decimal
    total_transferencia: Decimal
    total_tarjeta: Decimal
    cantidad_cobros: int
    diferencia: Optional[Decimal] = None
    usuario_nombre: str
    id_usuario: int
    id_usuario_cierre: Optional[int] = None
    usuario_cierre_nombre: Optional[str] = None
    motivo_cierre: Optional[str] = None

class TurnoCajaActualResponse(BaseSchema):
    id_turno: int
    id_caja: int
    id_usuario: int
    fecha_hora_apertura: datetime
    fecha_hora_cierre: Optional[datetime] = None
    monto_inicial: Decimal
    monto_final: Optional[Decimal] = None
    diferencia: Optional[Decimal] = None
    estado: str
    id_usuario_cierre: Optional[int] = None
    motivo_cierre: Optional[str] = None
