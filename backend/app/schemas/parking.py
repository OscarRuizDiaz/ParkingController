from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, Literal
from decimal import Decimal
from app.schemas.base import BaseSchema

# === TICKET SCHEMAS ===

class TicketBusquedaResponse(BaseSchema):
    """
    Información devuelta cuando el cajero busca un ticket.
    """
    id_ticket: int
    codigo_ticket: str
    proveedor_origen: Optional[str]
    fecha_hora_ingreso: datetime
    fecha_hora_salida: Optional[datetime] = None
    estado: str
    
class TicketCreate(BaseSchema):
    codigo_ticket: str = Field(..., min_length=1, description="Código único leído por escáner")
    fecha_hora_ingreso: datetime
    proveedor_origen: Optional[str] = None
# === TARIFA SCHEMAS ===

class TarifaBaseResponse(BaseSchema):
    """
    Mini-resumen de la tarifa que se aplicó.
    """
    id_tarifa: int
    nombre: str
    valor_base: Decimal
    modo_calculo: Literal['BLOQUE_FIJO', 'BASE_MAS_EXCEDENTE_PROPORCIONAL']

class TarifaUpdate(BaseSchema):
    nombre: Optional[str] = None
    modo_calculo: Literal['BLOQUE_FIJO', 'BASE_MAS_EXCEDENTE_PROPORCIONAL']
    valor_base: Decimal
    fraccion_minutos: int
    redondea_hacia_arriba: bool
    configuracion_json: Optional[Dict[str, Any]] = None

class TarifaResponse(TarifaBaseResponse):
    fraccion_minutos: int
    redondea_hacia_arriba: bool
    configuracion_json: Optional[Dict[str, Any]] = None
    activo: bool
    vigencia_desde: datetime

# === LIQUIDACION SCHEMAS ===

class LiquidacionCalculadaResponse(BaseSchema):
    codigo_ticket: str
    minutos_calculados: int
    tolerancia_aplicada: bool
    bloques: int
    monto_a_cobrar: Decimal
    detalle_calculo: Dict[str, Any]
    modo_visualizacion: Literal["DINAMICO", "HISTORICO"] = "DINAMICO"

class LiquidacionConfirmadaResponse(BaseSchema):
    """
    Resultado devuelto al momento de guardar la liquidación definitivamente,
    lista para enviarse a cobro y/o facturación.
    """
    id_liquidacion: int
    id_ticket: int
    id_tarifa: int
    minutos: int
    monto_bruto: Decimal
    estado: str
    creado_en: datetime
