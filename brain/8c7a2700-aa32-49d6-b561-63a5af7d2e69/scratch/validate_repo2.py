import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.repositories.ventas_repo import turno_repo
from app.models.ventas import TurnoCaja

def test():
    db = SessionLocal()
    try:
        # Encontrar el ultimo turno cerrado o abierto
        turno = db.query(TurnoCaja).order_by(TurnoCaja.id_turno.desc()).first()
        if turno:
            print(f"Probando para turno ID: {turno.id_turno}")
            total_efectivo = turno_repo.get_total_por_medio_pago(db, turno.id_turno, "EFECTIVO")
            print(f"Total efectivo: {total_efectivo}")
            
            total_tarjeta = turno_repo.get_total_por_medio_pago(db, turno.id_turno, "TARJETA")
            print(f"Total tarjeta: {total_tarjeta}")
            
            total_transferencia = turno_repo.get_total_por_medio_pago(db, turno.id_turno, "TRANSFERENCIA")
            print(f"Total transferencia: {total_transferencia}")
        else:
            print("No hay turnos.")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test()
