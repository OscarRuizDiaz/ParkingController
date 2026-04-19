from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.seguridad import Usuario
from app.models.ventas import Caja, TurnoCaja
from app.schemas.maestros import ClienteResponse, ClienteCreate, CajaResponse
from app.repositories.maestros_repo import cliente_repo

router = APIRouter()

@router.get("/buscar", response_model=Optional[ClienteResponse])
def buscar_cliente(
    tipo_documento: str = Query(..., description="CI o RUC"),
    numero_documento: str = Query(...),
    db: Session = Depends(get_db)
):
    """Busca un cliente por documento."""
    cliente = cliente_repo.get_by_documento(db, tipo_documento, numero_documento)
    return cliente

@router.post("/", response_model=ClienteResponse)
def crear_cliente(
    cliente_in: ClienteCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuevo cliente (Alta manual)."""
    existente = cliente_repo.get_by_documento(db, cliente_in.tipo_documento, cliente_in.numero_documento)
    if existente:
        raise HTTPException(status_code=400, detail="Cliente ya existe con ese documento.")
    
    return cliente_repo.create(db, cliente_in.dict())

@router.get("/cajas/disponibles", response_model=List[CajaResponse])
def listar_cajas_disponibles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista cajas activas que NO tienen un turno abierto actualmente.
    """
    # Subconsulta para obtener IDs de cajas con turno abierto
    cajas_ocupadas = db.query(TurnoCaja.id_caja).filter(TurnoCaja.estado == 'ABIERTO').subquery()
    
    # Clic en cajas activas que no estén en la subconsulta
    cajas_libres = db.query(Caja).filter(
        Caja.activo == True,
        ~Caja.id_caja.in_(cajas_ocupadas)
    ).all()
    
    return cajas_libres
