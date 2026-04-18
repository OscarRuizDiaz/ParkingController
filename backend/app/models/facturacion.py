from sqlalchemy import Column, BigInteger, String, DateTime, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base

class Factura(Base):
    __tablename__ = "facturas"
    __table_args__ = (
        CheckConstraint("estado IN ('EMITIDA', 'ANULADA', 'PENDIENTE_SIFEN', 'ACEPTADA_SIFEN', 'RECHAZADA_SIFEN')", name='chk_factura_estado'),
        {"schema": "facturacion"}
    )

    id_factura = Column(BigInteger, primary_key=True, autoincrement=True)
    numero_factura = Column(String(50), nullable=False, unique=True)
    timbrado = Column(String(50))
    fecha_emision = Column(DateTime, nullable=False, server_default=func.now())
    id_cliente = Column(BigInteger, ForeignKey("maestros.clientes.id_cliente"), nullable=False)
    id_cobro = Column(BigInteger, ForeignKey("ventas.cobros.id_cobro"), nullable=False)
    condicion_venta = Column(String(30), nullable=False, default='CONTADO')
    moneda = Column(String(10), nullable=False, default='PYG')
    subtotal = Column(Numeric(14, 2), nullable=False, default=0)
    iva_5 = Column(Numeric(14, 2), nullable=False, default=0)
    iva_10 = Column(Numeric(14, 2), nullable=False, default=0)
    exento = Column(Numeric(14, 2), nullable=False, default=0)
    total = Column(Numeric(14, 2), nullable=False, default=0)
    estado = Column(String(30), nullable=False, default='EMITIDA')
    emitido_por = Column(BigInteger, ForeignKey("seguridad.usuarios.id_usuario"), nullable=False)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

class FacturaDetalle(Base):
    __tablename__ = "factura_detalles"
    __table_args__ = {"schema": "facturacion"}

    id_factura_detalle = Column(BigInteger, primary_key=True, autoincrement=True)
    id_factura = Column(BigInteger, ForeignKey("facturacion.facturas.id_factura", ondelete="CASCADE"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False, default=1)
    precio_unitario = Column(Numeric(14, 2), nullable=False)
    porcentaje_iva = Column(Numeric(5, 2), nullable=False, default=10)
    subtotal_linea = Column(Numeric(14, 2), nullable=False)
    iva_linea = Column(Numeric(14, 2), nullable=False, default=0)
    total_linea = Column(Numeric(14, 2), nullable=False)

class EventoFiscal(Base):
    __tablename__ = "eventos_fiscales"
    __table_args__ = {"schema": "facturacion"}

    id_evento_fiscal = Column(BigInteger, primary_key=True, autoincrement=True)
    id_factura = Column(BigInteger, ForeignKey("facturacion.facturas.id_factura"), nullable=False)
    tipo_evento = Column(String(50), nullable=False)
    payload_json = Column(JSONB)
    respuesta_json = Column(JSONB)
    estado = Column(String(30), nullable=False, default='PENDIENTE')
    creado_en = Column(DateTime, nullable=False, server_default=func.now())
