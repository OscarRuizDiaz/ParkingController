from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UsuarioResponse(BaseModel):
    id: int
    username: str
    nombre: Optional[str] = None
    role: str

    class Config:
        from_attributes = True
