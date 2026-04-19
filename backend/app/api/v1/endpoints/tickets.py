from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps.permissions import require_permission
from app.models.seguridad import Usuario
from app.schemas.parking import (
    TicketCreate,
    TicketBusquedaResponse,
    LiquidacionCalculadaResponse,
    SimulacionManualRequest,
)
from app.services.parking_service import ParkingService

router = APIRouter()


def get_parking_service(db: Session = Depends(get_db)) -> ParkingService:
    return ParkingService(db)


@router.post("/", response_model=TicketBusquedaResponse, status_code=status.HTTP_201_CREATED)
def registrar_ticket(
    ticket_in: TicketCreate,
    current_user: Usuario = Depends(require_permission("tickets.crear")),
    service: ParkingService = Depends(get_parking_service),
) -> TicketBusquedaResponse:
    try:
        return service.registrar_ticket_recibido(ticket_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{codigo_ticket}", response_model=TicketBusquedaResponse)
def buscar_ticket(
    codigo_ticket: str,
    current_user: Usuario = Depends(require_permission("tickets.buscar")),
    service: ParkingService = Depends(get_parking_service),
) -> TicketBusquedaResponse:
    ticket = service.buscar_ticket(codigo_ticket)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    return ticket


@router.get("/{codigo_ticket}/simular", response_model=LiquidacionCalculadaResponse)
def simular_liquidacion_ticket(
    codigo_ticket: str,
    current_user: Usuario = Depends(require_permission("tickets.simular")),
    service: ParkingService = Depends(get_parking_service),
) -> LiquidacionCalculadaResponse:
    try:
        return service.simular_liquidacion(codigo_ticket)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/simular-manual", response_model=LiquidacionCalculadaResponse)
def simular_manual(
    req: SimulacionManualRequest,
    current_user: Usuario = Depends(require_permission("tickets.simular")),
    service: ParkingService = Depends(get_parking_service),
) -> LiquidacionCalculadaResponse:
    """
    Simula el cobro de un ticket usando minutos ingresados manualmente.
    Permite simulación incluso para códigos inexistentes.
    """
    try:
        return service.simular_liquidacion_manual(req.codigo_ticket, req.minutos_manuales)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))