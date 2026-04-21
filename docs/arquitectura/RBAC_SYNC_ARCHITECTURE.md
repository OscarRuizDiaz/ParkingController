# Arquitectura de Sincronización RBAC Dinámica

## 1. Principio Arquitectónico Central

> "**Todo cambio en roles, permisos, seguridad o módulos debe contemplar sincronización completa en backend, frontend, sesión y UI, evitando estados inconsistentes o 'stale' (obsoletos).**"

La seguridad de **ParkingController** se basa en un modelo de Control de Acceso Basado en Roles (RBAC) dinámico donde el **Backend es la única fuente de verdad**. El sistema debe garantizar que cualquier cambio administrativo tenga un impacto inmediato y consistente en la experiencia de todos los usuarios concurrentes.

---

## 2. Problema que se evita

Esta arquitectura mitiga directamente los siguientes riesgos operativos:
- **Desincronización de permisos**: Usuarios operando con privilegios que ya les fueron revocados o que aún no han sido propagados.
- **Sesiones 'Stale'**: Dependencia de datos cargados únicamente al iniciar sesión (Login).
- **Accesos Incorrectos**: Acceso a endpoints de API sin la validación de permisos en tiempo real.
- **UI Inconsistente**: Botones, menús o pantallas visibles que fallan al interactuar por falta de permisos de red (Error 403).

---

## 3. Componentes Afectados

Cualquier cambio en la matriz de seguridad impacta obligatoriamente en:
- **Base de Datos**: Tablas `roles`, `permisos` y la relación `permisos_roles`.
- **Catálogo Maestro (Seed)**: El archivo `rbac_seed.py` como definición estándar.
- **Backend**: Endpoints protegidos mediante decoradores `@require_permission`.
- **Sesión (AuthContext)**: Estado reactivo de React que mantiene los permisos en memoria del cliente.
- **Frontend (Estado Global)**: El objeto `user.permissions` sincronizado con `localStorage`.
- **Componentes de Protección**: `PermissionGate` y `ProtectedRoute`.
- **Navegación / Menú**: La configuración `screens.js` basada en códigos dinámicos.
- **UI Visible**: Re-renderizado de componentes según el nuevo mapa de permisos.

---

## 4. Regla de Impacto Obligatorio

**Todo desarrollo, corrección o nuevo módulo debe validar el impacto en la cadena completa de sincronización.** No se considera "terminado" un cambio que solo afecte a la base de datos sin contemplar la propagación de la sesión o la actualización de la UI.

---

## 5. Checklist Obligatorio antes de Cerrar Desarrollo

- [ ] **Permiso creado en Backend**: Código único definido según estándares (ej: `modulo.accion`).
- [ ] **Permiso agregado en Seed RBAC**: Incluido en `MASTER_CATALOG` y asignado a roles en `ASSIGNMENTS`.
- [ ] **Endpoint Protegido**: Uso de `require_permission("codigo.permiso")` en el router de FastAPI.
- [ ] **Disponibilidad en `/usuarios/me`**: El objeto `UsuarioResponse` debe incluir el nuevo código tras el refresco.
- [ ] **Frontend Consume Permiso Dinámico**: El componente correspondiente usa `hasPermission()`.
- [ ] **UI Protegida Correctamente**: Uso de `PermissionGate` para elementos granulares.
- [ ] **Navegación Sincronizada**: Ruta configurada en `screens.js` con el permiso correcto.
- [ ] **Actualización de Sesión**: Validación de que `refreshUser` recupera el nuevo estado.
- [ ] **Pruebas Multi-rol**: Verificación del comportamiento con ADMINISTRADOR, SUPERVISOR y CAJERO.

---

## 6. Reglas para Nuevos Módulos

- Todo módulo nuevo **debe** tener permisos definidos desde su concepción.
- **Prohibido** hardcodear accesos basados en nombres de roles (ej: `if (role === 'admin')`).
- El acceso debe ser siempre granular y basado en el catálogo de permisos dinámico.

---

## 7. Reglas para Frontend

- **Fuente de Verdad**: Nunca asumir permisos; siempre consultar el contexto de autenticación.
- **Reactividad**: Usar `hasPermission()`, `PermissionGate` y `ProtectedRoute` para asegurar que el sistema reaccione a los cambios de estado en `AuthContext`.
- **Consistencia**: Los códigos de permiso en el frontend deben ser espejos exactos de los definidos en el catálogo maestro del backend.

---

## 8. Reglas para Backend

- **Enforcement**: Todo endpoint sensible debe validar permisos de forma atómica.
- **Transparencia**: Los permisos del usuario deben enviarse tanto en el `login` como en el endpoint de perfil `/usuarios/me`.
- **Integridad**: El backend debe rechazar cualquier operación si el token no cuenta con el permiso activo en ese instante (Single Source of Truth).

---

## 9. Manejo de Sincronización en Tiempo Real

El sistema implementa tres mecanismos de seguridad para garantizar la frescura de datos:
1. **Refresh Post-Cambio**: Al guardar cambios en RBAC, el administrador gatilla un `refreshUser()` inmediato.
2. **Polling Inteligente**: Cada 60 segundos, el sistema sincroniza permisos si la pestaña del navegador está visible (`document.visibilityState === 'visible'`).
3. **Manejo de 403 (Auto-Retry)**: Ante una denegación de acceso, el interceptor de peticiones dispara un `refreshUser()` y reintenta la petición original automáticamente una vez, permitiendo una sincronización transparente para el usuario.

---

## 10. Buenas Prácticas

- **Persistencia**: No eliminar usuarios; usar el flag `activo = false` para mantener trazabilidad.
- **Catálogo Inmune**: Marcar permisos como inactivos en lugar de eliminarlos para evitar errores de integridad referencial.
- **Naming**: Usar nomenclatura `modulo.accion` (ej: `caja.abrir`) para consistencia global.
- **Versionamiento**: Documentar cambios en el catálogo maestro en cada release.

---

## 11. Anti-patrones Prohibidos

- **Hardcodeo**: Definir accesos o menús fijos no validados contra el catálogo RBAC.
- **Lógica Duplicada**: Implementar validación de permisos fuera de los componentes estándar (`ProtectedRoute`, `PermissionGate`).
- **Bypass de DB**: Modificar permisos directamente en base de datos sin actualizar el script de `rbac_seed.py`.
- **Endpoints Expuestos**: Routers sin protección explícita de permisos.

---

## 12. Ejemplo Práctico: Agregar Módulo "Facturación"

1. **DB**: Generar la migración o script para los permisos `facturacion.view` y `facturacion.emitir`.
2. **Seed**: Agregar dichos códigos a `rbac_seed.py` y asignarlos a `CAJERO`.
3. **Backend**: Proteger el endpoint `POST /facturacion/emitir` con `@require_permission("facturacion.emitir")`.
4. **Frontend**: Agregar constantes en `permissions.js` para referencia del código de desarrollo.
5. **UI**: Envolver el botón de imprimir factura en un `<PermissionGate permission={PERMISSIONS.FACTURACION_EMITIR}>`.
6. **Sesión**: Validar que tras el guardado, el CAJERO recupere automáticamente la visibilidad del módulo sin cerrar sesión.

---
**ParkingController Architecture Team**
*Garantizando la integridad y sincronización de la seguridad operativa.*
