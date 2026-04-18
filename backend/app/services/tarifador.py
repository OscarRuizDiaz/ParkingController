import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Literal
from app.models.parking import Tarifa

class Tarifador:
    """
    Motor de cálculo tarifario desacoplado.
    
    REGLA DE REDONDEO MONETARIO:
    - Guaraníes enteros (sin decimales).
    - Método: ROUND_HALF_UP (redondeo al entero más cercano, mitades hacia arriba).
    """

    def calcular(self, tarifa: Tarifa, minutos: int) -> Dict[str, Any]:
        """
        Orquesta el cálculo según el modo configurado en la tarifa.
        """
        # 1. Validaciones defensivas
        if tarifa.valor_base is None:
            raise ValueError("La tarifa no tiene un valor base definido.")
        if not tarifa.fraccion_minutos or tarifa.fraccion_minutos <= 0:
            raise ValueError("La fracción de minutos debe ser mayor a cero.")
        
        # 2. Normalización de entrada
        minutos_operativos = max(0, minutos)

        if tarifa.modo_calculo == "BLOQUE_FIJO":
            return self._calcular_bloque_fijo(tarifa, minutos_operativos)
        elif tarifa.modo_calculo == "BASE_MAS_EXCEDENTE_PROPORCIONAL":
            return self._calcular_base_mas_excedente(tarifa, minutos_operativos)
        else:
            raise ValueError(f"Modo de cálculo '{tarifa.modo_calculo}' no soportado por el motor.")

    def _calcular_bloque_fijo(self, tarifa: Tarifa, minutos: int) -> Dict[str, Any]:
        """
        Lógica de bloques completos. Redondeo hacia arriba.
        Cualquier fracción del bloque se cobra como un bloque entero.
        """
        valor_base = Decimal(str(tarifa.valor_base))
        fraccion = tarifa.fraccion_minutos
        
        # Cobro mínimo 1 bloque
        bloques = max(1, math.ceil(minutos / fraccion))
        total = (valor_base * Decimal(bloques)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        
        return {
            "monto_total": total,
            "cant_bloques": bloques,
            "detalle": {
                "modo_calculo": "BLOQUE_FIJO",
                "valor_base": str(valor_base),
                "fraccion_minutos": fraccion,
                "bloques_calculados": bloques,
                "total": str(total)
            }
        }

    def _calcular_base_mas_excedente(self, tarifa: Tarifa, minutos: int) -> Dict[str, Any]:
        """
        Lógica de primer bloque completo + excedente proporcional minuto a minuto.
        """
        valor_base = Decimal(str(tarifa.valor_base))
        fraccion = tarifa.fraccion_minutos
        config = tarifa.configuracion_json or {}
        
        # El primer bloque (fraccion_minutos) siempre se cobra completo como base
        monto_base = valor_base
        minutos_excedentes = max(0, minutos - fraccion)
        
        # Determinar valor del minuto
        if config.get("usar_valor_minuto_explicito") and config.get("valor_minuto_excedente"):
            valor_minuto = Decimal(str(config["valor_minuto_excedente"]))
        else:
            # Por defecto: valor_base / fraccion
            valor_minuto = (valor_base / Decimal(fraccion))
            
        monto_excedente = (Decimal(minutos_excedentes) * valor_minuto).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        total = monto_base + monto_excedente
        
        # En modo proporcional, la 'cantidad de bloques' es referencial (1 base + N min)
        return {
            "monto_total": total,
            "cant_bloques": 1, 
            "detalle": {
                "modo_calculo": "BASE_MAS_EXCEDENTE_PROPORCIONAL",
                "monto_base": str(monto_base),
                "minutos_base": fraccion,
                "minutos_excedentes": minutos_excedentes,
                "valor_minuto": str(valor_minuto.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)),
                "monto_excedente": str(monto_excedente),
                "total": str(total)
            }
        }
