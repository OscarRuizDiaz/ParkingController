# Guía de Despliegue en VM Linux (Reverse Proxy)

Este documento detalla los comandos para construir y desplegar el proyecto ParkingController en una VM Linux sin hardcodear IPs, usando un Reverse Proxy con Nginx.

## 1. Construir las Imágenes en Windows

Ejecuta estos comandos en la raíz de tu proyecto en Windows:

```powershell
# Build del Backend
docker build --no-cache -t parkingcontroller-backend:test -f .\backend\Dockerfile .\backend

# Build del Frontend
# Ya no es necesario pasar IP_VM_LINUX gracias al reverse proxy
docker build --no-cache -t parkingcontroller-frontend:test -f .\parking-ui\Dockerfile .\parking-ui
```

## 2. Exportar las Imágenes (.tar)

Guarda las imágenes para transferencia:

```powershell
docker save -o parkingcontroller-backend-test.tar parkingcontroller-backend:test
docker save -o parkingcontroller-frontend-test.tar parkingcontroller-frontend:test
```

## 3. Transferir a la VM Linux (WinSCP)

Transfiere los siguientes archivos a tu máquina virtual:
- `parkingcontroller-backend-test.tar`
- `parkingcontroller-frontend-test.tar`
- `docker-compose.yml`
- `.env.example` (Renómbralo a `.env` y ajusta `IP_PC_WINDOWS` con la IP real de tu PC Windows)

## 4. Levantar en VM Linux

Ingresa por SSH a tu VM y en la carpeta donde subiste los archivos, ejecuta:

```bash
# Bajar contenedores previos si existen
docker compose down

# Cargar las imágenes
docker load -i parkingcontroller-backend-test.tar
docker load -i parkingcontroller-frontend-test.tar

# Levantar los servicios (recargando configuración)
docker compose up -d --force-recreate
```

## 5. Ajustes de PostgreSQL en Windows

Para que el backend alcance la base de datos de Windows, asegúrate de:

1. **postgresql.conf**: `listen_addresses = '*'`
2. **pg_hba.conf**: Añadir `host all all IP_VM_LINUX/32 scram-sha-256`
3. **Firewall de Windows**: 
   ```powershell
   New-NetFirewallRule -DisplayName "PostgreSQL 5433" -Direction Inbound -Protocol TCP -LocalPort 5433 -Action Allow
   ```

## 6. Validaciones Finales en la VM

Abre tu navegador y entra a `http://IP_VM:8089`. En la consola de red deberías ver llamadas a `http://IP_VM:8089/api/v1/...`.

Opcionalmente, valida dentro del contenedor frontend que no hay IPs hardcodeadas:
```bash
docker exec parking_frontend_vm grep -R "localhost:8000" -n /usr/share/nginx/html || true
docker exec parking_frontend_vm grep -R "192.168." -n /usr/share/nginx/html || true
```
Ambos comandos no deben devolver ningún resultado.
