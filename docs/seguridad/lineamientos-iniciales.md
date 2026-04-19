# Lineamientos de Seguridad - ParkingController

Este documento define los estándares de seguridad implementados para garantizar la integridad financiera y la protección de datos en ParkingController.

## Arquitectura de Seguridad: RBAC Dinámico

El pilar de la seguridad en el sistema es el **Control de Acceso Basado en Roles (RBAC) con Fuente de Verdad en el Backend**.

### 1. Principios Fundamentales
- **Backend-First Enforcement**: El frontend solo actúa como un reflejo visual de los permisos del backend. Toda validación de seguridad crítica debe ocurrir en la capa de servicios del backend.
- **Mínimo Privilegio**: Ningún usuario debe tener acceso a módulos fuera de su alcance operativo (ej: un Cajero no tiene acceso al panel de edición de Tarifas o Roles).
- **Aislamiento de Datos**: El esquema `seguridad` está separado lógicamente del esquema `parking` para mitigar el impacto de posibles fallos de seguridad o errores de acceso.

### 2. Implementación Técnica
- **Autenticación**: JWT (JSON Web Tokens) con expiración corta. Se requiere autenticación para todos los módulos excepto el health check.
- **Procedimiento de Login**: Tras autenticarse, el backend inyecta los `permissions` reales del rol del usuario en la respuesta. El frontend debe persistir estos permisos únicamente durante la sesión.
- **Protección de Endpoints**: Se utiliza la dependencia `require_permission` en FastAPI para cada endpoint administrativo u operativo sensible.

## Riesgos Mitigados
- **Modificación no autorizada de tarifas**: Protegido por el permiso `tarifas.manage`. 
- **Anulación indebida de tickets**: Protegido por auditoría de estados y permisos de gestión.
- **Acceso indebido a reportes de caja**: Protegido por `reportes.view`.
- **Escalamiento de privilegios**: El rol ADMINISTRADOR no es editable por otros roles (incluyendo a otros administradores en la UI base).

## Auditoría y Eventos Críticos
El sistema registra (en logs o base de datos) los siguientes eventos para auditoría posterior:
- Logins exitosos y fallidos.
- Apertura y cierre de turnos de caja (arqueos).
- Creación de liquidaciones (congelamiento de montos).
- Modificación de la matriz de permisos de un rol.
- Cambio de tarifas activas.

---

*Última actualización: Abril 2026 - Alineado con RBAC v2.0*