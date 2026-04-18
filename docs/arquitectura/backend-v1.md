# Backend v1 - ParkingController

## 1. Objetivo

Definir la estructura técnica del backend para soportar el MVP del sistema de caja y facturación de salida de estacionamiento.

## 2. Stack

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT para autenticación

## 3. Módulos

- auth
- tickets
- tarifas
- clientes
- cajas
- cobros
- facturas
- auditoria

## 4. Estructura del proyecto

```text
app/
  api/
    v1/
      endpoints/
  core/
  models/
  schemas/
  services/
  repositories/
  db/
  main.py