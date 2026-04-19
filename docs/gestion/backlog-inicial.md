# Backlog Inicial & Estado del Proyecto - ParkingController

## ✅ Épica 1 - Base Técnica (Completado)
- [x] Inicializar backend FastAPI.
- [x] Inicializar frontend React.
- [x] Configurar PostgreSQL en desarrollo (Multi-esquema).
- [x] Configurar variables de entorno.
- [x] Crear estructura base del repositorio (Repository/Service Pattern).

## ✅ Épica 2 - Seguridad y Accesos (Completado)
- [x] Login con JWT funcional.
- [x] **RBAC Dinámico puro**: Persistencia en BD y administración vía UI.
- [x] Catálogo maestro de permisos.
- [x] Matriz de edición de permisos por rol.
- [x] Backend como Única Fuente de Verdad para permisos.

## ✅ Épica 3 - Tickets y Liquidación (Completado)
- [x] Consulta de ticket por código.
- [x] Validación de estados (Pendiente, Liquidado, etc).
- [x] Motor tarifario dinámico (Cálculo de minutos y montos).

## ✅ Épica 4 - Clientes (Completado)
- [x] Búsqueda por CI/RUC.
- [x] Alta rápida de clientes desde el flujo de cobro.

## ✅ Épica 5 - Caja y Turnos (Completado)
- [x] Apertura y cierre de turnos/cajas.
- [x] Registro de cobro vinculado al turno activo.
- [x] Control de arqueo y saldos.

## 🚧 Épica 6 - Facturación (En Progreso)
- [x] Generación de factura local.
- [x] Cálculo de IVA automático.
- [ ] Integración con SIFEN (Próxima fase).

## 📊 Épica 7 - Reportes y Supervisión (En Progreso)
- [x] Reporte diario de cobros simple.
- [ ] Dashboard gerencial avanzado.
- [x] Pantalla de supervisión de cajas.

## 🚀 Épica 8 - Preparación Futuray Roadmap
- [ ] Integración SIFEN (Facturación Electrónica Paraguay).
- [ ] Multi-sucursal.
- [ ] Terminales de Autopago.
- [ ] Reconocimiento de Matrículas (LPR).