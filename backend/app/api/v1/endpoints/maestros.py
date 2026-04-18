from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.maestros import ClienteResponse, ClienteCreate
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
