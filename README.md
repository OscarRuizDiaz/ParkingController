# ParkingController 🚗💨

![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**ParkingController** es una solución integral para el control de accesos, gestión de caja y facturación de estacionamientos comerciales. Diseñado con un motor tarifario altamente flexible y precisión financiera garantizada.

---

## 🏗️ Arquitectura y Stack

El sistema sigue una arquitectura desacoplada y escalable:

- **Backend**: Python 3.10+ con **FastAPI** (API REST de alto rendimiento).
- **ORM**: SQLAlchemy 2.0 con patrones de Repositorio.
- **Frontend**: **React** con Vite, Styled Components (Vanilla CSS) y animaciones fluidas (Framer Motion).
- **Base de Datos**: **PostgreSQL** con tipado fuerte para transacciones financieras.

---

## 🚀 Funcionalidades Clave

- **📍 Gestión de Tickets**: Ciclo de vida completo desde el ingreso hasta la salida.
- **🧮 Motor Tarifario Inteligente**: Soporte para múltiples modos de cálculo configurables en vivo.
- **❄️ Congelamiento Histórico**: Las liquidaciones se congelan al momento del cobro para garantizar integridad.
- **🧾 Facturación Integrada**: Módulo de alta rápida de clientes y emisión de comprobantes.
- **📊 Administración**: Interfaz moderna para gestionar reglas de negocio y tarifas.

---

## 📁 Estructura del Proyecto

```text
ParkingController/
├── backend/            # API FastAPI, Modelos y Lógica de Negocio
├── parking-ui/         # Interfaz de Usuario en React
├── database/           # Scripts SQL e inicialización de esquemas
├── docs/               # Documentación técnica completa (Arquitectura, API, etc.)
└── README.md           # Guía rápida de inicio
```

---

## 🛠️ Instalación Rápida

Para instrucciones detalladas de despliegue, variables de entorno y configuración de base de datos, consulte la **[Guía de Despliegue](docs/deploy.md)**.

### Backend
```bash
cd backend
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd parking-ui
npm install
npm run dev
```

---

## 📚 Documentación Técnica

Contamos con una suite completa de documentos para desarrolladores y administradores:

1.  **[Arquitectura Lógica](docs/arquitectura.md)**: Capas y flujo de datos.
2.  **[Motor Tarifario](docs/tarifador.md)**: El corazón del cálculo monetario.
3.  **[API Reference](docs/api.md)**: Catálogo de endpoints y ejemplos JSON.
4.  **[Reglas de Negocio](docs/reglas_negocio.md)**: Políticas de congelamiento y validaciones.
5.  **[Base de Datos](docs/database.md)**: Diagrama de tablas y estados del ticket.
6.  **[Buenas Prácticas](docs/buenas_practicas.md)**: Estándares de desarrollo aplicados.
7.  **[Troubleshooting](docs/troubleshooting.md)**: Solución a problemas comunes resueltos.
8.  **[Roadmap](docs/roadmap.md)**: Futuras funcionalidades (SIFEN, LPR).

---

## 👨‍💻 Contribuir

1. Clonar el repositorio.
2. Crear una rama para tu funcionalidad (`git checkout -b feature/nueva-fun`).
3. Realizar commits bajo estándares convencionales.
4. Enviar un Pull Request.

---

Desarrollado con ❤️ para el control eficiente de espacios.