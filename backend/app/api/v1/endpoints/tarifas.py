from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.parking import TarifaResponse, TarifaUpdate
from app.repositories.parking_repo import tarifa_repo

router = APIRouter()

@router.get("/activa", response_model=TarifaResponse)
def leer_tarifa_activa(db: Session = Depends(get_db)):
    """
    Obtiene la configuración de la tarifa actualmente activa en el sistema.
    """
    tarifa = tarifa_repo.get_tarifa_activa(db)
    if not tarifa:
        raise HTTPException(status_code=404, detail="No hay una tarifa activa configurada.")
    return tarifa

@router.put("/activa", response_model=TarifaResponse)
def actualizar_tarifa_activa(
    tarifa_in: TarifaUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza los parámetros de la tarifa activa.
    """
    tarifa = tarifa_repo.get_tarifa_activa(db)
    if not tarifa:
        raise HTTPException(status_code=404, detail="No hay una tarifa activa para actualizar.")
    
    # Validar integridad del modo de cálculo en backend
    modos_validos = ["BLOQUE_FIJO", "BASE_MAS_EXCEDENTE_PROPORCIONAL"]
    if tarifa_in.modo_calculo not in modos_validos:
         raise HTTPException(status_code=400, detail=f"Modo de cálculo inválido. Soportados: {modos_validos}")

    try:
        # El repositorio ya maneja la conversión a dict
        actualizado = tarifa_repo.update(db, db_obj=tarifa, obj_in=tarifa_in)
        db.commit()
        return actualizado
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error al actualizar tarifa: {str(e)}"
        )
