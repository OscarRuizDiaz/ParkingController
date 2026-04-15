# Lineamientos Iniciales de Seguridad - ParkingController

## Objetivo

Definir controles mínimos para el desarrollo seguro del sistema desde el inicio.

## Controles mínimos

- autenticación segura,
- hash de contraseñas,
- roles y permisos,
- validación de entradas,
- protección contra cobro duplicado,
- auditoría de eventos críticos,
- uso de HTTPS en despliegue,
- principio de mínimo privilegio en PostgreSQL,
- separación de ambientes: desarrollo, QA y producción.

## Riesgos a considerar

- cobro duplicado,
- facturación duplicada,
- modificación no autorizada de tarifas,
- anulación indebida,
- fuga de datos de clientes,
- acceso indebido a reportes o caja.

## Eventos a auditar

- login,
- logout,
- apertura de caja,
- cierre de caja,
- cálculo de tarifa,
- cobro,
- emisión de factura,
- anulación,
- cambio de tarifa,
- cambio de datos del cliente.