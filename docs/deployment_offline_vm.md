# Guía de Despliegue Offline en VM Linux

Este documento estandariza la subida a producción en una máquina aislada (sin acceso a internet) trasladando imágenes `.tar`.

## 1. Exportación en Origen (Windows)
Abre tu consola PowerShell en la raíz del proyecto.
*(Asegúrate de tener Docker Desktop corriendo)*

**A. Compilar Backend:**
```powershell
docker build --no-cache -t parkingcontroller-backend:test -f .\backend\Dockerfile .\backend
```
**B. Compilar Frontend (Usar `parking-ui`):**
```powershell
docker build --no-cache -t parkingcontroller-frontend:test -f .\parking-ui\Dockerfile .\parking-ui
```
**C. Exportar Imágenes a `.tar`:**
```powershell
docker save -o parkingcontroller-backend-test.tar parkingcontroller-backend:test
docker save -o parkingcontroller-frontend-test.tar parkingcontroller-frontend:test
```

## 2. Transferencia (WinSCP)
Copia a tu VM de destino:
- `parkingcontroller-backend-test.tar`
- `parkingcontroller-frontend-test.tar`
- `docker-compose.yml`
- `.env`

## 3. Ingestión y Despliegue (Linux VM)
En la terminal de la VM:
```bash
# Apagar contenedores actuales si existen
docker compose down

# Cargar imágenes exportadas
docker load -i parkingcontroller-backend-test.tar
docker load -i parkingcontroller-frontend-test.tar

# Levantar entorno forzando la recreación de los contenedores
docker compose up -d --force-recreate
```

## 4. Visualizar Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 5. El Docker Compose
Explicación técnica de la topología en `docker-compose.yml`:
- **Servicio `backend`**: Uvicorn corriendo nativo por el puerto interno `8000`. Conectado a la BD externa.
- **Servicio `frontend`**: Nginx Alpine escuchando en el puerto host `8089`. Se accede como `http://IP_VM:8089`. 
- **Integración**: Cuando el Frontend hace una petición a `/api/`, el Nginx de este contenedor se conecta al servicio `backend:8000/api/` gracias a la red compartida de Docker Compose.
