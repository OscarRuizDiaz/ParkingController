from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/parking_db")
engine = create_engine(db_url)
inspector = inspect(engine)

schemas = ["audit", "maestros", "parking", "seguridad", "ventas", "facturacion"]
for schema in schemas:
    tables = inspector.get_table_names(schema=schema)
    print(f"Schema {schema}: {tables}")
