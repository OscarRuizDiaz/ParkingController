import sys
import os
from sqlalchemy import text

# Agregar el directorio backend al path para poder importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def apply_sql(file_path: str):
    print(f"Leyendo SQL desde: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Conectando a la base de datos...")
    with engine.connect() as conn:
        with conn.begin():
            print("Ejecutando DDL...")
            # PostgreSQL no permite ejecutar múltiples sentencias DDL en un solo execute con parámetros usualmente,
            # pero sqlalchemy con engine.connect().execute(text(...)) suele manejarlo bien si no hay parámetros.
            # Dividiremos por si acaso, aunque el script es simple.
            statements = sql.split(";")
            for stmt in statements:
                stripped = stmt.strip()
                if stripped:
                    conn.execute(text(stripped))
            print("DDL ejecutado con éxito.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python apply_fix.py <ruta_sql>")
        sys.exit(1)
    
    apply_sql(sys.argv[1])
