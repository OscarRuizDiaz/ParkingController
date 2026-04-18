from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.facturacion import Factura, FacturaDetalle
from app.models.ventas import Cobro
from app.models.parking import Ticket
from app.models.maestros import Cliente
from app.repositories.facturacion_repo import factura_repo, detalle_repo
from app.repositories.ventas_repo import cobro_repo
from app.repositories.maestros_repo import cliente_repo
from app.repositories.parking_repo import ticket_repo, liquidacion_repo
from app.schemas.facturacion import FacturaCreate, FacturaResponse
from app.models.seguridad import Usuario

class FacturacionService:
    def __init__(self, db: Session):
        self.db = db

    def _get_demo_user(self) -> Usuario:
        user = self.db.query(Usuario).filter(Usuario.username == 'cajero_demo').first()
        if not user:
            raise ValueError("Usuario demo 'cajero_demo' no encontrado.")
        return user

    def _generar_numero_factura(self) -> str:
        """Simula generación de número correlativo (MVP)."""
        ultimo = factura_repo.get_max_numero(self.db)
        if not ultimo:
            return "001-001-0000001"
        
        prefijo = "001-001-"
        secuencia = int(ultimo.split("-")[-1]) + 1
        return f"{prefijo}{str(secuencia).zfill(7)}"

    def emitir_factura_desde_cobro(self, factura_in: FacturaCreate) -> FacturaResponse:
        """
        Emite una factura fiscal asociada a un cobro.
        Implementa lógica de alta rápida de clientes y actualización de tickets.
        IVA al 10% fijo (Simplificación temporal).
        """
        user = self._get_demo_user()
        
        # 1. Validar Cobro
        cobro = cobro_repo.get(self.db, factura_in.id_cobro)
        if not cobro:
            raise ValueError(f"Cobro #{factura_in.id_cobro} no encontrado.")
        
        # 2. Validar Duplicidad
        factura_existente = factura_repo.get_by_cobro(self.db, cobro.id_cobro)
        if factura_existente:
            raise ValueError(f"El cobro #{cobro.id_cobro} ya posee una factura asociada (#{factura_existente.numero_factura}).")

        try:
            # --- INICIO TRANSACCIÓN ---
            
            # 3. Gestionar Cliente (Búsqueda o Alta Rápida)
            cliente = cliente_repo.get_by_documento(
                self.db, factura_in.tipo_documento, factura_in.numero_documento
            )
            
            if not cliente:
                # Alta Rápida
                cliente_data = {
                    "tipo_documento": factura_in.tipo_documento,
                    "numero_documento": factura_in.numero_documento,
                    "nombre_razon_social": factura_in.nombre_razon_social,
                    "activo": True
                }
                cliente = cliente_repo.create(self.db, cliente_data)
            
            # 4. Cálculos de IVA (10% fijo)
            total = cobro.monto
            iva_10 = total / Decimal("11") # Monto tiene IVA incluido (Paraguay)
            
            # 5. Crear Cabecera de Factura
            numero = self._generar_numero_factura()
            factura_data = {
                "numero_factura": numero,
                "id_cliente": cliente.id_cliente,
                "id_cobro": cobro.id_cobro,
                "total": total,
                "iva_10": iva_10,
                "iva_5": Decimal("0"),
                "exento": Decimal("0"),
                "subtotal": total - iva_10,
                "emitido_por": user.id_usuario,
                "estado": "EMITIDA",
                "condicion_venta": factura_in.condicion_venta
            }
            nueva_factura = factura_repo.create(self.db, factura_data)
            
            # 6. Crear Detalle de Factura
            detalle_data = {
                "id_factura": nueva_factura.id_factura,
                "descripcion": "Servicio de Estacionamiento",
                "cantidad": Decimal("1.00"),
                "precio_unitario": total,
                "porcentaje_iva": Decimal("10.00"),
                "subtotal_linea": total - iva_10,
                "iva_linea": iva_10,
                "total_linea": total
            }
            detalle_repo.create(self.db, detalle_data)
            
            # 7. Actualizar Ticket a FACTURADO
            # Recuperamos liquidación y ticket explícitamente para asegurar consistencia
            liquidacion = liquidacion_repo.get(self.db, cobro.id_liquidacion)
            if not liquidacion:
                raise ValueError("Liquidación asociada al cobro no encontrada.")
            
            ticket = ticket_repo.get(self.db, liquidacion.id_ticket)
            if not ticket:
                raise ValueError("Ticket asociado a la liquidación no encontrado.")
            
            ticket_repo.update(self.db, ticket, {"estado": "FACTURADO"})
            
            # COMMIT
            self.db.commit()
            self.db.refresh(nueva_factura)
            
            # Pydantic v2: usando model_validate
            return FacturaResponse.model_validate(nueva_factura)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Error crítico en facturación: {str(e)}")
