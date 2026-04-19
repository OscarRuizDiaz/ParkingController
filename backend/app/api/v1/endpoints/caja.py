from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.api.deps.permissions import require_permission
from app.models.seguridad import Usuario
from app.services.ventas_service import VentasService
from app.schemas.ventas import (
    AperturaCajaRequest, 
    CierreCajaRequest, 
    CierreForzadoRequest,
    TurnoCajaResumenResponse,
    TurnoCajaActualResponse
)

router = APIRouter()

def get_ventas_service(db: Session = Depends(get_db)) -> VentasService:
    return VentasService(db)

@router.post("/abrir", response_model=TurnoCajaActualResponse)
def abrir_caja(
    req: AperturaCajaRequest,
    current_user: Usuario = Depends(require_permission("caja.abrir")),
    service: VentasService = Depends(get_ventas_service)
) -> TurnoCajaActualResponse:
    """
    Abre un nuevo turno de caja vinculado al usuario actual.
    """
    try:
        return service.abrir_turno(req.id_caja, req.monto_inicial, current_user.id_usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/actual", response_model=Optional[TurnoCajaActualResponse])
def obtener_turno_actual(
    current_user: Usuario = Depends(get_current_user),
    service: VentasService = Depends(get_ventas_service)
) -> Optional[TurnoCajaActualResponse]:
    """
    Obtiene el turno abierto actual del usuario autenticado.
    Retorna 200 con null si no hay turno.
    """
    turno = service.get_turno_actual(current_user.id_usuario)
    if not turno:
        return None
    return turno

@router.get("/abiertas", response_model=List[TurnoCajaResumenResponse])
def listar_turnos_abiertos(
    current_user: Usuario = Depends(require_permission("caja.gestion")),
    service: VentasService = Depends(get_ventas_service)
) -> List[TurnoCajaResumenResponse]:
    """
    Lista todos los turnos abiertos (Solo personal autorizado).
    """
    # Nota: El middleware de permisos en el frontend/backend validará CAJA_GESTION
    return [service.get_resumen_turno(t.id_turno) for t in service.get_turnos_abiertos()]

@router.get("/resumen", response_model=TurnoCajaResumenResponse)
def obtener_resumen_actual(
    current_user: Usuario = Depends(require_permission("caja.resumen")),
    service: VentasService = Depends(get_ventas_service)
) -> TurnoCajaResumenResponse:
    """
    Obtiene el resumen operativo del turno del usuario actual.
    """
    turno = service.get_turno_actual(current_user.id_usuario)
    if not turno:
        raise HTTPException(status_code=404, detail="No tiene un turno de caja abierto.")
    return service.get_resumen_turno(turno.id_turno)

@router.post("/cerrar", response_model=TurnoCajaResumenResponse)
def cerrar_caja(
    req: CierreCajaRequest,
    current_user: Usuario = Depends(require_permission("caja.cerrar")),
    service: VentasService = Depends(get_ventas_service)
) -> TurnoCajaResumenResponse:
    """
    Cierra el turno propio del usuario actual.
    """
    try:
        turno = service.cerrar_turno(req.monto_final_declarado, current_user.id_usuario)
        return service.get_resumen_turno(turno.id_turno)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cerrar-forzado/{id_turno}", response_model=TurnoCajaResumenResponse)
def cerrar_caja_forzado(
    id_turno: int,
    req: CierreForzadoRequest,
    current_user: Usuario = Depends(require_permission("caja.cierre_forzado")),
    service: VentasService = Depends(get_ventas_service)
) -> TurnoCajaResumenResponse:
    """
    Cierra administrativamente un turno ajeno (Solo Supervisión).
    """
    try:
        turno = service.cerrar_turno_forzado(id_turno, current_user.id_usuario, req)
        return service.get_resumen_turno(turno.id_turno)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
