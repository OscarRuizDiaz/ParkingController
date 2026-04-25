# Módulo de Reportes Históricos y Dashboard Gerencial - Frontend

## 1. Pantallas Creadas

### Dashboard Gerencial (`src/pages/DashboardGerencial.jsx`)
- **Resumen KPI**: Visualización de recaudación total, tickets únicos, turnos cerrados y promedios.
- **Desglose por Medio de Pago**: Cards para Efectivo, Tarjeta, Transferencia y Otros.
- **Filtros Dinámicos**: Búsqueda por rango de fechas, cajero y terminal de caja.
- **Refresco Automático**: Polling cada 15 segundos para mantener los datos actualizados sin intervención del usuario.

### Reportes Históricos (`src/pages/Reportes.jsx`)
- **Sistema de Tabs**: Alternancia entre Reporte de Turnos y Reporte de Cobros.
- **Reporte de Turnos**: Detalle de aperturas, cierres, montos iniciales, recaudados y diferencias por cajero.
- **Reporte de Cobros**: Detalle transaccional de cada cobro vinculado a un código de ticket.
- **Paginación Integrada**: Soporte para navegar grandes volúmenes de datos (limit/offset).
- **Filtros Especializados**: Filtrado por estado (Turnos) y medio de pago (Cobros).

## 2. Servicios API Agregados (`src/services/api.js`)
Se integraron los siguientes métodos en `apiService`:
- `getReporteFiltros()`: Obtiene catálogos de usuarios y cajas activos.
- `getDashboardResumen(params)`: KPIs financieros.
- `getReporteTurnos(params)`: Datos paginados de turnos de caja.
- `getReporteCobros(params)`: Datos paginados de transacciones de cobro.

## 3. Seguridad y Permisos (RBAC)
Las pantallas están protegidas mediante el componente `ProtectedRoute` y se visualizan en el menú lateral según el perfil del usuario:

- **Dashboard**: Requiere permiso `dashboard.view`.
- **Reportes**: Requiere permiso `reportes.view`.
- **Filtros**: Accesible si el usuario tiene cualquiera de los dos permisos anteriores.

> [!IMPORTANT]
> El rol **CAJERO** no tiene estos permisos asignados por defecto, por lo que las opciones no aparecerán en su menú y el acceso directo estará bloqueado.

## 4. Estrategia de Refresh Automático (Polling)
Para garantizar datos actualizados sin usar WebSockets, se implementó una estrategia de polling controlado:
- Se utiliza `setInterval` dentro de un `useEffect` con una referencia (`pollingRef`) para evitar duplicados.
- El intervalo es de **15 segundos**.
- Se implementó una carga "silenciosa" (`isSilent`) que actualiza los datos en segundo plano sin mostrar el spinner de carga principal, evitando parpadeos en la UI.
- El intervalo se limpia automáticamente al desmontar el componente (`cleanup function`).
- Si la API responde con un error de autorización (403), el polling se detiene automáticamente para evitar bucles de errores.

## 5. Checklist de Prueba Manual

- [ ] **Acceso ADMIN**: Iniciar sesión como administrador y verificar que aparezcan "Dashboard Gerencial" y "Reportes Históricos" en el menú.
- [ ] **Acceso CAJERO**: Iniciar sesión como cajero y confirmar que las opciones NO aparezcan.
- [ ] **Filtros Dashboard**: Cambiar el rango de fechas y verificar que los KPIs se actualicen inmediatamente.
- [ ] **Paginación Reportes**: Cambiar de página en el reporte de cobros y verificar que el `offset` se actualice y traiga nuevos datos.
- [ ] **Polling**: Permanecer en el Dashboard 20 segundos y verificar que el texto "ACTUALIZADO: HH:mm:ss" cambie automáticamente.
- [ ] **Botón Actualizar**: Presionar el botón manual y verificar que se dispare la carga con spinner.
