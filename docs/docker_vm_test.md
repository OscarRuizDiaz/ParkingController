# Testing, Ajustes de Red y Troubleshooting

Si has seguido los pasos de [Despliegue Offline](deployment_offline_vm.md), a continuación encontrarás las validaciones finales de la topología y cómo resolver problemas recurrentes.

## 1. Configuración de PostgreSQL en Windows para la VM

Para que el backend en la VM acceda a la DB en Windows:

1. **Escuchar en todas las IPs:** Abre `postgresql.conf` y configura:
   ```conf
   listen_addresses = '*'
   ```
2. **Autorizar la IP:** Abre `pg_hba.conf` y añade:
   ```conf
   host    all             all             IP_VM_LINUX/32          scram-sha-256
   ```
   *(Asegúrate de reiniciar PostgreSQL en Services.msc tras cambiar estos archivos).*

3. **Abrir el Firewall de Windows (Puerto 5433):**
   ```powershell
   New-NetFirewallRule -DisplayName "PostgreSQL 5433" -Direction Inbound -Protocol TCP -LocalPort 5433 -Action Allow
   ```

4. **Test desde la VM Linux:**
   ```bash
   nc -zv IP_PC_WINDOWS 5433
   ```

## 2. Troubleshooting (Problemas Frecuentes)

| Problema | Solución |
|----------|----------|
| **GitHub rechaza `.tar` > 100 MB** | No comitear archivos `.tar`. Asegúrate de que `*.tar` está en tu `.gitignore`. |
| **Frontend de Docker llama a localhost** | Corre `docker exec -it parking_frontend_vm grep -R "localhost:8000" /usr/share/nginx/html`. Si sale algo, reconstruye asegurándote de usar `/api/v1` relativo en `api.js` y `authService.js`. |
| **Errores de CORS en Producción** | No aplican con Nginx. La SPA y la API comparten la misma IP y puerto (`8089`). Si hay CORS, tu Nginx proxy falló, valida el archivo `nginx.conf`. |
| **Vite local devuelve 404 en `/api`** | Valida el archivo `parking-ui/vite.config.js`. Debe existir un bloque `proxy` redirigiendo hacia `target: 'http://localhost:8000'`. |
| **Docker no encuentra la imagen** | Ejecuta `docker images`. Si no existe `parkingcontroller-frontend:test`, corrobora que el `docker load` fue exitoso o compílala. |
| **Pantalla blanca (Boilerplate de Vite)** | Usaste la carpeta equivocada. Compilaste la carpeta `/frontend/`. Reconstruye apuntando el Dockerfile a `/parking-ui/`. |
| **Error Node / npm ci / Rollup en build** | El Dockerfile es antiguo (Node 18). Actualiza el `FROM` de `parking-ui/Dockerfile` a `node:22-alpine`. |

## 3. Validaciones Obligatorias de Éxito
Haz un checklist manual post-despliegue:

- [ ] `http://IP_VM:8000/docs` carga Swagger.
- [ ] `http://IP_VM:8089` abre la interfaz principal.
- [ ] Login ingresa exitosamente (El payload JWT responde).
- [ ] El módulo Caja se abre/cierra correctamente.
- [ ] Cobros procesan el cálculo adecuadamente.
- [ ] El Panel / Dashboard grafica los montos actualizados.
- [ ] Reportes emiten sumatorias de forma funcional.
- [ ] Validar IP estéril en el contenedor:
      `docker exec parking_frontend_vm sh -c 'grep -R "localhost:8000\|192.168." -n /usr/share/nginx/html || true'`
      *(El comando debe retornar vacío).*
