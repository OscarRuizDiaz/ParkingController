import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal

def test_sql():
    db = SessionLocal()
    try:
        query = text("""
           SELECT
               c.id_turno,
               c.medio_pago,
               COUNT(*) cantidad,
               SUM(COALESCE(NULLIF(c.monto, 0), l.monto_bruto, 0)) total_real
           FROM ventas.cobros c
           JOIN parking.liquidaciones l
               ON l.id_liquidacion = c.id_liquidacion
           WHERE c.id_turno = 35
             AND c.estado = 'COBRADO'
           GROUP BY c.id_turno, c.medio_pago;
        """)
        
        result = db.execute(query).fetchall()
        print("--- RESULTADO SQL PARA TURNO 35 ---")
        for row in result:
            print(f"id_turno: {row[0]}, medio: {row[1]}, cantidad: {row[2]}, total_real: {row[3]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_sql()
