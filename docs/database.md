# Schema de Base de Datos - ParkingController

El sistema utiliza **PostgreSQL** con una estructura multiesquema para garantizar la separación de responsabilidades y la seguridad de los datos.

## Esquemas de Datos

1.  **`parking`**: Contiene toda la lógica operativa (tickets, cobros, facturas, tarifas).
2.  **`seguridad`**: Dedicado exclusivamente al control de acceso y RBAC (usuarios, roles, permisos).

---

## Módulo Operativo (`parking`)

### 1. `tickets`
Ciclo de vida del vehículo en el estacionamiento.
- `id_ticket` (PK): Identificador secuencial.
- `codigo_ticket` (Unique): Identificador de cara al cliente.
- `fecha_ingreso` / `fecha_salida`: Tiempos de estancia.
- `estado`: `PENDIENTE`, `LIQUIDADO`, `COBRADO`, `FACTURADO`.

### 2. `tarifas`
Reglas de cálculo activas.
- `id_tarifa` (PK).
- `nombre`, `modo_calculo`, `valor_base`.
- `activo`: Solo una tarifa puede estar activa para el cálculo de liquidaciones.

### 3. `liquidaciones`
Registro histórico de montos calculados.
- `id_liquidacion` (PK).
- `monto_total`: Valor final cobrado.
- `detalle_json`: Auditoría de la fórmula aplicada en el momento del cobro.

---

## Módulo de Seguridad (`seguridad`)

### 1. `roles`
Definición de perfiles de acceso.
- `nombre`: Único (ej: ADMINISTRADOR, SUPERVISOR).
- `activo`: Permite deshabilitar un perfil completo.

### 2. `permisos` (Catálogo Maestro)
Acciones lógicas permitidas en el sistema.
- `codigo`: Identificador clave usado en backend y frontend (ej: `caja.view`).
- `modulo`: Agrupación funcional (ej: `Caja`, `Administración`).

### 3. `roles_permisos`
Matriz dinámica de acceso.
- Relación N:N entre roles y permisos. Es la base del **enforcement** de seguridad en tiempo real.

### 4. `usuarios`
Cuentas de acceso al sistema.
- `username`: Identificador de login.
- `password_hash`: Credencial cifrada (BCrypt).
- `id_rol`: Vínculo directo con el perfil de permisos.

---

## Integridad y Estados

- **Integridad Referencial**: No se permite la eliminación de tickets que posean liquidaciones o cobros asociados por razones contables.
- **Transaccionalidad**: Las operaciones de caja (Turnos) se ejecutan bajo bloques de transacción atómicos para evitar inconsistencias de saldos ante errores de red.
- **Auditabilidad**: El campo `detalle_json` en liquidaciones garantiza que, aunque cambie la tarifa global, se pueda reconstruir el cálculo original de cada ticket cobrado en el pasado.
