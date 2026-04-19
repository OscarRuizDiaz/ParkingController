from sqlalchemy import create_engine, inspect
import sys

db_url = "postgresql://postgres:postgres@localhost:5433/parking_db"
engine = create_engine(db_url)
inspector = inspect(engine)

def check_column():
    columns = inspector.get_columns('turnos_caja', schema='ventas')
    col_names = [c['name'] for c in columns]
    if 'diferencia' in col_names:
        print("COL_EXISTS")
    else:
        print("COL_MISSING")

if __name__ == "__main__":
    try:
        check_column()
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
