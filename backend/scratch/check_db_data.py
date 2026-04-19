import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:a.123456@localhost:5433/db_parking"

engine = sa.create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_users():
    db = SessionLocal()
    try:
        # Check Roles
        print("--- ROLES ---")
        result = db.execute(sa.text("SELECT * FROM seguridad.roles"))
        for row in result:
            print(row)
            
        # Check Users
        print("\n--- USUARIOS ---")
        result = db.execute(sa.text("SELECT id_usuario, username, password_hash, activo, id_rol FROM seguridad.usuarios"))
        for row in result:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
