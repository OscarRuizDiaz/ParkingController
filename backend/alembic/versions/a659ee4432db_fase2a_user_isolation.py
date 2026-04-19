"""fase2a_user_isolation

Revision ID: a659ee4432db
Revises: 
Create Date: 2026-04-19 00:21:17.550743

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a659ee4432db'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema and handle existing tables."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Crear Esquemas si no existen
    schemas = ['audit', 'maestros', 'parking', 'seguridad', 'ventas', 'facturacion']
    for schema in schemas:
        op.execute(sa.text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))

    # Helper para crear tabla solo si no existe
    def table_exists(name, schema):
        return inspector.has_table(name, schema=schema)

    # audit.eventos
    if not table_exists('eventos', 'audit'):
        op.create_table('eventos',
            sa.Column('id_evento', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('modulo', sa.String(length=50), nullable=False),
            sa.Column('entidad', sa.String(length=50), nullable=False),
            sa.Column('id_entidad', sa.BigInteger(), nullable=True),
            sa.Column('accion', sa.String(length=50), nullable=False),
            sa.Column('detalle_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('usuario', sa.String(length=100), nullable=True),
            sa.Column('fecha_hora', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('ip_origen', sa.String(length=50), nullable=True),
            sa.PrimaryKeyConstraint('id_evento'),
            schema='audit'
        )

    # maestros.clientes
    if not table_exists('clientes', 'maestros'):
        op.create_table('clientes',
            sa.Column('id_cliente', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('tipo_documento', sa.String(length=20), nullable=False),
            sa.Column('numero_documento', sa.String(length=30), nullable=False),
            sa.Column('nombre_razon_social', sa.String(length=200), nullable=False),
            sa.Column('direccion', sa.String(length=255), nullable=True),
            sa.Column('telefono', sa.String(length=50), nullable=True),
            sa.Column('email', sa.String(length=150), nullable=True),
            sa.Column('tipo_contribuyente', sa.String(length=30), nullable=True),
            sa.Column('activo', sa.Boolean(), nullable=False),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('actualizado_en', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id_cliente'),
            sa.UniqueConstraint('tipo_documento', 'numero_documento', name='uq_clientes_documento'),
            schema='maestros'
        )

    # parking.tarifas
    if not table_exists('tarifas', 'parking'):
        op.create_table('tarifas',
            sa.Column('id_tarifa', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('nombre', sa.String(length=100), nullable=False),
            sa.Column('modo_calculo', sa.String(length=60), nullable=False),
            sa.Column('valor_base', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('fraccion_minutos', sa.Integer(), nullable=False),
            sa.Column('redondea_hacia_arriba', sa.Boolean(), nullable=False),
            sa.Column('tolerancia_minutos', sa.Integer(), nullable=False),
            sa.Column('vigencia_desde', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('vigencia_hasta', sa.DateTime(), nullable=True),
            sa.Column('activo', sa.Boolean(), nullable=False),
            sa.Column('configuracion_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.CheckConstraint("modo_calculo IN ('BLOQUE_FIJO', 'PROPORCIONAL', 'TRAMOS', 'FRACCION', 'BASE_MAS_EXCEDENTE_PROPORCIONAL')", name='chk_tarifa_modo'),
            sa.PrimaryKeyConstraint('id_tarifa'),
            schema='parking'
        )

    # parking.tickets
    if not table_exists('tickets', 'parking'):
        op.create_table('tickets',
            sa.Column('id_ticket', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('codigo_ticket', sa.String(length=100), nullable=False),
            sa.Column('proveedor_origen', sa.String(length=100), nullable=True),
            sa.Column('fecha_hora_ingreso', sa.DateTime(), nullable=False),
            sa.Column('fecha_hora_salida', sa.DateTime(), nullable=True),
            sa.Column('minutos_calculados', sa.Integer(), nullable=True),
            sa.Column('estado', sa.String(length=20), nullable=False),
            sa.Column('referencia_externa', sa.String(length=150), nullable=True),
            sa.Column('observacion', sa.Text(), nullable=True),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('actualizado_en', sa.DateTime(), nullable=True),
            sa.CheckConstraint("estado IN ('PENDIENTE', 'LIQUIDADO', 'COBRADO', 'FACTURADO', 'ANULADO', 'INVALIDO')", name='chk_ticket_estado'),
            sa.PrimaryKeyConstraint('id_ticket'),
            sa.UniqueConstraint('codigo_ticket'),
            schema='parking'
        )

    # seguridad.roles
    if not table_exists('roles', 'seguridad'):
        op.create_table('roles',
            sa.Column('id_rol', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('nombre', sa.String(length=50), nullable=False),
            sa.Column('descripcion', sa.String(length=255), nullable=True),
            sa.Column('activo', sa.Boolean(), nullable=False),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id_rol'),
            sa.UniqueConstraint('nombre'),
            schema='seguridad'
        )

    # ventas.cajas
    if not table_exists('cajas', 'ventas'):
        op.create_table('cajas',
            sa.Column('id_caja', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('nombre', sa.String(length=100), nullable=False),
            sa.Column('sucursal', sa.String(length=100), nullable=True),
            sa.Column('activo', sa.Boolean(), nullable=False),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id_caja'),
            schema='ventas'
        )

    # seguridad.usuarios
    if not table_exists('usuarios', 'seguridad'):
        op.create_table('usuarios',
            sa.Column('id_usuario', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('username', sa.String(length=50), nullable=False),
            sa.Column('password_hash', sa.Text(), nullable=False),
            sa.Column('nombre_completo', sa.String(length=150), nullable=False),
            sa.Column('email', sa.String(length=150), nullable=True),
            sa.Column('id_rol', sa.BigInteger(), nullable=False),
            sa.Column('activo', sa.Boolean(), nullable=False),
            sa.Column('ultimo_acceso', sa.DateTime(), nullable=True),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['id_rol'], ['seguridad.roles.id_rol'], ),
            sa.PrimaryKeyConstraint('id_usuario'),
            sa.UniqueConstraint('username'),
            schema='seguridad'
        )

    # parking.liquidaciones
    if not table_exists('liquidaciones', 'parking'):
        op.create_table('liquidaciones',
            sa.Column('id_liquidacion', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('id_ticket', sa.BigInteger(), nullable=False),
            sa.Column('id_tarifa', sa.BigInteger(), nullable=False),
            sa.Column('minutos', sa.Integer(), nullable=False),
            sa.Column('bloques', sa.Integer(), nullable=False),
            sa.Column('monto_bruto', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('detalle_calculo_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('estado', sa.String(length=20), nullable=False),
            sa.Column('creado_por', sa.BigInteger(), nullable=True),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.CheckConstraint("estado IN ('CALCULADO', 'CONFIRMADO', 'REVERTIDO')", name='chk_liq_estado'),
            sa.ForeignKeyConstraint(['creado_por'], ['seguridad.usuarios.id_usuario'], ),
            sa.ForeignKeyConstraint(['id_tarifa'], ['parking.tarifas.id_tarifa'], ),
            sa.ForeignKeyConstraint(['id_ticket'], ['parking.tickets.id_ticket'], ),
            sa.PrimaryKeyConstraint('id_liquidacion'),
            schema='parking'
        )

    # ventas.turnos_caja
    if not table_exists('turnos_caja', 'ventas'):
        op.create_table('turnos_caja',
            sa.Column('id_turno', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('id_caja', sa.BigInteger(), nullable=False),
            sa.Column('id_usuario', sa.BigInteger(), nullable=False),
            sa.Column('id_usuario_cierre', sa.BigInteger(), nullable=True),
            sa.Column('fecha_hora_apertura', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('fecha_hora_cierre', sa.DateTime(), nullable=True),
            sa.Column('monto_inicial', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('monto_final', sa.Numeric(precision=14, scale=2), nullable=True),
            sa.Column('diferencia', sa.Numeric(precision=14, scale=2), nullable=True),
            sa.Column('estado', sa.String(length=20), nullable=False),
            sa.Column('motivo_cierre', sa.Text(), nullable=True),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.CheckConstraint("estado IN ('ABIERTO', 'CERRADO', 'ANULADO')", name='chk_turno_estado'),
            sa.ForeignKeyConstraint(['id_caja'], ['ventas.cajas.id_caja'], ),
            sa.ForeignKeyConstraint(['id_usuario'], ['seguridad.usuarios.id_usuario'], ),
            sa.ForeignKeyConstraint(['id_usuario_cierre'], ['seguridad.usuarios.id_usuario'], ),
            sa.PrimaryKeyConstraint('id_turno'),
            schema='ventas'
        )
    else:
        # La tabla existe, verificar columnas de supervisión Fase 2C
        existing_cols = [c['name'] for c in inspector.get_columns('turnos_caja', schema='ventas')]
        if 'id_usuario_cierre' not in existing_cols:
            op.add_column('turnos_caja', sa.Column('id_usuario_cierre', sa.BigInteger(), nullable=True), schema='ventas')
            op.create_foreign_key('fk_turno_usuario_cierre', 'turnos_caja', 'usuarios', ['id_usuario_cierre'], ['id_usuario'], source_schema='ventas', referent_schema='seguridad')
        if 'motivo_cierre' not in existing_cols:
            op.add_column('turnos_caja', sa.Column('motivo_cierre', sa.Text(), nullable=True), schema='ventas')

    # Índices de aislamiento operativo
    try:
        op.create_index('idx_unique_open_shift_per_box', 'turnos_caja', ['id_caja'], unique=True, schema='ventas', postgresql_where=sa.text("estado = 'ABIERTO'"))
    except: pass
    try:
        op.create_index('idx_unique_open_shift_per_user', 'turnos_caja', ['id_usuario'], unique=True, schema='ventas', postgresql_where=sa.text("estado = 'ABIERTO'"))
    except: pass

    # ventas.cobros
    if not table_exists('cobros', 'ventas'):
        op.create_table('cobros',
            sa.Column('id_cobro', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('id_liquidacion', sa.BigInteger(), nullable=False),
            sa.Column('id_turno', sa.BigInteger(), nullable=False),
            sa.Column('medio_pago', sa.String(length=30), nullable=False),
            sa.Column('monto', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('referencia_pago', sa.String(length=150), nullable=True),
            sa.Column('estado', sa.String(length=20), nullable=False),
            sa.Column('cobrado_por', sa.BigInteger(), nullable=False),
            sa.Column('cobrado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('observacion', sa.Text(), nullable=True),
            sa.CheckConstraint("estado IN ('COBRADO', 'ANULADO', 'REVERSADO')", name='chk_cobro_estado'),
            sa.CheckConstraint("medio_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA')", name='chk_cobro_medio_pago'),
            sa.ForeignKeyConstraint(['cobrado_por'], ['seguridad.usuarios.id_usuario'], ),
            sa.ForeignKeyConstraint(['id_liquidacion'], ['parking.liquidaciones.id_liquidacion'], ),
            sa.ForeignKeyConstraint(['id_turno'], ['ventas.turnos_caja.id_turno'], ),
            sa.PrimaryKeyConstraint('id_cobro'),
            schema='ventas'
        )

    # facturacion.facturas
    if not table_exists('facturas', 'facturacion'):
        op.create_table('facturas',
            sa.Column('id_factura', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('numero_factura', sa.String(length=50), nullable=False),
            sa.Column('timbrado', sa.String(length=50), nullable=True),
            sa.Column('fecha_emision', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('id_cliente', sa.BigInteger(), nullable=False),
            sa.Column('id_cobro', sa.BigInteger(), nullable=False),
            sa.Column('condicion_venta', sa.String(length=30), nullable=False),
            sa.Column('moneda', sa.String(length=10), nullable=False),
            sa.Column('subtotal', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('iva_5', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('iva_10', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('exento', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('total', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('estado', sa.String(length=30), nullable=False),
            sa.Column('emitido_por', sa.BigInteger(), nullable=False),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.CheckConstraint("estado IN ('EMITIDA', 'ANULADA', 'PENDIENTE_SIFEN', 'ACEPTADA_SIFEN', 'RECHAZADA_SIFEN')", name='chk_factura_estado'),
            sa.ForeignKeyConstraint(['emitido_por'], ['seguridad.usuarios.id_usuario'], ),
            sa.ForeignKeyConstraint(['id_cliente'], ['maestros.clientes.id_cliente'], ),
            sa.ForeignKeyConstraint(['id_cobro'], ['ventas.cobros.id_cobro'], ),
            sa.PrimaryKeyConstraint('id_factura'),
            sa.UniqueConstraint('numero_factura'),
            schema='facturacion'
        )

    # facturacion.eventos_fiscales
    if not table_exists('eventos_fiscales', 'facturacion'):
        op.create_table('eventos_fiscales',
            sa.Column('id_evento_fiscal', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('id_factura', sa.BigInteger(), nullable=False),
            sa.Column('tipo_evento', sa.String(length=50), nullable=False),
            sa.Column('payload_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('respuesta_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('estado', sa.String(length=30), nullable=False),
            sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['id_factura'], ['facturacion.facturas.id_factura'], ),
            sa.PrimaryKeyConstraint('id_evento_fiscal'),
            schema='facturacion'
        )

    # facturacion.factura_detalles
    if not table_exists('factura_detalles', 'facturacion'):
        op.create_table('factura_detalles',
            sa.Column('id_factura_detalle', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('id_factura', sa.BigInteger(), nullable=False),
            sa.Column('descripcion', sa.String(length=255), nullable=False),
            sa.Column('cantidad', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('precio_unitario', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('porcentaje_iva', sa.Numeric(precision=5, scale=2), nullable=False),
            sa.Column('subtotal_linea', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('iva_linea', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('total_linea', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.ForeignKeyConstraint(['id_factura'], ['facturacion.facturas.id_factura'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id_factura_detalle'),
            schema='facturacion'
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('factura_detalles', schema='facturacion')
    op.drop_table('eventos_fiscales', schema='facturacion')
    op.drop_table('facturas', schema='facturacion')
    op.drop_table('cobros', schema='ventas')
    op.drop_index('idx_unique_open_shift_per_user', table_name='turnos_caja', schema='ventas', postgresql_where=sa.text("estado = 'ABIERTO'"))
    op.drop_index('idx_unique_open_shift_per_box', table_name='turnos_caja', schema='ventas', postgresql_where=sa.text("estado = 'ABIERTO'"))
    op.drop_table('turnos_caja', schema='ventas')
    op.drop_table('liquidaciones', schema='parking')
    op.drop_table('usuarios', schema='seguridad')
    op.drop_table('cajas', schema='ventas')
    op.drop_table('roles', schema='seguridad')
    op.drop_table('tickets', schema='parking')
    op.drop_table('tarifas', schema='parking')
    op.drop_table('clientes', schema='maestros')
    op.drop_table('eventos', schema='audit')
