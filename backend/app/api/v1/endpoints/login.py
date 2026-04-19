from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core import security
from app.core.config import settings
from app.api.v1 import deps
from app.models.seguridad import Usuario
from app.schemas.seguridad import Token, UsuarioResponse
from app.repositories.seguridad_repo import usuario_repo

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = usuario_repo.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    elif not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id_usuario, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": {
            "id": user.id_usuario,
            "username": user.username,
            "nombre": user.nombre_completo,
            "role": user.rol.nombre if user.rol else "CAJERO"
        }
    }

@router.get("/usuarios/me", response_model=UsuarioResponse)
def read_user_me(
    current_user: Usuario = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return {
        "id": current_user.id_usuario,
        "username": current_user.username,
        "nombre": current_user.nombre_completo,
        "role": current_user.rol.nombre if current_user.rol else "CAJERO"
    }
