# RBAC Dinámico - Gestión de Seguridad

ParkingController utiliza un sistema de **Control de Acceso Basado en Roles (RBAC)** totalmente dinámico. A diferencia de sistemas estáticos, la matriz de permisos puede ser alterada en tiempo real sin necesidad de cambios en el código o despliegues.

## Modelo de Datos

El sistema de seguridad reside en el esquema `seguridad` de PostgreSQL y consta de tres entidades principales:

1.  **Permisos (`seguridad.permisos`)**: Catálogo maestro de acciones atómicas (ej: `caja.view`, `roles.manage`).
2.  **Roles (`seguridad.roles`)**: Agrupaciones lógicas de permisos (ej: `CAJERO`, `SUPERVISOR`).
3.  **Relación Rol-Permiso (`seguridad.roles_permisos`)**: Tabla puente que define qué permisos tiene cada rol.

## Fuente de Verdad (Backend First)

Para garantizar la máxima seguridad y consistencia:
- **Validación en Backend**: Cada endpoint protegido utiliza una dependencia de FastAPI (`require_permission`) que verifica si el usuario autenticado posee el código de permiso necesario en la base de datos.
- **Sincronización de Frontend**: El Frontend **no guarda** una lista local de qué puede hacer cada rol. En su lugar, tras el login, consume la propiedad `permissions` del objeto `user` devuelta por el backend.

## Flujo de Autorización en el Frontend

El Frontend utiliza hooks y componentes de guardia para proteger la interfaz:

1.  ** Hook `useAuth`**: Proporciona la función `hasPermission(codigo_permiso)`.
2.  **Componente `PermissionGate`**: Envuelve elementos de la UI (botones, links) para ocultarlos o deshabilitarlos si el usuario no tiene el permiso necesario.
3.  **`ProtectedRoute`**: Protege rutas completas (páginas) redirigiendo a una pantalla de "Acceso Denegado" si es necesario.

## Matriz de Administración

Desde el panel de **Seguridad y Roles**, los administradores pueden:
- Ver la lista de roles y su estado actual.
- Consultar el catálogo maestro de permisos agrupados por módulos funcionales.
- Activar o desactivar permisos específicos para un rol de forma atómica.
- Los cambios aplicados se reflejan inmediatamente en las nuevas sesiones de los usuarios.

## Consideraciones del Rol ADMINISTRADOR

El rol con nombre `ADMINISTRADOR` es tratado como una cuenta de sistema protegida en la UI:
- No se permite editar sus permisos desde el panel administrativo para evitar bloqueos accidentales.
- El backend le otorga acceso total basado en su configuración inicial.
- Se recomienda el uso de este rol solo para mantenimiento técnico y gestión de otros roles.
