import logging
import sys
import os

# Forzar encoding UTF-8 en consola Windows si es posible
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.security import verify_password, pwd_context
from app.models.seguridad import Usuario, Rol

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_auth():
    print("\n=== DIAGNÓSTICO DE AUTENTICACIÓN (UTF-8) ===")
    
    # 1. Verificar Entorno
    print(f"\n[1] Entorno Python:")
    print(f"    - Path: {sys.executable}")
    try:
        import bcrypt
        print(f"    - bcrypt version: {getattr(bcrypt, '__version__', 'unknown')}")
    except Exception as e:
        print(f"    - ERROR de librerías: {e}")

    db = SessionLocal()
    try:
        # 2. Verificar BD
        print(f"\n[2] Verificando Base de Datos:")
        db_url = db.bind.url
        print(f"    - Conectado a: {db_url.database} en {db_url.host}:{db_url.port}")
        
        # 3. Datos de Usuarios
        users_to_check = [
            ("admin", "admin123"),
            ("supervisor", "super123"),
            ("cajero", "cajero123")
        ]
        
        for username, password in users_to_check:
            print(f"\n[3.x] Probando usuario: {username}")
            user = db.query(Usuario).filter(Usuario.username == username).first()
            if not user:
                print(f"    - ERROR: Usuario '{username}' no encontrado")
                continue
            
            print(f"    - ID: {user.id_usuario}")
            print(f"    - Rol: {user.rol.nombre if user.rol else 'SIN ROL'}")
            print(f"    - Hash en DB (prefijo): {user.password_hash[:10]}...")
            print(f"    - Intentando validar pass: '{password}'")
            
            try:
                # Prueba directa
                is_valid = pwd_context.verify(password, user.password_hash)
                print(f"    - RESULTADO: {'OK (PASS VÁLIDA)' if is_valid else 'FAIL (PASS INVÁLIDA)'}")
            except Exception as e:
                print(f"    - ERROR CRÍTICO en verify: {type(e).__name__}: {e}")

    except Exception as e:
        print(f"\n[-] ERROR GENERAL: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_auth()
