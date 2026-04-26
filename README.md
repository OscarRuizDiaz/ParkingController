# ParkingController

ParkingController es un sistema integral para el control de estacionamientos y caja, con seguridad basada en roles (RBAC) dinámico, turnos, reportes y dashboards en tiempo real.

## 🏗 Estado del Proyecto

El proyecto se encuentra en estado estable, operando con un stack tecnológico sólido:
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL.
- **Frontend Real**: React, Vite (Ubicado en la carpeta `parking-ui/`).
- **Autenticación**: JWT con flujo Role-Based Access Control dinámico.
- **Despliegue**: Dockerizado con Nginx como Reverse Proxy (Offline VM Deployment ready).

**¡Aviso Importante sobre la Estructura!**
- El código **real** del frontend, incluyendo el Dashboard y lógica de negocio, se encuentra en `parking-ui/`.
- La carpeta `frontend/` es un proyecto vacío/huérfano y **NO** debe usarse para despliegues.

## 🚀 Resumen Ejecutivo

### 💻 Cómo correr local (Desarrollo)
1. **Base de Datos**: PostgreSQL en `localhost:5433` (`db_parking`).
2. **Backend**: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
3. **Frontend**: `cd parking-ui && npm install && npm run dev`. La app servirá en `http://localhost:5173`.
*Para detalles exhaustivos, consulta [Desarrollo Local](docs/local_development.md).*

### 🐳 Cómo correr en Docker / VM
1. Construye el backend (`.\backend`) y el frontend (`.\parking-ui`).
2. Exporta ambas imágenes usando `docker save`.
3. Carga en tu VM Linux (`docker load`) y despliega usando `docker-compose up -d`. Nginx actuará como proxy para evitar problemas de CORS y ruteo.
*Para detalles exhaustivos, consulta [Despliegue Offline en VM](docs/deployment_offline_vm.md).*

## 📚 Documentación Técnica

Todo el detalle paso a paso para desplegar, entender o desarrollar el sistema ha sido fragmentado en documentos especializados:
1. [Arquitectura General](docs/architecture_overview.md)
2. [Desarrollo Local](docs/local_development.md)
3. [Guía de Pruebas Docker en VM](docs/docker_vm_test.md)
4. [Despliegue Definitivo Offline](docs/deployment_offline_vm.md)

## 🔒 Notas de Seguridad Básica
- Nunca commitear archivos `.env` a control de versiones.
- Las contraseñas en bases de datos locales (`a.123456`) son estrictamente para pruebas. Deben cambiarse en producción.
- El sistema RBAC maneja de forma asilada permisos; el frontend NUNCA debe hardcodear reglas de negocio para ocultar elementos, todo depende de los payloads JWT del backend.