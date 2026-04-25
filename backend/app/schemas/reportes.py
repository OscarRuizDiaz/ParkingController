from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

class DashboardResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_recaudado: Decimal = Field(default=Decimal("0.00"))
    cantidad_tickets_cobrados: int = Field(default=0)
    cantidad_turnos_cerrados: int = Field(default=0)
    promedio_recaudacion_por_turno: Decimal = Field(default=Decimal("0.00"))
    total_efectivo: Decimal = Field(default=Decimal("0.00"))
    total_tarjeta: Decimal = Field(default=Decimal("0.00"))
    total_transferencia: Decimal = Field(default=Decimal("0.00"))
    total_otros: Decimal = Field(default=Decimal("0.00"))
    fecha_desde: date
    fecha_hasta: date

class ReporteTurnoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    turno_id: int
    usuario_id: int
    usuario_nombre: str
    caja_id: int
    caja_nombre: str
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    monto_inicial: Decimal
    total_cobrado: Decimal
    monto_final_declarado: Optional[Decimal] = None
    diferencia: Optional[Decimal] = None
    estado: str

class ReporteTurnosResponse(BaseModel):
    items: List[ReporteTurnoItem]
    total: int
    limit: int
    offset: int

class ReporteCobroItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cobro_id: int
    ticket_id: int
    codigo_ticket: str
    fecha_cobro: datetime
    usuario_id: int
    usuario_nombre: str
    caja_id: int
    caja_nombre: str
    medio_pago: str
    monto: Decimal

class ReporteCobrosResponse(BaseModel):
    items: List[ReporteCobroItem]
    total: int
    limit: int
    offset: int

class FiltroItem(BaseModel):
    id: int
    nombre: str

class ReporteFiltros(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuarios_cajeros: List[FiltroItem]
    cajas: List[FiltroItem]
    sucursales: List[str]
    medios_pago: List[str]
