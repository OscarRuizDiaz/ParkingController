from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, distinct
from datetime import datetime, time
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal

from app.models.ventas import Cobro, TurnoCaja, Caja
from app.models.seguridad import Usuario, Rol
from app.models.parking import Ticket, Liquidacion

class ReportesRepository:
    def __init__(self, db: Session):
        self.db = db

    def _get_monto_real_expression(self):
        """Retorna la expresión SQL para obtener el monto real (seguro ante históricos en 0)."""
        return func.coalesce(func.nullif(Cobro.monto, 0), Liquidacion.monto_bruto, 0)

    def get_dashboard_resumen_data(
        self, 
        fecha_desde: datetime, 
        fecha_hasta: datetime,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        sucursal: Optional[str] = None
    ) -> Dict[str, Any]:
        
        # 1. Construir lista de filtros base
        filters = [
            Cobro.cobrado_en >= fecha_desde,
            Cobro.cobrado_en <= fecha_hasta,
            Cobro.estado == 'COBRADO'
        ]
        
        if usuario_id:
            filters.append(Cobro.cobrado_por == usuario_id)
        
        # 2. Definir consultas base
        # Usamos join con Liquidacion para poder acceder a monto_bruto si monto es 0
        query_cobros = self.db.query(
            Cobro.medio_pago,
            func.sum(self._get_monto_real_expression()).label('total')
        ).join(Liquidacion, Cobro.id_liquidacion == Liquidacion.id_liquidacion)
        
        query_tickets = self.db.query(func.count(distinct(Liquidacion.id_ticket)))\
                               .join(Cobro, Cobro.id_liquidacion == Liquidacion.id_liquidacion)
        
        # 3. Agregar joins y filtros extendidos si es necesario
        if caja_id or sucursal:
            query_cobros = query_cobros.join(TurnoCaja, Cobro.id_turno == TurnoCaja.id_turno)\
                                       .join(Caja, TurnoCaja.id_caja == Caja.id_caja)
            query_tickets = query_tickets.join(TurnoCaja, Cobro.id_turno == TurnoCaja.id_turno)\
                                         .join(Caja, TurnoCaja.id_caja == Caja.id_caja)
            
            if caja_id:
                filters.append(TurnoCaja.id_caja == caja_id)
            if sucursal:
                filters.append(Caja.sucursal == sucursal)
        
        # 4. Ejecutar consultas con filtros consolidados
        results = query_cobros.filter(and_(*filters)).group_by(Cobro.medio_pago).all()
        cantidad_tickets = query_tickets.filter(and_(*filters)).scalar() or 0
        
        # 5. Procesar totales por medio de pago
        totales = {
            'EFECTIVO': Decimal("0.00"),
            'TARJETA': Decimal("0.00"),
            'TRANSFERENCIA': Decimal("0.00"),
            'OTROS': Decimal("0.00")
        }
        total_recaudado = Decimal("0.00")
        
        for row in results:
            medio = (row.medio_pago or "OTROS").upper()
            monto = row.total or Decimal("0.00")
            if medio in totales:
                totales[medio] += monto
            else:
                totales['OTROS'] += monto
            total_recaudado += monto
            
        # 6. Cantidad de turnos cerrados (Filtros específicos para turnos)
        turnos_filters = [
            TurnoCaja.fecha_hora_cierre >= fecha_desde,
            TurnoCaja.fecha_hora_cierre <= fecha_hasta,
            TurnoCaja.estado == 'CERRADO'
        ]
        if usuario_id:
            turnos_filters.append(TurnoCaja.id_usuario == usuario_id)
        if caja_id:
            turnos_filters.append(TurnoCaja.id_caja == caja_id)
            
        query_turnos_count = self.db.query(func.count(TurnoCaja.id_turno))
        
        if sucursal:
            query_turnos_count = query_turnos_count.join(Caja, TurnoCaja.id_caja == Caja.id_caja)\
                                                   .filter(and_(*turnos_filters), Caja.sucursal == sucursal)
        else:
            query_turnos_count = query_turnos_count.filter(and_(*turnos_filters))
            
        cantidad_turnos = query_turnos_count.scalar() or 0
        
        promedio = Decimal("0.00")
        if cantidad_turnos > 0:
            promedio = total_recaudado / Decimal(cantidad_turnos)
            
        return {
            "total_recaudado": total_recaudado,
            "cantidad_tickets_cobrados": cantidad_tickets,
            "cantidad_turnos_cerrados": cantidad_turnos,
            "promedio_recaudacion_por_turno": promedio,
            "total_efectivo": totales['EFECTIVO'],
            "total_tarjeta": totales['TARJETA'],
            "total_transferencia": totales['TRANSFERENCIA'],
            "total_otros": totales['OTROS']
        }

    def get_reporte_turnos(
        self,
        fecha_desde: datetime,
        fecha_hasta: datetime,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        estado: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Any], int]:
        
        # Subquery para sumar cobros por turno usando expresión de monto seguro
        subquery_cobros = self.db.query(
            Cobro.id_turno,
            func.sum(self._get_monto_real_expression()).label('total_cobrado')
        ).join(Liquidacion, Cobro.id_liquidacion == Liquidacion.id_liquidacion)\
         .filter(Cobro.estado == 'COBRADO').group_by(Cobro.id_turno).subquery()
        
        base_query = self.db.query(TurnoCaja).filter(
            TurnoCaja.fecha_hora_apertura >= fecha_desde,
            TurnoCaja.fecha_hora_apertura <= fecha_hasta
        )
        
        if usuario_id:
            base_query = base_query.filter(TurnoCaja.id_usuario == usuario_id)
        if caja_id:
            base_query = base_query.filter(TurnoCaja.id_caja == caja_id)
        if estado:
            base_query = base_query.filter(TurnoCaja.estado == estado)
            
        # Total antes de paginar
        total = base_query.count()
        
        # Query detallada
        query = self.db.query(
            TurnoCaja.id_turno.label('turno_id'),
            TurnoCaja.id_usuario.label('usuario_id'),
            Usuario.nombre_completo.label('usuario_nombre'),
            TurnoCaja.id_caja.label('caja_id'),
            Caja.nombre.label('caja_nombre'),
            TurnoCaja.fecha_hora_apertura.label('fecha_apertura'),
            TurnoCaja.fecha_hora_cierre.label('fecha_cierre'),
            TurnoCaja.monto_inicial,
            func.coalesce(subquery_cobros.c.total_cobrado, 0).label('total_cobrado'),
            TurnoCaja.monto_final.label('monto_final_declarado'),
            TurnoCaja.diferencia,
            TurnoCaja.estado
        ).join(Usuario, TurnoCaja.id_usuario == Usuario.id_usuario)\
         .join(Caja, TurnoCaja.id_caja == Caja.id_caja)\
         .outerjoin(subquery_cobros, TurnoCaja.id_turno == subquery_cobros.c.id_turno)
         
        # Aplicar los mismos filtros a la query detallada
        filters = [
            TurnoCaja.fecha_hora_apertura >= fecha_desde,
            TurnoCaja.fecha_hora_apertura <= fecha_hasta
        ]
        if usuario_id: filters.append(TurnoCaja.id_usuario == usuario_id)
        if caja_id: filters.append(TurnoCaja.id_caja == caja_id)
        if estado: filters.append(TurnoCaja.estado == estado)
        
        items = query.filter(and_(*filters))\
                     .order_by(TurnoCaja.fecha_hora_apertura.desc())\
                     .limit(limit).offset(offset).all()
                     
        return items, total

    def get_reporte_cobros(
        self,
        fecha_desde: datetime,
        fecha_hasta: datetime,
        usuario_id: Optional[int] = None,
        caja_id: Optional[int] = None,
        medio_pago: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Any], int]:
        
        base_query = self.db.query(Cobro).filter(
            Cobro.cobrado_en >= fecha_desde,
            Cobro.cobrado_en <= fecha_hasta,
            Cobro.estado == 'COBRADO'
        )
        
        if usuario_id or caja_id:
             base_query = base_query.join(TurnoCaja, Cobro.id_turno == TurnoCaja.id_turno)
             if usuario_id: base_query = base_query.filter(Cobro.cobrado_por == usuario_id)
             if caja_id: base_query = base_query.filter(TurnoCaja.id_caja == caja_id)
             
        if medio_pago:
            base_query = base_query.filter(Cobro.medio_pago == medio_pago)
            
        total = base_query.count()
        
        query = self.db.query(
            Cobro.id_cobro.label('cobro_id'),
            Ticket.id_ticket.label('ticket_id'),
            Ticket.codigo_ticket.label('codigo_ticket'),
            Cobro.cobrado_en.label('fecha_cobro'),
            Cobro.cobrado_por.label('usuario_id'),
            Usuario.nombre_completo.label('usuario_nombre'),
            TurnoCaja.id_caja.label('caja_id'),
            Caja.nombre.label('caja_nombre'),
            Cobro.medio_pago,
            self._get_monto_real_expression().label('monto')
        ).join(Liquidacion, Cobro.id_liquidacion == Liquidacion.id_liquidacion)\
         .join(Ticket, Liquidacion.id_ticket == Ticket.id_ticket)\
         .join(Usuario, Cobro.cobrado_por == Usuario.id_usuario)\
         .join(TurnoCaja, Cobro.id_turno == TurnoCaja.id_turno)\
         .join(Caja, TurnoCaja.id_caja == Caja.id_caja)
         
        filters = [
            Cobro.cobrado_en >= fecha_desde,
            Cobro.cobrado_en <= fecha_hasta,
            Cobro.estado == 'COBRADO'
        ]
        if usuario_id: filters.append(Cobro.cobrado_por == usuario_id)
        if caja_id: filters.append(TurnoCaja.id_caja == caja_id)
        if medio_pago: filters.append(Cobro.medio_pago == medio_pago)
            
        items = query.filter(and_(*filters))\
                     .order_by(Cobro.cobrado_en.desc())\
                     .limit(limit).offset(offset).all()
                     
        return items, total

    def get_filtros_disponibles(self) -> Dict[str, Any]:
        subq_turnos = self.db.query(TurnoCaja.id_usuario).subquery()
        subq_cobros = self.db.query(Cobro.cobrado_por).subquery()
        
        usuarios = self.db.query(Usuario.id_usuario.label('id'), Usuario.nombre_completo.label('nombre'))\
                          .join(Rol, Usuario.id_rol == Rol.id_rol)\
                          .filter(Usuario.activo == True)\
                          .filter(or_(
                              Rol.nombre == 'CAJERO',
                              Usuario.id_usuario.in_(subq_turnos),
                              Usuario.id_usuario.in_(subq_cobros)
                          )).distinct().all()
        
        cajas = self.db.query(Caja.id_caja.label('id'), Caja.nombre)\
                       .filter(Caja.activo == True).all()
        
        sucursales = self.db.query(Caja.sucursal).filter(Caja.sucursal.isnot(None))\
                            .distinct().all()
        
        medios_pago = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"]
        
        return {
            "usuarios_cajeros": [{"id": u.id, "nombre": u.nombre} for u in usuarios],
            "cajas": [{"id": c.id, "nombre": c.nombre} for c in cajas],
            "sucursales": [s.sucursal for s in sucursales if s.sucursal],
            "medios_pago": medios_pago
        }
