from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.maestros import Cliente

class RepositorioCliente(BaseRepository[Cliente]):
    def get_by_documento(self, db: Session, tipo: str, numero: str) -> Optional[Cliente]:
        """Busca un cliente por tipo y número de documento."""
        return (
            db.query(Cliente)
            .filter(Cliente.tipo_documento == tipo)
            .filter(Cliente.numero_documento == numero)
            .first()
        )

cliente_repo = RepositorioCliente(Cliente)
