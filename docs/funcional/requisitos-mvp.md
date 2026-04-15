# Requisitos Funcionales MVP - ParkingController

## 1. Propósito

Desarrollar un sistema web de caja y facturación para la salida de clientes de un estacionamiento, utilizando tickets emitidos por un sistema externo.

## 2. Objetivo general

Permitir calcular el importe de permanencia, cobrar en caja y emitir una factura al cliente, con soporte para búsqueda por CI o RUC y cálculo de IVA, dejando preparado el sistema para una futura integración con facturación electrónica.

## 3. Alcance del MVP

### Incluye

1. Consulta de ticket de estacionamiento emitido por un tercero.
2. Cálculo del tiempo transcurrido.
3. Cálculo del importe a cobrar según regla tarifaria configurada.
4. Búsqueda y registro rápido de clientes por CI o RUC.
5. Registro de cobro en caja.
6. Emisión de factura.
7. Cálculo de IVA según parametrización.
8. Reportes operativos básicos.
9. Auditoría mínima de eventos críticos.

### No incluye

1. Registro de ingreso de vehículos.
2. Generación del ticket de entrada.
3. Integración en producción con SIFEN.
4. Integración directa obligatoria con el proveedor externo de tickets en la primera versión.

## 4. Reglas de negocio

### RN-01: Cálculo por bloques
El monto se calculará inicialmente por bloques de 60 minutos, redondeando siempre hacia arriba.

### RN-02: Tarifa base configurable
La tarifa por bloque debe ser configurable por el usuario administrador.

### RN-03: Regla inicial de ejemplo
- 0 a 60 minutos: 40.000
- 61 a 120 minutos: 80.000
- 121 a 180 minutos: 120.000

### RN-04: Preparación para fórmulas futuras
El sistema debe diseñarse para soportar otras modalidades de cálculo, por ejemplo:
- prorrateo por minuto,
- cobro por fracción,
- tramos tarifarios,
- tarifas con vigencia.

### RN-05: Ticket único
Un ticket no puede ser cobrado dos veces.

### RN-06: Factura asociada al cobro
Toda factura debe estar asociada a un cobro confirmado.

### RN-07: Cliente por documento
La búsqueda del cliente se realizará por:
- CI, o
- RUC

### RN-08: Alta rápida de cliente
Si el cliente no existe, el cajero podrá registrarlo rápidamente con los datos mínimos requeridos.

### RN-09: IVA parametrizable
El concepto facturado debe permitir IVA 10%, IVA 5% o exento, según parametrización y definición contable.

### RN-10: Trazabilidad
Toda operación crítica debe quedar auditada:
- cálculo,
- cobro,
- emisión,
- anulación,
- modificación de tarifa.

## 5. Requerimientos funcionales

### RF-01: Inicio de sesión
El sistema debe permitir autenticación de usuarios.

### RF-02: Control por roles
El sistema debe manejar al menos los siguientes roles:
- Administrador
- Cajero
- Supervisor

### RF-03: Consulta de ticket
El cajero debe poder ingresar o buscar un ticket por código.

### RF-04: Validación de ticket
El sistema debe verificar si el ticket:
- existe,
- está pendiente,
- ya fue cobrado,
- está anulado o inválido.

### RF-05: Cálculo de tiempo
El sistema debe calcular los minutos transcurridos entre ingreso y salida.

### RF-06: Cálculo de tarifa
El sistema debe calcular automáticamente el monto a cobrar según la tarifa activa.

### RF-07: Visualización del cálculo
Antes de confirmar el cobro, el sistema debe mostrar:
- ticket,
- tiempo calculado,
- tarifa aplicada,
- monto resultante.

### RF-08: Búsqueda de cliente
El sistema debe permitir buscar clientes por CI o RUC.

### RF-09: Registro de cliente
El sistema debe permitir crear un cliente nuevo con datos mínimos.

### RF-10: Cobro
El sistema debe registrar el cobro del ticket.

### RF-11: Medios de pago
El sistema debe permitir seleccionar el medio de pago:
- efectivo,
- transferencia,
- tarjeta

### RF-12: Emisión de factura
El sistema debe emitir una factura asociada al cobro realizado.

### RF-13: Detalle de factura
La factura debe incluir:
- cliente,
- concepto,
- cantidad,
- precio unitario,
- subtotal,
- IVA,
- total.

### RF-14: Reimpresión
La factura debe poder ser reimpresa o regenerada en formato visible.

### RF-15: Apertura de caja
El cajero debe poder abrir un turno de caja.

### RF-16: Cierre de caja
El cajero o supervisor debe poder cerrar el turno de caja.

### RF-17: Reporte diario
El sistema debe generar un resumen diario de cobros y facturación.

### RF-18: Auditoría básica
El sistema debe registrar eventos relevantes del proceso.

## 6. Requerimientos no funcionales

### RNF-01: Seguridad
El sistema debe validar autenticación, permisos y entradas del usuario.

### RNF-02: Escalabilidad
La arquitectura debe permitir agregar integración con SIFEN y otros módulos sin rehacer la base del sistema.

### RNF-03: Rendimiento
La búsqueda de ticket y cálculo de monto deben responder de manera ágil para uso en caja.

### RNF-04: Trazabilidad
Debe existir historial de operaciones críticas.

### RNF-05: Mantenibilidad
Las reglas tarifarias no deben quedar rígidas en código.

## 7. Casos de uso principales

### CU-01: Cobrar ticket y emitir factura
1. El cajero ingresa el ticket.
2. El sistema valida el ticket.
3. El sistema calcula el tiempo y el monto.
4. El cajero busca o registra al cliente.
5. El cajero confirma el cobro.
6. El sistema registra el cobro.
7. El sistema emite la factura.
8. El sistema marca el ticket como cobrado/facturado.

### CU-02: Registrar cliente nuevo
1. El cajero busca por CI o RUC.
2. Si no existe, crea el registro.
3. El sistema guarda el cliente.
4. El cliente queda disponible para facturación.

### CU-03: Cerrar caja
1. El usuario autorizado selecciona el turno.
2. El sistema resume operaciones del turno.
3. El usuario confirma cierre.
4. El sistema registra fecha, hora y totales.

## 8. Preparación para futuras fases

El sistema deberá quedar preparado para:

- integración con sistema externo emisor del ticket,
- múltiples sucursales y cajas,
- múltiples listas tarifarias,
- facturación electrónica SIFEN,
- anulación fiscal y eventos tributarios,
- módulo opcional de entrada de vehículos.