# Flujo Operativo - ParkingController

Este documento describe el flujo de trabajo estándar para un operador de caja en el sistema ParkingController.

## 1. Entrada del vehículo
- El sistema de barrera (externo) registra el ingreso y entrega un ticket al cliente.
- El ticket contiene un `codigo_ticket` único.
- El estado inicial es `PENDIENTE`.

## 2. Consulta y Simulación
- El cliente se acerca a la caja antes de salir.
- El operador escanea el código o lo ingresa manualmente en la pantalla de **Caja Principal**.
- El sistema muestra:
  - Tiempo de estancia transcurrido.
  - El monto acumulado según la tarifa actual.
  - El desglose del cálculo (Bloques o Proporcional).
- **Importante**: Mientras el ticket esté en pantalla, el monto se actualiza dinámicamente cada vez que se refresca la consulta.

## 3. Liquidación y Cobro
- El operador confirma con el cliente el monto a abonar.
- Se selecciona el **Medio de Pago** (Efectivo, Tarjeta, etc).
- Al presionar **"Registrar Cobro"**:
  1. El sistema congela el valor del ticket.
  2. Crea un registro de Cobro en la base de datos.
  3. Cambia el estado del ticket a `COBRADO`.
- El sistema muestra la pantalla de **Resultado**, donde se puede imprimir un comprobante no fiscal.

## 4. Emisión de Factura (Opcional)
- Si el cliente requiere factura legal, el operador presiona **"Continuar a Facturación"**.
- Se ingresa el RUC o documento del cliente.
- Si el cliente no existe, se realiza un **"Alta Rápida"**.
- Al presionar **"Emitir Factura"**:
  1. Se genera el documento fiscal (Fase 1: No SIFEN).
  2. El ticket cambia de estado a `FACTURADO`.
- Se entrega la factura al cliente.

## 5. Salida del Parking
- El cliente presenta el ticket en la barrera de salida.
- El sistema de salida valida que el ticket esté en estado `COBRADO` o `FACTURADO`.
- Se permite la salida del vehículo.
