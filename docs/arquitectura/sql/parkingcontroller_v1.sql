-- =========================================================
-- ParkingController - Modelo de Datos Inicial v1
-- Base: PostgreSQL
-- Entorno: Desarrollo
-- =========================================================

-- Recomendación:
-- Ejecutar conectado a la base db_parking

-- =========================================================
-- 1. ESQUEMAS
-- =========================================================
CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS maestros;
CREATE SCHEMA IF NOT EXISTS parking;
CREATE SCHEMA IF NOT EXISTS ventas;
CREATE SCHEMA IF NOT EXISTS facturacion;
CREATE SCHEMA IF NOT EXISTS audit;

-- =========================================================
-- 2. TABLAS DE SEGURIDAD
-- =========================================================
CREATE TABLE IF NOT EXISTS seguridad.roles (
    id_rol              BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    descripcion         VARCHAR(255),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seguridad.usuarios (
    id_usuario          BIGSERIAL PRIMARY KEY,
    username            VARCHAR(50) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    nombre_completo     VARCHAR(150) NOT NULL,
    email               VARCHAR(150),
    id_rol              BIGINT NOT NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso       TIMESTAMP,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (id_rol)
        REFERENCES seguridad.roles(id_rol)
);

-- =========================================================
-- 3. MAESTROS
-- =========================================================
CREATE TABLE IF NOT EXISTS maestros.clientes (
    id_cliente              BIGSERIAL PRIMARY KEY,
    tipo_documento          VARCHAR(20) NOT NULL,
    numero_documento        VARCHAR(30) NOT NULL,
    nombre_razon_social     VARCHAR(200) NOT NULL,
    direccion               VARCHAR(255),
    telefono                VARCHAR(50),
    email                   VARCHAR(150),
    tipo_contribuyente      VARCHAR(30),
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP,
    CONSTRAINT uq_clientes_documento UNIQUE (tipo_documento, numero_documento)
);

-- =========================================================
-- 4. PARKING
-- =========================================================
CREATE TABLE IF NOT EXISTS parking.tickets (
    id_ticket               BIGSERIAL PRIMARY KEY,
    codigo_ticket           VARCHAR(100) NOT NULL UNIQUE,
    proveedor_origen        VARCHAR(100),
    fecha_hora_ingreso      TIMESTAMP NOT NULL,
    fecha_hora_salida       TIMESTAMP,
    minutos_calculados      INTEGER,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    referencia_externa      VARCHAR(150),
    observacion             TEXT,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP,
    CONSTRAINT chk_ticket_estado
        CHECK (estado IN ('PENDIENTE', 'LIQUIDADO', 'COBRADO', 'FACTURADO', 'ANULADO', 'INVALIDO'))
);

CREATE TABLE IF NOT EXISTS parking.tarifas (
    id_tarifa               BIGSERIAL PRIMARY KEY,
    nombre                  VARCHAR(100) NOT NULL,
    modo_calculo            VARCHAR(30) NOT NULL,
    valor_base              NUMERIC(14,2) NOT NULL DEFAULT 0,
    fraccion_minutos        INTEGER NOT NULL DEFAULT 60,
    redondea_hacia_arriba   BOOLEAN NOT NULL DEFAULT TRUE,
    tolerancia_minutos      INTEGER NOT NULL DEFAULT 0,
    vigencia_desde          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vigencia_hasta          TIMESTAMP,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    configuracion_json      JSONB,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tarifa_modo
        CHECK (modo_calculo IN ('BLOQUE_FIJO', 'PROPORCIONAL', 'TRAMOS', 'FRACCION'))
);

CREATE TABLE IF NOT EXISTS parking.liquidaciones (
    id_liquidacion          BIGSERIAL PRIMARY KEY,
    id_ticket               BIGINT NOT NULL,
    id_tarifa               BIGINT NOT NULL,
    minutos                 INTEGER NOT NULL,
    bloques                 INTEGER NOT NULL DEFAULT 1,
    monto_bruto             NUMERIC(14,2) NOT NULL,
    detalle_calculo_json    JSONB,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'CALCULADO',
    creado_por              BIGINT,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_liq_ticket
        FOREIGN KEY (id_ticket)
        REFERENCES parking.tickets(id_ticket),
    CONSTRAINT fk_liq_tarifa
        FOREIGN KEY (id_tarifa)
        REFERENCES parking.tarifas(id_tarifa),
    CONSTRAINT fk_liq_usuario
        FOREIGN KEY (creado_por)
        REFERENCES seguridad.usuarios(id_usuario),
    CONSTRAINT chk_liq_estado
        CHECK (estado IN ('CALCULADO', 'CONFIRMADO', 'REVERTIDO'))
);

-- =========================================================
-- 5. VENTAS
-- =========================================================
CREATE TABLE IF NOT EXISTS ventas.cajas (
    id_caja                 BIGSERIAL PRIMARY KEY,
    nombre                  VARCHAR(100) NOT NULL,
    sucursal                VARCHAR(100),
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas.turnos_caja (
    id_turno                BIGSERIAL PRIMARY KEY,
    id_caja                 BIGINT NOT NULL,
    id_usuario              BIGINT NOT NULL,
    fecha_hora_apertura     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_cierre       TIMESTAMP,
    monto_inicial           NUMERIC(14,2) NOT NULL DEFAULT 0,
    monto_final             NUMERIC(14,2),
    estado                  VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_turno_caja
        FOREIGN KEY (id_caja)
        REFERENCES ventas.cajas(id_caja),
    CONSTRAINT fk_turno_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES seguridad.usuarios(id_usuario),
    CONSTRAINT chk_turno_estado
        CHECK (estado IN ('ABIERTO', 'CERRADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS ventas.cobros (
    id_cobro                BIGSERIAL PRIMARY KEY,
    id_liquidacion          BIGINT NOT NULL,
    id_turno                BIGINT NOT NULL,
    medio_pago              VARCHAR(30) NOT NULL,
    monto                   NUMERIC(14,2) NOT NULL,
    referencia_pago         VARCHAR(150),
    estado                  VARCHAR(20) NOT NULL DEFAULT 'COBRADO',
    cobrado_por             BIGINT NOT NULL,
    cobrado_en              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion             TEXT,
    CONSTRAINT fk_cobro_liquidacion
        FOREIGN KEY (id_liquidacion)
        REFERENCES parking.liquidaciones(id_liquidacion),
    CONSTRAINT fk_cobro_turno
        FOREIGN KEY (id_turno)
        REFERENCES ventas.turnos_caja(id_turno),
    CONSTRAINT fk_cobro_usuario
        FOREIGN KEY (cobrado_por)
        REFERENCES seguridad.usuarios(id_usuario),
    CONSTRAINT chk_cobro_estado
        CHECK (estado IN ('COBRADO', 'ANULADO', 'REVERSADO')),
    CONSTRAINT chk_cobro_medio_pago
        CHECK (medio_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA'))
);

-- =========================================================
-- 6. FACTURACION
-- =========================================================
CREATE TABLE IF NOT EXISTS facturacion.facturas (
    id_factura              BIGSERIAL PRIMARY KEY,
    numero_factura          VARCHAR(50) NOT NULL,
    timbrado                VARCHAR(50),
    fecha_emision           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente              BIGINT NOT NULL,
    id_cobro                BIGINT NOT NULL,
    condicion_venta         VARCHAR(30) NOT NULL DEFAULT 'CONTADO',
    moneda                  VARCHAR(10) NOT NULL DEFAULT 'PYG',
    subtotal                NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_5                   NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_10                  NUMERIC(14,2) NOT NULL DEFAULT 0,
    exento                  NUMERIC(14,2) NOT NULL DEFAULT 0,
    total                   NUMERIC(14,2) NOT NULL DEFAULT 0,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'EMITIDA',
    emitido_por             BIGINT NOT NULL,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_factura_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES maestros.clientes(id_cliente),
    CONSTRAINT fk_factura_cobro
        FOREIGN KEY (id_cobro)
        REFERENCES ventas.cobros(id_cobro),
    CONSTRAINT fk_factura_usuario
        FOREIGN KEY (emitido_por)
        REFERENCES seguridad.usuarios(id_usuario),
    CONSTRAINT uq_factura_numero UNIQUE (numero_factura),
    CONSTRAINT chk_factura_estado
        CHECK (estado IN ('EMITIDA', 'ANULADA', 'PENDIENTE_SIFEN', 'ACEPTADA_SIFEN', 'RECHAZADA_SIFEN'))
);

CREATE TABLE IF NOT EXISTS facturacion.factura_detalles (
    id_factura_detalle      BIGSERIAL PRIMARY KEY,
    id_factura              BIGINT NOT NULL,
    descripcion             VARCHAR(255) NOT NULL,
    cantidad                NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario         NUMERIC(14,2) NOT NULL,
    porcentaje_iva          NUMERIC(5,2) NOT NULL DEFAULT 10,
    subtotal_linea          NUMERIC(14,2) NOT NULL,
    iva_linea               NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_linea             NUMERIC(14,2) NOT NULL,
    CONSTRAINT fk_factura_detalle_factura
        FOREIGN KEY (id_factura)
        REFERENCES facturacion.facturas(id_factura)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facturacion.eventos_fiscales (
    id_evento_fiscal        BIGSERIAL PRIMARY KEY,
    id_factura              BIGINT NOT NULL,
    tipo_evento             VARCHAR(50) NOT NULL,
    payload_json            JSONB,
    respuesta_json          JSONB,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evento_fiscal_factura
        FOREIGN KEY (id_factura)
        REFERENCES facturacion.facturas(id_factura)
);

-- =========================================================
-- 7. AUDITORIA
-- =========================================================
CREATE TABLE IF NOT EXISTS audit.eventos (
    id_evento               BIGSERIAL PRIMARY KEY,
    modulo                  VARCHAR(50) NOT NULL,
    entidad                 VARCHAR(50) NOT NULL,
    id_entidad              BIGINT,
    accion                  VARCHAR(50) NOT NULL,
    detalle_json            JSONB,
    usuario                 VARCHAR(100),
    fecha_hora              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen               VARCHAR(50)
);

-- =========================================================
-- 8. INDICES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_tickets_codigo
    ON parking.tickets(codigo_ticket);

CREATE INDEX IF NOT EXISTS idx_tickets_estado
    ON parking.tickets(estado);

CREATE INDEX IF NOT EXISTS idx_clientes_documento
    ON maestros.clientes(tipo_documento, numero_documento);

CREATE INDEX IF NOT EXISTS idx_liquidaciones_ticket
    ON parking.liquidaciones(id_ticket);

CREATE INDEX IF NOT EXISTS idx_cobros_liquidacion
    ON ventas.cobros(id_liquidacion);

CREATE INDEX IF NOT EXISTS idx_facturas_cobro
    ON facturacion.facturas(id_cobro);

CREATE INDEX IF NOT EXISTS idx_facturas_fecha
    ON facturacion.facturas(fecha_emision);

CREATE INDEX IF NOT EXISTS idx_audit_fecha
    ON audit.eventos(fecha_hora);

-- =========================================================
-- 9. DATOS INICIALES
-- =========================================================
INSERT INTO seguridad.roles (nombre, descripcion)
VALUES
    ('ADMINISTRADOR', 'Acceso total al sistema'),
    ('CAJERO', 'Operador de caja y facturacion'),
    ('SUPERVISOR', 'Supervision, anulaciones y control')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO parking.tarifas (
    nombre,
    modo_calculo,
    valor_base,
    fraccion_minutos,
    redondea_hacia_arriba,
    tolerancia_minutos,
    activo,
    configuracion_json
)
VALUES (
    'Tarifa base por hora',
    'BLOQUE_FIJO',
    40000,
    60,
    TRUE,
    0,
    TRUE,
    '{"descripcion":"Cobro por bloque de 60 minutos redondeado hacia arriba"}'::jsonb
)
ON CONFLICT DO NOTHING;