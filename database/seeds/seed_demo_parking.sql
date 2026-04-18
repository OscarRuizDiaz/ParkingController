DO $$
BEGIN

INSERT INTO seguridad.roles (nombre, descripcion, activo)
VALUES 
    ('ADMINISTRADOR', 'Acceso total al sistema', true),
    ('CAJERO', 'Acceso a operaciones de caja y tickets', true),
    ('SUPERVISOR', 'Acceso a monitoreo y reportes', true)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO seguridad.usuarios (username, password_hash, nombre_completo, email, id_rol, activo)
SELECT 
    'cajero_demo', 
    'pbkdf2:sha256:600000$placeholder$hash', 
    'Cajero Demo', 
    'cajero@example.com',
    (SELECT id_rol FROM seguridad.roles WHERE nombre = 'CAJERO'),
    true
WHERE NOT EXISTS (SELECT 1 FROM seguridad.usuarios WHERE username = 'cajero_demo');

INSERT INTO parking.tarifas (nombre, modo_calculo, valor_base, fraccion_minutos, redondea_hacia_arriba, tolerancia_minutos, activo)
VALUES 
    ('Tarifa base por hora', 'BLOQUE_FIJO', 40000.00, 60, true, 0, true)
ON CONFLICT DO NOTHING;

INSERT INTO maestros.clientes (tipo_documento, numero_documento, nombre_razon_social, activo)
VALUES 
    ('CI', '1234567', 'Cliente Demo', true)
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

INSERT INTO parking.tickets (codigo_ticket, proveedor_origen, fecha_hora_ingreso, estado)
VALUES ('TK-DEMO-001', 'PROVEEDOR A', now() - interval '30 minutes', 'PENDIENTE')
ON CONFLICT (codigo_ticket) DO UPDATE SET fecha_hora_ingreso = EXCLUDED.fecha_hora_ingreso, estado = EXCLUDED.estado;

INSERT INTO parking.tickets (codigo_ticket, proveedor_origen, fecha_hora_ingreso, estado)
VALUES ('TK-DEMO-002', 'PROVEEDOR B', now() - interval '75 minutes', 'PENDIENTE')
ON CONFLICT (codigo_ticket) DO UPDATE SET fecha_hora_ingreso = EXCLUDED.fecha_hora_ingreso, estado = EXCLUDED.estado;

INSERT INTO parking.tickets (codigo_ticket, proveedor_origen, fecha_hora_ingreso, estado)
VALUES ('TK-DEMO-003', 'PROVEEDOR A', now() - interval '130 minutes', 'PENDIENTE')
ON CONFLICT (codigo_ticket) DO UPDATE SET fecha_hora_ingreso = EXCLUDED.fecha_hora_ingreso, estado = EXCLUDED.estado;

INSERT INTO parking.tickets (codigo_ticket, proveedor_origen, fecha_hora_ingreso, estado)
VALUES ('TK-DEMO-004', 'PROVEEDOR C', now() - interval '2 hours', 'LIQUIDADO')
ON CONFLICT (codigo_ticket) DO UPDATE SET estado = EXCLUDED.estado;

INSERT INTO parking.tickets (codigo_ticket, proveedor_origen, fecha_hora_ingreso, estado)
VALUES ('TK-DEMO-005', 'PROVEEDOR B', now() - interval '3 hours', 'COBRADO')
ON CONFLICT (codigo_ticket) DO UPDATE SET estado = EXCLUDED.estado;

INSERT INTO ventas.cajas (nombre, sucursal, activo)
VALUES ('Caja Principal', 'Sucursal Centro', true)
ON CONFLICT DO NOTHING;

INSERT INTO ventas.turnos_caja (id_caja, id_usuario, monto_inicial, estado)
SELECT 
    (SELECT id_caja FROM ventas.cajas WHERE nombre = 'Caja Principal' LIMIT 1),
    (SELECT id_usuario FROM seguridad.usuarios WHERE username = 'cajero_demo' LIMIT 1),
    100000.00,
    'ABIERTO'
WHERE NOT EXISTS (
    SELECT 1 FROM ventas.turnos_caja 
    WHERE id_usuario = (SELECT id_usuario FROM seguridad.usuarios WHERE username = 'cajero_demo' LIMIT 1)
    AND estado = 'ABIERTO'
);

END $$;
