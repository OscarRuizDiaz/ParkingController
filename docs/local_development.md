# Guía de Desarrollo Local

Esta guía describe cómo levantar el sistema en una máquina local (típicamente Windows/macOS) sin usar Docker.

## 1. Guía de Base de Datos Local

**Requisitos**: PostgreSQL instalado localmente.
- **Base de Datos**: `db_parking`
- **Usuario**: `postgres`
- **Contraseña**: (Tu contraseña de desarrollo, ej. `a.123456`)
- **Puerto**: `5433` (Ajustable)

> **Cadena de Conexión (DATABASE_URL)**: 
> `postgresql://postgres:a.123456@localhost:5433/db_parking`

**Validar Conexión**: Puedes utilizar DBeaver, pgAdmin o consola `psql -U postgres -p 5433 -d db_parking`. 
Si usas Alembic, aplica migraciones con `alembic upgrade head` desde el directorio `backend`. (Para recrear la data, usa los scripts seed si existen).

## 2. Guía para Levantar el Backend (FastAPI)

1. Abre tu terminal y dirígete al directorio `backend/`:
   ```bash
   cd backend
   ```
2. Crea tu entorno virtual y actívalo:
   ```bash
   python -m venv .venv
   # En Windows:
   .venv\Scripts\activate
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura tus variables. Crea un archivo `.env` en la raíz de `backend/` con:
   ```env
   DATABASE_URL=postgresql://postgres:a.123456@localhost:5433/db_parking
   SECRET_KEY=PARKING_SECRET_KEY_DEV_2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
   ```
5. Ejecuta el servidor usando Uvicorn:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
6. **URL Swagger (Documentación de API)**: `http://localhost:8000/docs`

## 3. Guía para Levantar el Frontend (Vite)

> **IMPORTANTE:** Usa la carpeta `parking-ui/`. **No uses la carpeta `frontend/`**.

1. Abre una nueva terminal y dirígete al frontend:
   ```bash
   cd parking-ui
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
4. **URL de la App**: `http://localhost:5173`

### Nota sobre el Vite Proxy
El archivo `parking-ui/vite.config.js` contiene un bloque `proxy`. Esto significa que todas las peticiones desde React hacia `/api/` serán capturadas por Vite y redireccionadas a tu Uvicorn local (`http://localhost:8000`). Por ende, los archivos `api.js` y `authService.js` mantienen felizmente su base relativa `/api/v1` en local, simulando el comportamiento de Nginx en Producción.
