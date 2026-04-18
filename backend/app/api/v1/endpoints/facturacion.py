from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.facturacion import FacturaCreate, FacturaResponse
from app.services.facturacion_service import FacturacionService

router = APIRouter()

@router.post("/emitir", response_model=FacturaResponse)
def emitir_factura(
    factura_in: FacturaCreate,
    db: Session = Depends(get_db)
):
    """
    Emite una factura fiscal para un cobro registrado.
    Incluye lógica de alta rápida de clientes si no existen.
    """
    service = FacturacionService(db)
    try:
        return service.emitir_factura_desde_cobro(factura_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del sistema al facturar.")
