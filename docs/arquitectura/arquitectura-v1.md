# Arquitectura Inicial v1 - ParkingController

## 1. Enfoque general

El sistema se desarrollará con arquitectura separada en frontend, backend y base de datos.

## 2. Stack tecnológico

- Frontend: React
- Backend: FastAPI (Python)
- Base de datos: PostgreSQL

## 3. Componentes

### Frontend
Responsable de:
- login,
- consulta de ticket,
- pantalla de cobro,
- búsqueda de cliente,
- emisión visual de factura,
- administración básica.

### Backend
Responsable de:
- autenticación,
- lógica de negocio,
- cálculo de tarifas,
- facturación,
- caja,
- auditoría,
- API para integraciones futuras.

### Base de datos
Responsable de:
- persistencia de tickets,
- clientes,
- tarifas,
- cajas,
- cobros,
- facturas,
- auditoría.

## 4. Módulos previstos

- Seguridad
- Tickets
- Motor tarifario
- Clientes
- Caja
- Facturación
- Reportes
- Integraciones futuras

## 5. Principios de diseño

1. Separar ticket, liquidación, cobro y factura.
2. Mantener reglas tarifarias parametrizables.
3. Registrar auditoría de operaciones críticas.
4. Diseñar para futura integración con SIFEN.
5. Aplicar principio de mínimo privilegio en base de datos.

## 6. Integraciones futuras

- proveedor externo de tickets,
- servicios fiscales,
- SIFEN,
- impresión o POS,
- lectores de código o QR.