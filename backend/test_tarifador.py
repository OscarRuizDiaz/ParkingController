from decimal import Decimal
import sys
import os

# Ajustar path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.tarifador import Tarifador

class MockTarifa:
    def __init__(self, modo, base, fraccion, config=None):
        self.modo_calculo = modo
        self.valor_base = Decimal(str(base))
        self.fraccion_minutos = fraccion
        self.configuracion_json = config or {}

def test_tarifador():
    tarifador = Tarifador()
    
    print("--- Test BLOQUE_FIJO (Base 40.000, Frac 60) ---")
    t1 = MockTarifa("BLOQUE_FIJO", 40000, 60)
    
    # 40 min -> 40.000
    res = tarifador.calcular(t1, 40)
    print(f"40 min: {res['monto_total']} (Esperado: 40000)")
    assert res['monto_total'] == 40000
    
    # 60 min -> 40.000
    res = tarifador.calcular(t1, 60)
    print(f"60 min: {res['monto_total']} (Esperado: 40000)")
    assert res['monto_total'] == 40000
    
    # 61 min -> 80.000
    res = tarifador.calcular(t1, 61)
    print(f"61 min: {res['monto_total']} (Esperado: 80000)")
    assert res['monto_total'] == 80000

    print("\n--- Test BASE_MAS_EXCEDENTE_PROPORCIONAL (Base 40.000, Frac 60) ---")
    t2 = MockTarifa("BASE_MAS_EXCEDENTE_PROPORCIONAL", 40000, 60)
    
    # 60 min -> 40.000
    res = tarifador.calcular(t2, 60)
    print(f"60 min: {res['monto_total']} (Esperado: 40000)")
    assert res['monto_total'] == 40000
    
    # 61 min -> 40.000 + (1 * 666.666...) -> 40.667
    res = tarifador.calcular(t2, 61)
    print(f"61 min: {res['monto_total']} (Esperado: 40667)")
    assert res['monto_total'] == 40667
    
    # 75 min -> 40.000 + (15 * 666.666...) -> 40.000 + 10.000 -> 50.000
    res = tarifador.calcular(t2, 75)
    print(f"75 min: {res['monto_total']} (Esperado: 50000)")
    assert res['monto_total'] == 50000

    print("\n--- Test con Valor Minuto Explícito (Base 40.000, Frac 60, Min 1.000) ---")
    t3 = MockTarifa("BASE_MAS_EXCEDENTE_PROPORCIONAL", 40000, 60, {
        "usar_valor_minuto_explicito": True,
        "valor_minuto_excedente": 1000
    })
    
    # 75 min -> 40.000 + (15 * 1000) -> 55.000
    res = tarifador.calcular(t3, 75)
    print(f"75 min (exp): {res['monto_total']} (Esperado: 55000)")
    assert res['monto_total'] == 55000

    print("\n✅ TODOS LOS TESTS PASARON")

if __name__ == "__main__":
    test_tarifador()
