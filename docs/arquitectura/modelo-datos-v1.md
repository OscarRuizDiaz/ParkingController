# Modelo de Datos Inicial v1 - ParkingController

## 1. Objetivo

Definir la estructura inicial de base de datos para soportar el MVP del sistema de caja y facturación de salida de estacionamiento.

## 2. Principios de diseño

1. Separar ticket, liquidación, cobro y factura.
2. Mantener reglas tarifarias parametrizables.
3. Permitir trazabilidad completa de la operación.
4. Diseñar la base para futura integración con facturación electrónica.
5. Evitar acoplar lógica tributaria rígida en estructuras no escalables.

## 3. Esquemas propuestos

- seguridad
- parking
- ventas
- maestros
- facturacion
- audit

## 4. Entidades principales

### 4.1 seguridad.roles
Define los roles del sistema.

Campos:
- id_rol
- nombre
- descripcion
- activo
- creado_en

### 4.2 seguridad.usuarios
Usuarios del sistema.

Campos:
- id_usuario
- username
- password_hash
- nombre_completo
- email
- id_rol
- activo
- ultimo_acceso
- creado_en

### 4.3 maestros.clientes
Clientes para facturación.

Campos:
- id_cliente
- tipo_documento
- numero_documento
- nombre_razon_social
- direccion
- telefono
- email
- tipo_contribuyente
- activo
- creado_en
- actualizado_en

Observación:
Debe permitir CI o RUC y evitar duplicidad por documento.

### 4.4 parking.tickets
Representa el ticket recibido desde el sistema externo o ingresado manualmente.

Campos:
- id_ticket
- codigo_ticket
- proveedor_origen
- fecha_hora_ingreso
- fecha_hora_salida
- minutos_calculados
- estado
- referencia_externa
- observacion
- creado_en
- actualizado_en

Estados sugeridos:
- PENDIENTE
- LIQUIDADO
- COBRADO
- FACTURADO
- ANULADO
- INVALIDO

### 4.5 parking.tarifas
Configuración de tarifa activa.

Campos:
- id_tarifa
- nombre
- modo_calculo
- valor_base
- fraccion_minutos
- redondea_hacia_arriba
- tolerancia_minutos
- vigencia_desde
- vigencia_hasta
- activo
- configuracion_json
- creado_en

Observación:
Debe soportar evolución futura del motor tarifario.

### 4.6 parking.liquidaciones
Resultado del cálculo aplicado a un ticket.

Campos:
- id_liquidacion
- id_ticket
- id_tarifa
- minutos
- bloques
- monto_bruto
- detalle_calculo_json
- estado
- creado_por
- creado_en

Estados sugeridos:
- CALCULADO
- CONFIRMADO
- REVERTIDO

### 4.7 ventas.cajas
Define cajas operativas.

Campos:
- id_caja
- nombre
- sucursal
- activo
- creado_en

### 4.8 ventas.turnos_caja
Apertura y cierre de caja por usuario.

Campos:
- id_turno
- id_caja
- id_usuario
- fecha_hora_apertura
- fecha_hora_cierre
- monto_inicial
- monto_final
- estado
- creado_en

Estados sugeridos:
- ABIERTO
- CERRADO
- ANULADO

### 4.9 ventas.cobros
Registro del cobro asociado a la liquidación.

Campos:
- id_cobro
- id_liquidacion
- id_turno
- medio_pago
- monto
- referencia_pago
- estado
- cobrado_por
- cobrado_en
- observacion

Estados sugeridos:
- COBRADO
- ANULADO
- REVERSADO

### 4.10 facturacion.facturas
Cabecera de factura.

Campos:
- id_factura
- numero_factura
- timbrado
- fecha_emision
- id_cliente
- id_cobro
- condicion_venta
- moneda
- subtotal
- iva_5
- iva_10
- exento
- total
- estado
- emitido_por
- creado_en

Estados sugeridos:
- EMITIDA
- ANULADA
- PENDIENTE_SIFEN
- ACEPTADA_SIFEN
- RECHAZADA_SIFEN

### 4.11 facturacion.factura_detalles
Detalle de ítems facturados.

Campos:
- id_factura_detalle
- id_factura
- descripcion
- cantidad
- precio_unitario
- porcentaje_iva
- subtotal_linea
- iva_linea
- total_linea

### 4.12 facturacion.eventos_fiscales
Preparación para integración futura con facturación electrónica.

Campos:
- id_evento_fiscal
- id_factura
- tipo_evento
- payload_json
- respuesta_json
- estado
- creado_en

### 4.13 audit.eventos
Bitácora de eventos críticos.

Campos:
- id_evento
- modulo
- entidad
- id_entidad
- accion
- detalle_json
- usuario
- fecha_hora
- ip_origen

## 5. Relaciones principales

- seguridad.usuarios.id_rol -> seguridad.roles.id_rol
- parking.liquidaciones.id_ticket -> parking.tickets.id_ticket
- parking.liquidaciones.id_tarifa -> parking.tarifas.id_tarifa
- ventas.turnos_caja.id_caja -> ventas.cajas.id_caja
- ventas.turnos_caja.id_usuario -> seguridad.usuarios.id_usuario
- ventas.cobros.id_liquidacion -> parking.liquidaciones.id_liquidacion
- ventas.cobros.id_turno -> ventas.turnos_caja.id_turno
- facturacion.facturas.id_cliente -> maestros.clientes.id_cliente
- facturacion.facturas.id_cobro -> ventas.cobros.id_cobro
- facturacion.factura_detalles.id_factura -> facturacion.facturas.id_factura
- facturacion.eventos_fiscales.id_factura -> facturacion.facturas.id_factura

## 6. Restricciones clave

1. Un ticket no debe cobrarse dos veces.
2. Un cobro válido debe estar asociado a una liquidación válida.
3. Una factura válida debe estar asociada a un cobro válido.
4. Un cliente no debe duplicarse por tipo_documento + numero_documento.
5. Solo debe existir un turno abierto por caja y usuario según regla operativa.
6. La tarifa activa debe poder consultarse por vigencia.

## 7. Índices recomendados

- parking.tickets(codigo_ticket)
- maestros.clientes(tipo_documento, numero_documento)
- parking.tickets(estado)
- parking.liquidaciones(id_ticket)
- ventas.cobros(id_liquidacion)
- facturacion.facturas(id_cobro)
- facturacion.facturas(fecha_emision)
- audit.eventos(fecha_hora)

## 8. Preparación futura

La estructura queda preparada para:
- múltiples sucursales,
- múltiples cajas,
- integración con sistema externo de tickets,
- múltiples fórmulas tarifarias,
- facturación electrónica SIFEN,
- anulación y eventos fiscales,
- módulo futuro de ingreso de vehículos.