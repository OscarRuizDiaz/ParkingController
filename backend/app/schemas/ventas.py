from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal
from app.schemas.base import BaseSchema

class CobroCreate(BaseSchema):
    codigo_ticket: str = Field(..., min_length=1)
    medio_pago: Literal["EFECTIVO", "TRANSFERENCIA", "TARJETA"]
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
