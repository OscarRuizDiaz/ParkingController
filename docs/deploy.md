# Guía de Despliegue - ParkingController

Este documento describe los pasos necesarios para levantar el sistema ParkingController en un entorno local o de desarrollo.

## Requisitos Previos
- **Python**: 3.10 o superior.
- **Node.js**: 18 o superior.
- **PostgreSQL**: 14 o superior (instalado local o vía Docker).

---

## 1. Configuración de Base de Datos

1. Crear una base de datos llamada `db_parking`.
2. Crear un esquema llamado `parking`.
3. El sistema utiliza SQLAlchemy para la creación automática de tablas, pero se recomienda correr los scripts de inicialización si existen en `/database`.

**Nota**: El puerto por defecto configurado para desarrollo es `5433`.

---

## 2. Backend (FastAPI)

1. Navegar a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crear un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\\Scripts\\activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar el archivo `.env` en `/backend`:
   ```env
   DATABASE_URL=postgresql://usuario:password@localhost:5433/db_parking
   ALGORITHM=HS256
   SECRET_KEY=clave_secreta_desarrollo
   ```
5. Ejecutar el servidor:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 3. Frontend (React + Vite)

1. Navegar a la carpeta del frontend:
   ```bash
   cd parking-ui
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar el modo desarrollo:
   ```bash
   npm run dev
   ```
4. La aplicación estará disponible en `http://localhost:5173`.

---

## 4. Troubleshooting del Despliegue

- **Puerto PostgreSQL**: Si tu base de datos corre en el puerto estándar `5432`, asegúrate de actualizar el `DATABASE_URL` en el archivo `.env`.
- **CORS**: El backend está configurado para aceptar peticiones de `http://localhost:5173`. Si el frontend corre en otro puerto, actualiza `main.py`.
- **Encoding de Terminal**: En Windows, algunos scripts de migración pueden fallar con emojis. Usa los scripts corregidos sin caracteres Unicode si es necesario.
