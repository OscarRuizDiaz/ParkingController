# Project Roadmap - ParkingController

Este documento describe la visión a futuro del sistema y las funcionalidades planeadas para las siguientes etapas de desarrollo, tras completar la base del sistema POS y el RBAC dinámico.

## ✅ Hitos Completados
- [x] Motor tarifario dinámico con soporte de múltiples reglas.
- [x] Gestión de Turnos y Arqueos de Caja.
- [x] **Seguridad y Accesos**: Implementación de JWT y **RBAC Dinámico puro** con panel administrativo.
- [x] Arquitectura de Backend como Fuente de Verdad para Autorización.

## Fase 2: Facturación Electrónica (SIFEN)
El objetivo principal es integrar el sistema con la SET (Paraguay) para la emisión de facturas fiscales electrónicas.
- **Implementación de Ekuatia**: Integración con las APIs de SIFEN.
- **Generación de XML**: Automatización de la firma digital de comprobantes.
- **Código QR y CDC**: Impresión automática del Código de Control en los recibos.

## Fase 3: Automatización de Accesos
Mejorar la eficiencia de entrada y salida de vehículos.
- **Integración con Cámaras LPR**: Reconocimiento automático de matrículas al ingresar.
- **Barreras Inteligentes**: Apertura automática al detectar tickets en estado `FACTURADO`.
- **Terminales de Autopago**: Pequeñas estaciones para que el cliente pague sin intervención humana.

## Fase 4: Expansión y Reportes Avanzados
Capacidades de gestión para grandes parkings o múltiples sucursales.
- **Dashboard Gerencial**: Visualización de ingresos, picos de ocupación y performance de cajas en tiempo real (Power BI / Grafana).
- **Multi-sucursal**: Gestión de múltiples establecimientos desde una única interfaz centralizada.
- **Aplicación Móvil para Clientes**: Permitir que el cliente escanee su ticket y pague desde su teléfono vía medios electrónicos (Bancard, PagoPar, etc).

## Mejoras Técnicas Pendientes
- **Contenedores**: Dockerización completa para despliegues rápidos y orquestación con Kubernetes/Compose.
- **Tests**: Ampliar la cobertura de tests unitarios (Pytest) para el motor tarifario y la lógica de permisos.
- **Auditoría de Acciones**: Registro de cambios (User logs) para todas las modificaciones hechas en el panel RBAC.
