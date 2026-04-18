from sqlalchemy import text
from app.core.database import SessionLocal

def migrate_constraint():
    sql_drop = "ALTER TABLE parking.tarifas DROP CONSTRAINT IF EXISTS chk_tarifa_modo;"
    sql_add = """
    ALTER TABLE parking.tarifas 
    ADD CONSTRAINT chk_tarifa_modo 
    CHECK (modo_calculo IN ('BLOQUE_FIJO', 'PROPORCIONAL', 'TRAMOS', 'FRACCION', 'BASE_MAS_EXCEDENTE_PROPORCIONAL'));
    """
    
    db = SessionLocal()
    try:
        print("INFO: Eliminando constraint antiguo...")
        db.execute(text(sql_drop))
        print("INFO: Agregando nuevo constraint con soporte para BASE_MAS_EXCEDENTE_PROPORCIONAL...")
        db.execute(text(sql_add))
        db.commit()
        print("SUCCESS: Migracion de base de datos completada con exito.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Error durante la migracion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_constraint()
