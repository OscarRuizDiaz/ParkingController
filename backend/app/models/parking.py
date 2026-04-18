from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Integer, Numeric, Text, ForeignKey, func, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base
from sqlalchemy.orm import relationship

class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        CheckConstraint("estado IN ('PENDIENTE', 'LIQUIDADO', 'COBRADO', 'FACTURADO', 'ANULADO', 'INVALIDO')", name='chk_ticket_estado'),
        {"schema": "parking"}
    )

    id_ticket = Column(BigInteger, primary_key=True, autoincrement=True)
    codigo_ticket = Column(String(100), nullable=False, unique=True)
    proveedor_origen = Column(String(100))
    fecha_hora_ingreso = Column(DateTime, nullable=False)
    fecha_hora_salida = Column(DateTime)
    minutos_calculados = Column(Integer)
    estado = Column(String(20), nullable=False, default='PENDIENTE')
    referencia_externa = Column(String(150))
    observacion = Column(Text)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())
    actualizado_en = Column(DateTime)

class Tarifa(Base):
    __tablename__ = "tarifas"
    __table_args__ = (
        CheckConstraint("modo_calculo IN ('BLOQUE_FIJO', 'PROPORCIONAL', 'TRAMOS', 'FRACCION')", name='chk_tarifa_modo'),
        {"schema": "parking"}
    )

    id_tarifa = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    modo_calculo = Column(String(30), nullable=False)
    valor_base = Column(Numeric(14, 2), nullable=False, default=0)
    fraccion_minutos = Column(Integer, nullable=False, default=60)
    redondea_hacia_arriba = Column(Boolean, nullable=False, default=True)
    tolerancia_minutos = Column(Integer, nullable=False, default=0)
    vigencia_desde = Column(DateTime, nullable=False, server_default=func.now())
    vigencia_hasta = Column(DateTime)
    activo = Column(Boolean, nullable=False, default=True)
    configuracion_json = Column(JSONB)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

class Liquidacion(Base):
    __tablename__ = "liquidaciones"
    __table_args__ = (
        CheckConstraint(
            "estado IN ('CALCULADO', 'CONFIRMADO', 'REVERTIDO')",
            name="chk_liq_estado"
        ),
        {"schema": "parking"},
    )

    id_liquidacion = Column(BigInteger, primary_key=True, autoincrement=True)
    id_ticket = Column(BigInteger, ForeignKey("parking.tickets.id_ticket"), nullable=False)
    id_tarifa = Column(BigInteger, ForeignKey("parking.tarifas.id_tarifa"), nullable=False)
    minutos = Column(Integer, nullable=False)
    bloques = Column(Integer, nullable=False, default=1)
    monto_bruto = Column(Numeric(14, 2), nullable=False)
    detalle_calculo_json = Column(JSONB)
    estado = Column(String(20), nullable=False, default="CALCULADO")
    creado_por = Column(BigInteger, ForeignKey("seguridad.usuarios.id_usuario"))
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    ticket = relationship("Ticket")
    tarifa = relationship("Tarifa")
