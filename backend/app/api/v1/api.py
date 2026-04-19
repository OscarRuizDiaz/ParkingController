from fastapi import APIRouter

from app.api.v1.endpoints import (
    health, 
    tickets, 
    ventas, 
    maestros, 
    facturacion, 
    tarifas, 
    caja
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(ventas.router, prefix="/ventas", tags=["ventas"])
api_router.include_router(maestros.router, prefix="/maestros", tags=["maestros"])
api_router.include_router(facturacion.router, prefix="/facturacion", tags=["facturacion"])
api_router.include_router(tarifas.router, prefix="/tarifas", tags=["tarifas"])
api_router.include_router(caja.router, prefix="/ventas/caja", tags=["caja"])