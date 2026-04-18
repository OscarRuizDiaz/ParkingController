from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.facturacion import Factura, FacturaDetalle

class RepositorioFactura(BaseRepository[Factura]):
    def get_by_cobro(self, db: Session, id_cobro: int) -> Optional[Factura]:
        """Busca una factura asociada a un cobro específico."""
        return db.query(Factura).filter(Factura.id_cobro == id_cobro).first()

    def get_max_numero(self, db: Session) -> Optional[str]:
        """Obtiene el último número de factura para simular numeración correlativa."""
        last = db.query(Factura).order_by(Factura.id_factura.desc()).first()
        return last.numero_factura if last else None

class RepositorioFacturaDetalle(BaseRepository[FacturaDetalle]):
    pass

factura_repo = RepositorioFactura(Factura)
detalle_repo = RepositorioFacturaDetalle(FacturaDetalle)
