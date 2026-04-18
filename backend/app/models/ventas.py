from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Numeric, Text, ForeignKey, func, CheckConstraint
from app.models.base import Base

class Caja(Base):
    __tablename__ = "cajas"
    __table_args__ = {"schema": "ventas"}

    id_caja = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    sucursal = Column(String(100))
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

class TurnoCaja(Base):
    __tablename__ = "turnos_caja"
    __table_args__ = (
        CheckConstraint("estado IN ('ABIERTO', 'CERRADO', 'ANULADO')", name='chk_turno_estado'),
        {"schema": "ventas"}
    )

    id_turno = Column(BigInteger, primary_key=True, autoincrement=True)
    id_caja = Column(BigInteger, ForeignKey("ventas.cajas.id_caja"), nullable=False)
    id_usuario = Column(BigInteger, ForeignKey("seguridad.usuarios.id_usuario"), nullable=False)
    fecha_hora_apertura = Column(DateTime, nullable=False, server_default=func.now())
    fecha_hora_cierre = Column(DateTime)
    monto_inicial = Column(Numeric(14, 2), nullable=False, default=0)
    monto_final = Column(Numeric(14, 2))
    estado = Column(String(20), nullable=False, default='ABIERTO')
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

class Cobro(Base):
    __tablename__ = "cobros"
    __table_args__ = (
        CheckConstraint("estado IN ('COBRADO', 'ANULADO', 'REVERSADO')", name='chk_cobro_estado'),
        CheckConstraint("medio_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA')", name='chk_cobro_medio_pago'),
        {"schema": "ventas"}
    )

    id_cobro = Column(BigInteger, primary_key=True, autoincrement=True)
    id_liquidacion = Column(BigInteger, ForeignKey("parking.liquidaciones.id_liquidacion"), nullable=False)
    id_turno = Column(BigInteger, ForeignKey("ventas.turnos_caja.id_turno"), nullable=False)
    medio_pago = Column(String(30), nullable=False)
    monto = Column(Numeric(14, 2), nullable=False)
    referencia_pago = Column(String(150))
    estado = Column(String(20), nullable=False, default='COBRADO')
    cobrado_por = Column(BigInteger, ForeignKey("seguridad.usuarios.id_usuario"), nullable=False)
    cobrado_en = Column(DateTime, nullable=False, server_default=func.now())
    observacion = Column(Text)
