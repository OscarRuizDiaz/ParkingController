# Guía de Despliegue con Docker

Este proyecto está configurado para ejecutarse mediante `docker-compose`. Las imágenes encapsulan el backend (FastAPI) y el frontend (React + Vite + Nginx).

## 1. Prerrequisitos
- Docker
- Docker Compose

## 2. Configuración Inicial
Copia el archivo `.env.example` y renómbralo a `.env`:
```bash
cp .env.example .env
```
Ajusta las variables de entorno según sea necesario (especialmente contraseñas de base de datos o URLs).

## 3. Comandos Principales

### Levantar en entorno local (Background / Detached)
Construye las imágenes e inicia los contenedores en segundo plano:
```bash
docker compose up -d --build
```

### Ver Logs
Para ver los logs en tiempo real de un servicio específico:
```bash
# Logs del backend
docker compose logs -f backend

# Logs del frontend
docker compose logs -f frontend
```

### Detener los servicios
Para detener todos los contenedores levantados por docker-compose:
```bash
docker compose down
```

### Reconstruir (Sin usar caché)
Si se hicieron cambios profundos y quieres obligar a Docker a construir sin caché:
```bash
docker compose build --no-cache
```

## 4. Migraciones y Seed
Si necesitas correr migraciones usando Alembic dentro del contenedor del backend (una vez levantado):
```bash
docker compose exec backend alembic upgrade head
```

Para poblar la base de datos (Seed) usando un script (asegúrate de que el script exista en tu backend):
```bash
docker compose exec backend python scripts/seed.py
```

## 5. Empaquetado para Producción (Registro de Imágenes)

Si necesitas exportar las imágenes a un registro externo:

### Crear Tag (Build Local)
Construye las imágenes definiendo explícitamente sus tags:
```bash
docker build -t parkingcontroller-backend:1.0.0 ./backend
docker build -t parkingcontroller-frontend:1.0.0 ./parking-ui
```

### Etiquetar para Registry
Agrega las etiquetas con la URL de tu repositorio/registry local:
```bash
docker tag parkingcontroller-backend:1.0.0 registry.local/parkingcontroller-backend:1.0.0
docker tag parkingcontroller-frontend:1.0.0 registry.local/parkingcontroller-frontend:1.0.0
```

### Hacer Push al Registry
Sube las imágenes a tu registry:
```bash
docker push registry.local/parkingcontroller-backend:1.0.0
docker push registry.local/parkingcontroller-frontend:1.0.0
```
