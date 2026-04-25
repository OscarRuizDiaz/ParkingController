from sqlalchemy import create_engine, text

# Configuración de conexión
DB_URL = "postgresql://postgres:postgres@localhost:5432/parking_db"

engine = create_engine(DB_URL)

query = text("""
   SELECT 
       c.id_cobro,
       c.medio_pago,
       c.monto AS monto_cobro,
       l.monto_bruto AS monto_liq,
       COALESCE(NULLIF(c.monto, 0), l.monto_bruto, 0) AS monto_real,
       c.cobrado_en
   FROM ventas.cobros c
   LEFT JOIN parking.liquidaciones l
       ON l.id_liquidacion = c.id_liquidacion
   ORDER BY c.cobrado_en DESC
   LIMIT 10;
""")

try:
    with engine.connect() as conn:
        result = conn.execute(query)
        print(f"{'ID':<5} | {'Medio':<12} | {'Monto C':<10} | {'Monto L':<10} | {'Monto R':<10} | {'Fecha'}")
        print("-" * 75)
        for row in result:
            print(f"{row[0]:<5} | {row[1]:<12} | {row[2]:<10} | {row[3]:<10} | {row[4]:<10} | {row[5]}")
except Exception as e:
    print(f"Error al ejecutar validación SQL: {e}")
