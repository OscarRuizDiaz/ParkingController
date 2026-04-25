from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.repositories.ventas_repo import turno_repo

db = SessionLocal()
try:
    print("Prueba EFECTIVO:", turno_repo.get_total_por_medio_pago(db, 35, "EFECTIVO"))
except Exception as e:
    print("Error:", e)
finally:
    db.close()
