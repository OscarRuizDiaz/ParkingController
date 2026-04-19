# API Reference - ParkingController

La API de ParkingController es una REST API construida con **FastAPI**, documentada bajo el estándar OpenAPI (Swagger). La fuente de verdad para la documentación técnica en vivo es `/docs`.

## Autenticación & Autorización

El acceso a la mayoría de los endpoints requiere un token JWT válido.

*   **`POST /api/v1/login/access-token`**
    *   **Propósito**: Obtener un token de acceso y perfil de usuario.
    *   **Response**: 
        ```json
        {
          "access_token": "...",
          "token_type": "bearer",
          "user": {
            "id": 1,
            "username": "admin",
            "role": "ADMINISTRADOR",
            "permissions": ["roles.view", "roles.manage", "caja.view", ...]
          }
        }
        ```

*   **`GET /api/v1/usuarios/me`**
    *   **Propósito**: Consultar el perfil y permisos del usuario autenticado actualmente.

---

## Módulo RBAC (Administración de Seguridad)

Endpoints protegidos por el permiso `roles.view` y `roles.manage`.

*   **`GET /api/v1/rbac/roles`**
    *   **Response**: Lista plana de roles registrados con conteo de permisos.

*   **`GET /api/v1/rbac/permisos`**
    *   **Response**: Catálogo maestro de permisos completo (Matriz base).

*   **`GET /api/v1/rbac/roles/{id_rol}`**
    *   **Response**: Detalle del rol, incluyendo la lista de códigos de permisos asignados.

*   **`PUT /api/v1/rbac/roles/{id_rol}/permisos`**
    *   **Request Body**: `{"permisos": ["codigo_1", "codigo_2"]}`
    *   **Propósito**: Actualización atómica de la asignación de permisos de un rol.

---

## Módulo de Tickets & Liquidaciones

*   **`GET /api/v1/tickets/{codigo}`**
    *   **Propósito**: Consulta de estado de un ticket.

*   **`GET /api/v1/tickets/{codigo}/simular`**
    *   **Propósito**: Cálculo dinámico del costo basado en estancia y tarifa activa.
    *   **Permiso requerido**: `tickets.view`

---

## Módulo de Caja & Ventas

*   **`POST /api/v1/ventas/cobrar`**
    *   **Request Body**: `{"codigo_ticket": "...", "medio_pago": "..."}`
    *   **Permiso requerido**: `tickets.cobrar`

*   **`POST /api/v1/facturacion/emitir`**
    *   **Permiso requerido**: `facturacion.emitir`

---

## Errores Estándar

*   **`401 Unauthorized`**: Token inválido o expirado.
*   **`403 Forbidden`**: El usuario no posee el permiso (`permission coding`) necesario para esta acción.
*   **`404 Not Found`**: El recurso solicitado no existe.
*   **`422 Unprocessable Entity`**: Error de validación en el esquema enviado (Pydantic).
