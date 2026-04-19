# ParkingController Backend 🐍⛽

Backend empresarial para la gestión de estacionamientos, construido con **FastAPI** y **PostgreSQL**.

## Stack Tecnológico

- **Framework**: FastAPI (Async support).
- **ORM**: SQLAlchemy 2.0 (Pattern: Repository/Service).
- **Validación**: Pydantic v2.
- **Seguridad**: JWT (jose) + Passlib (BCrypt).
- **Migraciones**: Alembic.
- **Base de Datos**: PostgreSQL (Esquemas `parking` y `seguridad`).

## Estructura de Capas

1.  **Endpoints (`app/api/v1/endpoints`)**: Rutas de la API. Validación de entrada y orquestación.
2.  **Dependencies (`app/api/deps`)**: Inyección de dependencias (DB session, Auth user, Role permissions).
3.  **Services (`app/services`)**: Lógica de negocio (Cálculos de tarifas, lógica RBAC).
4.  **Repositories (`app/repositories`)**: Abstracción del acceso a datos.
5.  **Models (`app/models`)**: Entidades de base de datos divididas por esquemas.

## Aplicación de Seguridad & RBAC

El backend implementa un sistema de autorización granular:
- Los permisos se cargan dinámicamente desde el esquema `seguridad`.
- Se utiliza el decorador `require_permission("nombre.permiso")` en los endpoints de FastAPI.
- El objeto de usuario devuelto en el login incluye la lista plana de permisos del rol asignado.

## Instalación y Ejecución

```bash
# Entorno virtual
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows

# Dependencias
pip install -r requirements.txt

# Base de Datos (Estructura inicial)
# Asegúrese de configurar DATABASE_URL en .env
alembic upgrade head

# Seed de seguridad
python app/rbac_seed.py

# Iniciar servidor
uvicorn app.main:app --reload
```

## Endpoints Principales

- `/api/v1/login/access-token`: Autenticación.
- `/api/v1/rbac/`: Gestión de roles y permisos.
- `/api/v1/tickets/`: Operaciones de cobro y liquidación.
- `/api/v1/ventas/`: Turnos y caja.
