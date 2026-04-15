# ParkingController

Sistema web de caja y facturación para salida de estacionamiento.

## Descripción

ParkingController es un sistema orientado al control de cobro y facturación de estacionamiento al momento de la salida del cliente.

El sistema no registra el ingreso del vehículo ni genera el ticket de entrada en esta primera etapa, ya que esa función depende de un tercero. Sin embargo, quedará preparado para soportar esa funcionalidad en el futuro si fuera necesario.

## Objetivo del MVP

Permitir que un cajero:

- ingrese o consulte un ticket emitido por un tercero,
- calcule el monto a cobrar según una regla tarifaria,
- busque o registre al cliente por CI o RUC,
- realice el cobro en caja,
- emita una factura,
- aplique IVA según corresponda,
- y deje trazabilidad de la operación.

## Alcance inicial

Incluye:

- cálculo del monto por tiempo de estacionamiento,
- cobro en caja,
- emisión de factura,
- búsqueda de cliente por CI o RUC,
- parametrización básica de IVA,
- preparación para futura integración con SIFEN.

No incluye en esta etapa:

- registro de entrada de vehículos,
- generación de ticket de ingreso,
- integración activa con SIFEN,
- integración activa con sistema externo del emisor del ticket.

## Regla tarifaria inicial

Ejemplo base:

- 1 a 60 minutos = 40.000
- 61 a 120 minutos = 80.000
- 40 minutos = 40.000

La lógica inicial será por bloques de tiempo redondeados hacia arriba.

## Stack previsto

- Backend: Python + FastAPI
- Frontend: React
- Base de datos: PostgreSQL

## Documentación

- Requisitos funcionales: `docs/funcional/requisitos-mvp.md`
- Arquitectura inicial: `docs/arquitectura/arquitectura-v1.md`
- Backlog base: `docs/gestion/backlog-inicial.md`
- Seguridad inicial: `docs/seguridad/lineamientos-iniciales.md`

## Estado del proyecto

Fase de definición y preparación de MVP.