# Motor Tarifario (Tarifador) - ParkingController

El Motor Tarifario es el componente responsable de traducir el tiempo de estancia de un vehículo en un monto monetario exacto, siguiendo reglas configurables en tiempo real.

## Precisión Financiera

A diferencia de otros sistemas que usan tipos de datos `float`, el Tarifador de ParkingController utiliza la librería **`Decimal`** de Python en todos sus cálculos internos.

- **Redondeo**: Se aplica el método `ROUND_HALF_UP` para garantizar que los guaraníes siempre sean números enteros consistentes.
- **Inmutabilidad**: Una vez que un cálculo se persiste, el tarifador no vuelve a tocarlo para ese ticket, garantizando integridad contable.

## Modos de Cálculo Soportados

### 1. BLOQUE_FIJO (Lógica por Bloques)
Es el método tradicional de cobro por horas o bloques fijos de tiempo. Cualquier fracción de tiempo que supere el bloque actual dispara el cobro del siguiente bloque completo.

**Regla**: `Monto = Valor Base * Bloques Redondeados al Entero Superior`.

- **Ejemplo (Base: 40.000 Gs / Bloque: 60 min)**:
  - 40 min -> 1 bloque = 40.000 Gs
  - 60 min -> 1 bloque = 40.000 Gs
  - 61 min -> 2 bloques = 80.000 Gs

### 2. BASE_MAS_EXCEDENTE_PROPORCIONAL
Ideal para cobrar un costo fijo inicial y luego una tarifa prorrateada por minuto para el tiempo adicional.

**Regla**: `Monto = Valor Base + (Minutos Excedentes * (Valor Base / Fracción Base))`.

- **Ejemplo (Base: 40.000 Gs / Bloque: 60 min)**:
  - 40 min -> Dentro del primer bloque (mínimo) = 40.000 Gs
  - 61 min -> 1 bloque base (40.000) + 1 min excedente (667 Gs) = 40.667 Gs
  - 90 min -> 1 bloque base (40.000) + 30 min excedentes (20.000 Gs) = 60.000 Gs

## Configuración Dinámica

El tarifador consulta la tabla `parking.tarifas` para obtener los parámetros activos:
- `valor_base`: Monto base a cobrar.
- `fraccion_minutos`: Duración del bloque base en minutos.
- `modo_calculo`: Identificador de la estrategia matemática a usar.

Esta configuración puede cambiarse desde la interfaz administrativa de **Motor Tarifario** y tiene efecto inmediato sobre todos los tickets que aún no han sido cobrados.
