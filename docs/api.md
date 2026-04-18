# API Reference - ParkingController

La API de ParkingController es una REST API construida con **FastAPI**, documentada automáticamente bajo el estándar OpenAPI (Swagger).

## Endpoints Principales

### 1. Tickets
Manejo de estados y consultas de vehículos.

*   **`GET /api/v1/tickets/{codigo}`**
    *   **Propósito**: Obtiene el estado actual de un ticket.
    *   **Response**: `TicketResponse` (JSON).

*   **`GET /api/v1/tickets/{codigo}/simular`**
    *   **Propósito**: Calcula el costo dinámico basado en la hora actual y la tarifa activa.
    *   **Response**: `LiquidacionCalculadaResponse` (Incluye detalle de cálculo).

### 2. Ventas y Cobranza
Procesamiento de pagos en caja.

*   **`POST /api/v1/ventas/cobrar`**
    *   **Request Body**:
        ```json
        {
          "codigo_ticket": "TKT-12345",
          "medio_pago": "EFECTIVO"
        }
        ```
    *   **Response**: Detalle del cobro registrado e ID de transacción.

### 3. Motor Tarifario
Administración de las reglas de negocio.

*   **`GET /api/v1/tarifas/activa`**
    *   **Propósito**: Obtener la configuración vigente del tarifador.

*   **`PUT /api/v1/tarifas/activa`**
    *   **Request Body**:
        ```json
        {
          "nombre": "Tarifa Estándar",
          "modo_calculo": "BLOQUE_FIJO",
          "valor_base": 40000,
          "fraccion_minutos": 60,
          "redondea_hacia_arriba": true
        }
        ```

### 4. Facturación
Emisión de comprobantes legales.

*   **`POST /api/v1/facturacion/emitir`**
    *   **Request Body**:
        ```json
        {
          "id_cobro": 45,
          "tipo_documento": "CI",
          "numero_documento": "1234567",
          "nombre_razon_social": "Juan Pérez"
        }
        ```
    *   **Response**: ID de Factura, Número de comprobante e IVA detallado.

## Errores Comunes

*   **`404 Not Found`**: El ticket no existe o la tarifa no ha sido inicializada.
*   **`400 Bad Request`**: Intento de cobrar un ticket que ya está en estado `COBRADO`.
*   **`500 Internal Server Error`**: Fallo en la persistencia de base de datos (se realiza rollback automático).
