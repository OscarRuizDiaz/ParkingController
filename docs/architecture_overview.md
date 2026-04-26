# Resumen de Arquitectura: ParkingController

## Componentes del Sistema

### 1. Base de Datos (PostgreSQL)
Almacena el estado persistente. Contiene tablas para `usuarios`, `roles`, `permisos`, `cajas`, `turnos`, y `tickets`. En despliegues de VM localizados, la base de datos comúnmente reside en una máquina Windows separada, exponiendo el puerto `5433`.

### 2. Backend (FastAPI + SQLAlchemy)
- Ubicación: `/backend/`
- Servidor: Uvicorn (Puerto 8000).
- Exposición de API RESTFul bajo la ruta base `/api/v1`.
- Actúa como la única fuente de verdad (Single Source of Truth) para seguridad (JWT), validaciones, cálculo tarifario y lógicas de cierre de caja.

### 3. Frontend (React + Vite)
- Ubicación: `/parking-ui/` *(Ignorar la carpeta `/frontend/` residual).*
- Servidor local: Vite Server (Puerto 5173).
- Servidor producción: Nginx Alpine.
- Consumo de API: Vía proxy `/api/v1` para evitar bloqueos CORS.

## Flujo de Red (Nginx Reverse Proxy)

Para evitar problemas de IPs estáticas quemadas en compilaciones de JS:
1. El usuario accede a `http://IP_VM:8089`.
2. Las peticiones REST hacia `http://IP_VM:8089/api/v1/*` son capturadas por el bloque `location /api/` de Nginx.
3. Nginx retransmite (Proxy) la petición internamente a `http://backend:8000/api/v1/*`.
4. El Frontend (SPA) siempre realiza las peticiones hacia URI relativas (`/api/v1/login/access-token`), haciéndolo 100% agnóstico del ambiente.
