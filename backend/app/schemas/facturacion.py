from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal

class FacturaDetalleBase(BaseModel):
    descripcion: str
    cantidad: Decimal = Decimal("1.00")
    precio_unitario: Decimal
    porcentaje_iva: Decimal = Decimal("10.00")

class FacturaCreate(BaseModel):
    id_cobro: int
    # Datos básicos del cliente para alta rápida o asociación
    tipo_documento: str
    numero_documento: str
    nombre_razon_social: str
    # La lógica de IVA 10% fijo se aplicará en el servicio, 
    # pero el schema permite flexibilidad futura.
    condicion_venta: str = "CONTADO"

class FacturaResponse(BaseModel):
    id_factura: int
    id_cobro: int
    id_cliente: int
    numero_factura: str
    fecha_emision: datetime
    total: Decimal
    iva_10: Decimal
    iva_5: Decimal
    exento: Decimal
    estado: str
    creado_en: datetime

    class Config:
        from_attributes = True
