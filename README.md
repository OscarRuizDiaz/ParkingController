# ParkingController 🚗💨

![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**ParkingController** es una solución integral para el control de accesos, gestión de caja y comercialización de estacionamientos. El sistema destaca por su **RBAC Dinámico puro**, donde todos los permisos se gestionan desde el backend, permitiendo una administración granular de acceso a módulos y operaciones en tiempo real.

---

## 🏗️ Arquitectura y Stack

El sistema sigue una arquitectura moderna, desacoplada y orientada a la seguridad:

- **Backend**: Python 3.10+ con **FastAPI**. Implementa el patrón Repositorio y Servicio.
- **Seguridad**: Autenticación JWT y **RBAC Dinámico** (Role-Based Access Control).
- **Frontend**: **React** con Vite, Styled Components y diseño premium enfocado en UX administrativa.
- **Base de Datos**: **PostgreSQL** con esquemas de base de datos separados (`parking`, `seguridad`).

---

## 🚀 Módulos Implementados

### 💼 Operación de Caja
- **Apertura/Cierre de Turnos**: Control estricto de saldos y arqueos de caja.
- **Cobro de Tickets**: Integración con el motor tarifario para liquidaciones precisas.
- **Resumen Diario**: Reportes de ventas y movimientos de caja por turno.

### 🧮 Motor Tarifario & Tickets
- **Ciclo de Vida del Ticket**: Estados (Pendiente, Liquidado, Cobrado, Facturado).
- **Tarifación Flexible**: Modos de cálculo configurables en vivo (Bloque fijo, fraccionado, etc.).
- **Facturación Fiscal**: Emisión de comprobantes asociados a cobros registrados.

### 🔐 Seguridad & RBAC (Administración)
- **Gestión de Roles**: Creación y edición de roles (ADMINISTRADOR, SUPERVISOR, CAJERO).
- **Matriz de Permisos**: Edición granular de acceso por módulo desde el panel administrativo.
- **Backend-Driven Security**: El frontend se adapta dinámicamente a la lista de `permissions` devuelta por la API tras el login.

---

## 📁 Estructura del Proyecto

```text
ParkingController/
├── backend/            # API FastAPI, Modelos, Servicios y Scripts
│   ├── app/            # Código fuente principal
│   │   ├── api/        # Endpoints y Dependencias (Auth/AuthZ)
│   │   ├── models/     # Entidades SQLAlchemy (Esquemas: parking, seguridad)
│   │   ├── services/   # Lógica de negocio (RBAC, Tarifas)
│   │   └── schemas/    # Pydantic models (Validación)
│   └── scripts/        # Herramientas de mantenimiento y migración
├── parking-ui/         # Interfaz de Usuario en React/Vite
│   ├── src/
│   │   ├── auth/       # Hooks de acceso y PermissionGate
│   │   ├── pages/      # Paneles funcionales y administrativos
│   │   └── services/   # Clientes de API (axios/fetch)
├── database/           # Scripts SQL y definiciones de esquemas
└── docs/               # Documentación técnica extendida
```

---

## 🛠️ Instalación y Preparación

### 1. Requisitos
- Python 3.10+ y Node.js 18+.
- PostgreSQL 14+.

### 2. Base de Datos & RBAC
Para preparar la infraestructura de seguridad inicial, ejecute:

```bash
# Crear base de datos y esquemas
psql -U postgres -f database/fix_rbac_tables.sql

# Poblar catálogo maestro y roles iniciales
cd backend
python app/rbac_seed.py
```

### 3. Ejecución Local
**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd parking-ui
npm install
npm run dev
```

---

## 📚 Documentación Técnica Detallada

1.  **[RBAC dinámico](docs/rbac.md)**: Funcionamiento interno del sistema de permisos.
2.  **[Arquitectura Lógica](docs/arquitectura.md)**: Capas y flujo de datos.
3.  **[API Reference](docs/api.md)**: Endpoints actuales (Incluye RBAC Admin).
4.  **[Esquema de Base de Datos](docs/database.md)**: Tablas y relaciones.

---

## 👨‍💻 Roadmap Actual
- [x] Implementación de RBAC Dinámico.
- [x] Front-end Administrativo de Seguridad.
- [ ] Integración SIFEN (Facturación Electrónica).
- [ ] Reconocimiento Automático de Matrículas (LPR).

---

Desarrollado para el control eficiente y seguro de espacios comerciales. 🚗💨