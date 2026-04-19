from typing import List
from sqlalchemy.orm import Session, joinedload

from app.models.seguridad import Rol, Permiso


class RBACService:
    def __init__(self, db: Session):
        self.db = db

    def get_permisos_por_rol(self, id_rol: int) -> List[str]:
        rol = (
            self.db.query(Rol)
            .options(joinedload(Rol.permisos))
            .filter(Rol.id_rol == id_rol, Rol.activo.is_(True))
            .first()
        )

        if not rol:
            return []

        return [permiso.codigo for permiso in rol.permisos if permiso.activo]

    def actualizar_permisos_rol(self, id_rol: int, lista_codigos: List[str]) -> bool:
        rol = (
            self.db.query(Rol)
            .options(joinedload(Rol.permisos))
            .filter(Rol.id_rol == id_rol, Rol.activo.is_(True))
            .first()
        )
        if not rol:
            raise ValueError(f"Rol ID {id_rol} no encontrado o inactivo.")

        codigos_unicos = list(dict.fromkeys(lista_codigos or []))

        if rol.nombre == "ADMINISTRADOR" and not codigos_unicos:
            raise ValueError("No se permite eliminar todos los permisos del rol ADMINISTRADOR.")

        permisos_objetos = (
            self.db.query(Permiso)
            .filter(Permiso.codigo.in_(codigos_unicos), Permiso.activo.is_(True))
            .all()
        ) if codigos_unicos else []

        if len(permisos_objetos) != len(codigos_unicos):
            encontrados = {p.codigo for p in permisos_objetos}
            faltantes = [c for c in codigos_unicos if c not in encontrados]
            raise ValueError(
                f"Códigos de permiso no válidos o inactivos: {', '.join(faltantes)}"
            )

        try:
            rol.permisos = permisos_objetos
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise

    def check_permission(self, id_rol: int, codigo_permiso: str) -> bool:
        permisos = self.get_permisos_por_rol(id_rol)
        return codigo_permiso in set(permisos)

    def get_roles(self) -> List[Rol]:
        """Obtiene todos los roles con su relación de permisos cargada."""
        return self.db.query(Rol).options(joinedload(Rol.permisos)).order_by(Rol.id_rol).all()

    def get_all_permisos(self) -> List[Permiso]:
        """Obtiene el catálogo maestro de permisos completo."""
        return self.db.query(Permiso).order_by(Permiso.modulo, Permiso.codigo).all()

    def get_rol_con_permisos(self, id_rol: int) -> Rol:
        """Obtiene un rol específico con sus permisos, validando existencia."""
        rol = (
            self.db.query(Rol)
            .options(joinedload(Rol.permisos))
            .filter(Rol.id_rol == id_rol, Rol.activo.is_(True))
            .first()
        )
        if not rol:
             raise ValueError(f"Rol ID {id_rol} no encontrado o inactivo.")
        return rol