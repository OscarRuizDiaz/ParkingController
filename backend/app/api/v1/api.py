from fastapi import APIRouter

from app.api.v1.endpoints import (
    health, 
    tickets, 
    ventas, 
    maestros, 
    facturacion, 
    tarifas, 
    caja,
    login,
    rbac,
    usuarios,
    reportes
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(login.router, tags=["login"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(ventas.router, prefix="/ventas", tags=["ventas"])
api_router.include_router(maestros.router, prefix="/maestros", tags=["maestros"])
api_router.include_router(facturacion.router, prefix="/facturacion", tags=["facturacion"])
api_router.include_router(tarifas.router, prefix="/tarifas", tags=["tarifas"])
api_router.include_router(caja.router, prefix="/ventas/caja", tags=["caja"])
api_router.include_router(rbac.router, prefix="/rbac", tags=["rbac"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(reportes.router, prefix="/reportes", tags=["reportes"])