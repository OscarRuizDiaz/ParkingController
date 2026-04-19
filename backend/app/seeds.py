import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.seguridad import Rol, Usuario
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        print("Iniciando carga de datos iniciales (Seeds)...")
        
        # 1. ROLES
        roles_data = [
            {"nombre": "ADMINISTRADOR", "descripcion": "Acceso total al sistema"},
            {"nombre": "SUPERVISOR", "descripcion": "Supervision, anulaciones y control"},
            {"nombre": "CAJERO", "descripcion": "Operador de caja y facturacion"},
        ]
        
        roles_map = {}
        for r_data in roles_data:
            role = db.query(Rol).filter(Rol.nombre == r_data["nombre"]).first()
            if not role:
                print(f"Creando rol: {r_data['nombre']}")
                role = Rol(**r_data)
                db.add(role)
                db.flush()
            roles_map[r_data["nombre"]] = role.id_rol
            
        # 2. USUARIOS
        users_data = [
            {
                "username": "admin",
                "nombre_completo": "Administrador General",
                "email": "admin@parking.local",
                "role_name": "ADMINISTRADOR",
                "password_plain": "admin123"
            },
            {
                "username": "supervisor",
                "nombre_completo": "Supervisor Nocturno",
                "email": "super01@parking.local",
                "role_name": "SUPERVISOR",
                "password_plain": "super123"
            },
            {
                "username": "cajero",
                "nombre_completo": "Cajero Turno Rotativo",
                "email": "cajero01@parking.local",
                "role_name": "CAJERO",
                "password_plain": "cajero123"
            }
        ]
        
        for u_data in users_data:
            user = db.query(Usuario).filter(Usuario.username == u_data["username"]).first()
            new_hash = get_password_hash(u_data["password_plain"])
            
            if not user:
                print(f"Creando usuario: {u_data['username']}")
                user = Usuario(
                    username=u_data["username"],
                    nombre_completo=u_data["nombre_completo"],
                    email=u_data["email"],
                    password_hash=new_hash,
                    id_rol=roles_map[u_data["role_name"]],
                    activo=True
                )
                db.add(user)
            else:
                print(f"Actualizando usuario: {u_data['username']} (Sincronizando Hash y Rol)")
                user.password_hash = new_hash
                user.id_rol = roles_map[u_data["role_name"]]
                user.activo = True
                
        # 3. MANEJO DE CAJERO_DEMO (Saneamiento)
        cajero_demo = db.query(Usuario).filter(Usuario.username == "cajero_demo").first()
        if cajero_demo:
            print("Actualizando cajero_demo a hash compatible (Bcrypt)")
            cajero_demo.password_hash = get_password_hash("cajero123")
            cajero_demo.activo = True
            
        db.commit()
        print("Semillas aplicadas exitosamente.")
        
    except Exception as e:
        print(f"Error durante la carga de semillas: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
