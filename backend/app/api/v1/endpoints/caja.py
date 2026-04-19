from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ventas_service import VentasService
from app.schemas.ventas import (
    AperturaCajaRequest, 
    CierreCajaRequest, 
    TurnoCajaResumenResponse,
    TurnoCajaActualResponse
)

router = APIRouter()

@router.post("/abrir", response_model=TurnoCajaActualResponse)
def abrir_caja(
    req: AperturaCajaRequest,
    db: Session = Depends(get_db)
) -> TurnoCajaActualResponse:
    """
    Abre un nuevo turno de caja.
    """
    service = VentasService(db)
    try:
        return service.abrir_turno(req.id_caja, req.monto_inicial)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/actual", response_model=Optional[TurnoCajaActualResponse])
def obtener_turno_actual(
    db: Session = Depends(get_db)
) -> Optional[TurnoCajaActualResponse]:
    """
    Obtiene el turno abierto actual si existe.
    """
    service = VentasService(db)
    turno = service.get_turno_actual()
    if not turno:
        return None
    return turno

@router.get("/resumen", response_model=TurnoCajaResumenResponse)
def obtener_resumen_actual(
    db: Session = Depends(get_db)
) -> TurnoCajaResumenResponse:
    """
    Obtiene el resumen operativo del turno abierto actual.
    """
    service = VentasService(db)
    turno = service.get_turno_actual()
    if not turno:
        raise HTTPException(status_code=404, detail="No hay un turno de caja abierto.")
    return service.get_resumen_turno(turno.id_turno)

@router.post("/cerrar", response_model=TurnoCajaResumenResponse)
def cerrar_caja(
    req: CierreCajaRequest,
    db: Session = Depends(get_db)
) -> TurnoCajaResumenResponse:
    """
    Cierra el turno de caja actual.
    """
    service = VentasService(db)
    try:
        # 1. Ejecutar el cierre
        turno = service.cerrar_turno(req.monto_final_declarado)
        # 2. Obtener y retornar el resumen completo del turno recién cerrado
        return service.get_resumen_turno(turno.id_turno)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
