# Módulo de Reportes Históricos y Dashboard Gerencial - Backend V3

## 1. Objetivo del Módulo
Proveer una interfaz de datos agregados y detallados para la toma de decisiones gerenciales y el control operativo histórico del sistema de estacionamiento.

## 2. Endpoints Creados
Todos los endpoints están montados bajo el prefijo `/api/v1/reportes`.

- **GET `/dashboard/resumen`**: Indicadores clave de rendimiento (KPIs).
- **GET `/turnos`**: Listado paginado de turnos.
- **GET `/cobros`**: Listado paginado de cobros.
- **GET `/filtros`**: Metadatos para selectores.

## 3. Estructura de Respuesta Paginada
Para los listados de `/turnos` y `/cobros`, la respuesta sigue este formato:

```json
{
  "items": [],
  "total": 125,
  "limit": 50,
  "offset": 0
}
```

## 4. Indicadores del Dashboard
- **`cantidad_tickets_cobrados`**: Representa la cantidad de **tickets únicos** que fueron liquidados y cobrados en el periodo. Se calcula mediante un conteo distinto de `id_ticket` en la tabla de liquidaciones asociadas a los cobros del rango.
- **`total_recaudado`**: Sumatoria de todos los montos de cobros con estado 'COBRADO'.
- **`promedio_recaudacion_por_turno`**: `total_recaudado / cantidad_turnos_cerrados`.

## 5. Parámetros de Filtrado

### Dashboard Resumen
- `fecha_desde`, `fecha_hasta` (obligatorios).
- `usuario_id`, `caja_id`, `sucursal` (opcionales).

### Reportes (Turnos y Cobros)
- `fecha_desde`, `fecha_hasta` (obligatorios).
- `limit` (default 50), `offset` (default 0).
- Filtros específicos: `estado` (para turnos), `medio_pago` (para cobros).

## 6. Seguridad y RBAC (Seed Oficial)
El sistema utiliza el catálogo maestro definido en `app/rbac_seed.py`.

### Configuración de Permisos:
- **ADMINISTRADOR**: Acceso total (incluye `dashboard.view` y `reportes.view`).
- **SUPERVISOR**: Acceso total a reportes y dashboard.
- **CAJERO**: **Sin acceso** a reportes ni dashboard por defecto.

| Permiso | Propósito | Roles |
| :--- | :--- | :--- |
| `dashboard.view` | Ver KPIs principales | ADMIN, SUPERVISOR |
| `reportes.view` | Ver listados de turnos/cobros | ADMIN, SUPERVISOR |

## 7. Notas de Implementación Técnica
- **Pydantic v2**: Se utiliza `model_validate(row._mapping)` para garantizar la compatibilidad con los objetos de fila de SQLAlchemy 2.0.
- **Paginación**: Se realizan consultas de conteo (`count()`) independientes para obtener el total de registros que coinciden con los filtros antes de aplicar el límite.
- **Filtro de Turnos**: Se mantiene el criterio de filtrado por `fecha_hora_apertura`.
