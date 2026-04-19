import logging
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Configurar logging detallado para seguridad
logger = logging.getLogger("app.security")

# Configuración centralizada de esquemas de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña contra el hash con logging de diagnóstico."""
    if not hashed_password:
        logger.warning("verify_password: No se recibió hash para comparar")
        return False
        
    try:
        # Intento de verificación
        is_valid = pwd_context.verify(plain_password, hashed_password)
        if not is_valid:
            logger.info("verify_password: Contraseña incorrecta para el hash proporcionado")
        return is_valid
    except ValueError as ve:
        logger.error(f"verify_password: Hash incompatible o mal formado: {ve}")
        raise
    except Exception as e:
        logger.error(f"verify_password: Error inesperado en validación ({type(e).__name__}): {e}")
        # En diagnóstico, no silenciamos el error para ver la causa raíz en logs
        raise

def get_password_hash(password: str) -> str:
    """Genera un hash Bcrypt para una contraseña en texto plano."""
    return pwd_context.hash(password)
