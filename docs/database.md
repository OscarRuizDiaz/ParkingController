# Schema de Base de Datos - ParkingController

El sistema utiliza **PostgreSQL** con un esquema dedicado llamado `parking` para asegurar la integridad de los datos y facilitar auditorías.

## Tablas Principales

### 1. `tickets`
Almacena los registros de entrada de los vehículos.
- `id_ticket`: Identificador único (BigInt).
- `codigo_ticket`: Código de barras o QR impreso para el cliente.
- `fecha_ingreso`: Timestamp de entrada.
- `estado`: Estado actual del ticket.

### 2. `tarifas`
Define las reglas de cobro configurables.
- `id_tarifa`: ID de versión de tarifa.
- `nombre`: Nombre descriptivo (ej: "Tarifa Nocturna").
- `modo_calculo`: `BLOQUE_FIJO` o `BASE_MAS_EXCEDENTE_PROPORCIONAL`.
- `valor_base`: Monto base (`Numeric`).
- `fraccion_minutos`: Duración del bloque base en minutos.
- `activo`: Booleano para indicar la tarifa vigente.

### 3. `liquidaciones`
Registra el cálculo monetario realizado en el momento del cobro.
- `id_liquidacion`: ID único.
- `id_ticket`: Relación con el ticket.
- `monto_total`: Monto final calculado (`Numeric`).
- `minutos_estancia`: Tiempo total acumulado.
- `detalle_json`: Almacena el desglose del cálculo para auditoría histórica.

## Estados del Ticket

El `estado` de un ticket es el corazón de la lógica de negocio y sigue este ciclo de vida:

1.  **`PENDIENTE`**: El vehículo está en el parking. El sistema calcula el costo en tiempo real para simulación.
2.  **`LIQUIDADO`**: El operador ha escaneado el ticket y el sistema ha generado una liquidación. El valor se congela en este punto.
3.  **`COBRADO`**: El pago ha sido registrado en caja. El ticket no permite más cambios.
4.  **`FACTURADO`**: Se emitió un comprobante fiscal legal asociado al cobro.

## Integridad Referencial

- Un **Ticket** puede tener una única **Liquidación** vigente.
- Una **Factura** se vincula a un **Cobro**, el cual está vinculado a una **Liquidación** y a un **Ticket**.
- El borrado de tickets cobrados está restringido por integridad referencial para evitar pérdida de datos contables.
