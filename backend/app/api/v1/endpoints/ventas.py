from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps.permissions import require_permission
from app.models.seguridad import Usuario
from app.schemas.ventas import CobroCreate, CobroResponse
from app.services.ventas_service import VentasService

router = APIRouter()

def get_ventas_service(db: Session = Depends(get_db)) -> VentasService:
    return VentasService(db)

@router.post("/cobrar", response_model=CobroResponse, status_code=status.HTTP_201_CREATED)
def registrar_cobro_ticket(
    cobro_in: CobroCreate,
    current_user: Usuario = Depends(require_permission("tickets.cobrar")),
    service: VentasService = Depends(get_ventas_service),
) -> CobroResponse:
    """
    Registra el cobro de un ticket, confirmando la liquidación y actualizando estados.
    Requiere que el cajero tenga un turno de caja abierto.
    """
    try:
        return service.registrar_cobro(cobro_in, current_user.id_usuario)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(exc)}")
