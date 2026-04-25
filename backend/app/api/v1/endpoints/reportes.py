from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional, Literal

from app.core.database import get_db
from app.api.deps.permissions import require_permission, require_any_permission
from app.models.seguridad import Usuario
from app.schemas.reportes import (
    DashboardResumen, 
    ReporteTurnosResponse, 
    ReporteCobrosResponse, 
    ReporteFiltros
)
from app.services.reportes_service import ReportesService

router = APIRouter()

def get_reportes_service(db: Session = Depends(get_db)) -> ReportesService:
    return ReportesService(db)

@router.get("/dashboard/resumen", response_model=DashboardResumen)
def get_dashboard_resumen(
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    usuario_id: Optional[int] = Query(None),
    caja_id: Optional[int] = Query(None),
    sucursal: Optional[str] = Query(None, description="Nombre de la sucursal"),
    current_user: Usuario = Depends(require_permission("dashboard.view")),
    service: ReportesService = Depends(get_reportes_service)
) -> DashboardResumen:
    try:
        return service.get_dashboard_resumen(
            fecha_desde, fecha_hasta, usuario_id, caja_id, sucursal
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/turnos", response_model=ReporteTurnosResponse)
def get_reporte_turnos(
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    usuario_id: Optional[int] = Query(None),
    caja_id: Optional[int] = Query(None),
    estado: Optional[Literal['ABIERTO', 'CERRADO', 'ANULADO']] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: Usuario = Depends(require_permission("reportes.view")),
    service: ReportesService = Depends(get_reportes_service)
) -> ReporteTurnosResponse:
    try:
        return service.get_reporte_turnos(
            fecha_desde, fecha_hasta, usuario_id, caja_id, estado, limit, offset
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/cobros", response_model=ReporteCobrosResponse)
def get_reporte_cobros(
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    usuario_id: Optional[int] = Query(None),
    caja_id: Optional[int] = Query(None),
    medio_pago: Optional[Literal['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: Usuario = Depends(require_permission("reportes.view")),
    service: ReportesService = Depends(get_reportes_service)
) -> ReporteCobrosResponse:
    try:
        return service.get_reporte_cobros(
            fecha_desde, fecha_hasta, usuario_id, caja_id, medio_pago, limit, offset
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/filtros", response_model=ReporteFiltros)
def get_filtros(
    current_user: Usuario = Depends(require_any_permission(["reportes.view", "dashboard.view"])),
    service: ReportesService = Depends(get_reportes_service)
) -> ReporteFiltros:
    """
    Obtiene los metadatos para filtros de búsqueda. 
    Accesible para usuarios con permiso de reporte o dashboard.
    """
    return service.get_filtros()
