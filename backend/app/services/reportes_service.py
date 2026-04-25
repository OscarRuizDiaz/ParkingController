from sqlalchemy.orm import Session
from datetime import datetime, time, date
from typing import List, Optional, Dict, Any

from app.repositories.reportes_repository import ReportesRepository
from app.schemas.reportes import (
    DashboardResumen, 
    ReporteTurnoItem, 
    ReporteTurnosResponse,
    ReporteCobroItem, 
    ReporteCobrosResponse,
    ReporteFiltros
)

class ReportesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReportesRepository(db)

    def _get_datetime_range(self, fecha_desde: date, fecha_hasta: date):
        if fecha_desde > fecha_hasta:
            raise ValueError("La fecha inicial no puede ser mayor a la fecha final.")
        
        dt_desde = datetime.combine(fecha_desde, time.min)
        dt_hasta = datetime.combine(fecha_hasta, time.max)
        return dt_desde, dt_hasta

    def get_dashboard_resumen(
        self,
        fecha_desde: date,
        fecha_hasta: date,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        sucursal: Optional[str] = None
    ) -> DashboardResumen:
        dt_desde, dt_hasta = self._get_datetime_range(fecha_desde, fecha_hasta)
        
        data = self.repo.get_dashboard_resumen_data(
            dt_desde, dt_hasta, usuario_id, caja_id, sucursal
        )
        
        return DashboardResumen(
            **data,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )

    def get_reporte_turnos(
        self,
        fecha_desde: date,
        fecha_hasta: date,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        estado: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> ReporteTurnosResponse:
        dt_desde, dt_hasta = self._get_datetime_range(fecha_desde, fecha_hasta)
        
        items_raw, total = self.repo.get_reporte_turnos(
            dt_desde, dt_hasta, usuario_id, caja_id, estado, limit, offset
        )
        
        # Uso de ._mapping para asegurar compatibilidad con Pydantic v2 y SQLAlchemy Row
        items = [ReporteTurnoItem.model_validate(row._mapping) for row in items_raw]
        
        return ReporteTurnosResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset
        )

    def get_reporte_cobros(
        self,
        fecha_desde: date,
        fecha_hasta: date,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        medio_pago: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> ReporteCobrosResponse:
        dt_desde, dt_hasta = self._get_datetime_range(fecha_desde, fecha_hasta)
        
        items_raw, total = self.repo.get_reporte_cobros(
            dt_desde, dt_hasta, usuario_id, caja_id, medio_pago, limit, offset
        )
        
        # Uso de ._mapping para asegurar compatibilidad con Pydantic v2 y SQLAlchemy Row
        items = [ReporteCobroItem.model_validate(row._mapping) for row in items_raw]
        
        return ReporteCobrosResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset
        )

    def get_filtros(self) -> ReporteFiltros:
        data = self.repo.get_filtros_disponibles()
        return ReporteFiltros(**data)
