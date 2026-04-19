from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/parking_db")
engine = create_engine(db_url)
inspector = inspect(engine)

columns = inspector.get_columns("turnos_caja", schema="ventas")
col_names = [c["name"] for c in columns]
print(f"Columns in ventas.turnos_caja: {col_names}")
