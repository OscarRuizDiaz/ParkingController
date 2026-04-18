# Project Roadmap - ParkingController

Este documento describe la visión a futuro del sistema y las funcionalidades planeadas para las siguientes etapas de desarrollo.

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
- **Dashboard Gerencial**: Visualización de ingresos, picos de ocupación y performance de cajas en tiempo real.
- **Multi-sucursal**: Gestión de múltiples establecimientos desde una única base de datos centralizada.
- **Aplicación Móvil para Clientes**: Permitir que el cliente escanee su ticket y pague desde su teléfono vía medios electrónicos (Bancard, PagoPar, etc).

## Mejoras Técnicas Pendientes
- **Seguridad**: Implementar autenticación JWT real para el acceso a la administración.
- **Contenedores**: Dockerización completa del entorno para despliegues rápidos en la nube.
- **Tests**: Ampliar la cobertura de tests unitarios y de integración para el motor tarifario.
