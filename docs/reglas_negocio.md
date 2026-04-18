# Reglas de Negocio - ParkingController

Este documento formaliza las reglas lógicas que gobiernan el comportamiento del sistema, garantizando consistencia operativa y financiera.

## 1. Ciclo de Cálculo y Congelamiento

El principio fundamental del sistema es que **la deuda del cliente debe ser inmutable una vez confirmada el monto**.

### Estado: PENDIENTE
- El cálculo es **dinámico**.
- Se recalcula cada vez que se consulta el ticket basándose en `datetime.now()`.
- Se permite el cambio de tarifa activa y este cambio afecta inmediatamente a la simulación.

### Estado: LIQUIDADO / COBRADO
- El cálculo está **CONGELADO**.
- Al momento de la liquidación, el sistema guarda el monto final, los minutos y el detalle del cálculo en la tabla `liquidaciones`.
- Consultas posteriores al ticket devolverán los valores históricos de la tabla de liquidación, ignorando el paso del tiempo real.
- **Razón**: Evita que el monto suba mientras el cliente camina de la caja a su vehículo o mientras se procesa el pago.

## 2. Precisión Monetaria e IVA

- **Moneda**: Guaraníes (Gs).
- **Tipo de dato**: `Decimal(14, 2)` en base de datos.
- **Redondeo**: Enteros sin decimales, usando `ROUND_HALF_UP`.
- **IVA**: 10% Fijo (Simplificación Fase 1). Los importes almacenados son "IVA Incluido".
  - Base Imponible = `Total / 1.1`
  - IVA 10% = `Total - Base Imponible`

## 3. Validaciones Críticas

- **Doble Cobro**: Un ticket en estado `COBRADO` o `FACTURADO` tiene bloqueado el endpoint de cobranza. Cualquier intento devolverá un error de negocio.
- **Tarifa Activa**: El sistema requiere que siempre exista **exactamente una** tarifa marcada como `activo = true`. El Motor Tarifario fallará defensivamente si no la encuentra.
- **Integridad de Cliente**: Para la emisión de facturas, es obligatorio el `número_documento`. El sistema permite el "Alta Rápida" (Maestros) para no detener el flujo de caja.

## 4. Auditoría de Estados

Cada cambio de estado en un ticket (`PENDIENTE` -> `LIQUIDADO` -> `COBRADO`) debe ocurrir de forma secuencial. No es posible "Facturar" un ticket que no ha sido previamente "Cobrado" o que se encuentra pendiente.
