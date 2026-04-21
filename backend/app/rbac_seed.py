import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.seguridad import Rol, Permiso


MASTER_CATALOG = [
    {"codigo": "dashboard.view", "modulo": "dashboard", "desc": "Ver indicadores principales"},
    {"codigo": "caja.view", "modulo": "caja", "desc": "Acceder al módulo de caja"},
    {"codigo": "caja.abrir", "modulo": "caja", "desc": "Realizar apertura de turno"},
    {"codigo": "caja.cerrar", "modulo": "caja", "desc": "Realizar cierre de turno"},
    {"codigo": "caja.gestion", "modulo": "caja", "desc": "Supervisión global de cajas"},
    {"codigo": "caja.cierre_forzado", "modulo": "caja", "desc": "Ejecutar cierres administrativos"},
    {"codigo": "caja.arqueo", "modulo": "caja", "desc": "Visualizar detalle de arqueo"},
    {"codigo": "caja.resumen", "modulo": "caja", "desc": "Ver resumen operativo de caja"},
    {"codigo": "tickets.crear", "modulo": "tickets", "desc": "Generar nuevos tickets de entrada"},
    {"codigo": "tickets.view", "modulo": "tickets", "desc": "Ver listado de tickets"},
    {"codigo": "tickets.buscar", "modulo": "tickets", "desc": "Buscar tickets por código/leído"},
    {"codigo": "tickets.simular", "modulo": "tickets", "desc": "Simular importes de estancia"},
    {"codigo": "tickets.cobrar", "modulo": "tickets", "desc": "Procesar cobros de tickets"},
    {"codigo": "tarifas.view", "modulo": "tarifas", "desc": "Ver tarifas actuales"},
    {"codigo": "tarifas.edit", "modulo": "tarifas", "desc": "Modificar reglas tarifarias"},
    {"codigo": "tarifas.modo_calculo", "modulo": "tarifas", "desc": "Cambiar lógica de cálculo (Manual/Auto)"},
    {"codigo": "turnos.view", "modulo": "turnos", "desc": "Ver historial de turnos"},
    {"codigo": "turnos.manage", "modulo": "turnos", "desc": "Administrar estados de turnos operativos"},
    {"codigo": "reportes.view", "modulo": "reportes", "desc": "Acceder al centro de reportes"},
    {"codigo": "reportes.cierre_caja", "modulo": "reportes", "desc": "Generar reportes de cierre fiscales"},
    {"codigo": "usuarios.view", "modulo": "usuarios", "desc": "Ver listado de usuarios"},
    {"codigo": "usuarios.manage", "modulo": "usuarios", "desc": "Crear y editar usuarios"},
    {"codigo": "usuarios.reset_password", "modulo": "usuarios", "desc": "Resetear contraseñas de otros usuarios"},
    {"codigo": "roles.view", "modulo": "roles", "desc": "Ver matriz de roles"},
    {"codigo": "roles.manage", "modulo": "roles", "desc": "Configurar permisos por rol"},
    {"codigo": "facturacion.view", "modulo": "facturacion", "desc": "Acceder al módulo de facturación fiscal"},
    {"codigo": "facturacion.emitir", "modulo": "facturacion", "desc": "Emitir comprobantes fiscales y facturas"},
]

ASSIGNMENTS = {
    "ADMINISTRADOR": [p["codigo"] for p in MASTER_CATALOG],
    "SUPERVISOR": [
        "dashboard.view", "caja.view", "caja.abrir", "caja.cerrar", "caja.gestion", "caja.cierre_forzado",
        "caja.arqueo", "caja.resumen", "tickets.crear", "tickets.view", "tickets.buscar", "tickets.simular", "tickets.cobrar",
        "tarifas.view", "turnos.view", "turnos.manage", "reportes.view", "reportes.cierre_caja",
        "facturacion.view", "facturacion.emitir",
        "usuarios.view", "usuarios.manage", "usuarios.reset_password"
    ],
    "CAJERO": [
        "caja.view", "caja.abrir", "caja.cerrar", "caja.arqueo", "caja.resumen",
        "tickets.crear", "tickets.view", "tickets.buscar", "tickets.simular", "tickets.cobrar", "turnos.view",
        "facturacion.view", "facturacion.emitir"
    ]
}


def run_seed():
    db = SessionLocal()
    try:
        print("--- Iniciando Sembrado de RBAC ---")

        current_codes = {p["codigo"] for p in MASTER_CATALOG}

        db_permisos = db.query(Permiso).all()
        permisos_por_codigo = {p.codigo: p for p in db_permisos}

        for permiso in db_permisos:
            if permiso.codigo not in current_codes and permiso.activo:
                permiso.activo = False
                print(f"Modificando estado: {permiso.codigo} -> INACTIVO")

        permiso_objects = {}

        for p_data in MASTER_CATALOG:
            permiso = permisos_por_codigo.get(p_data["codigo"])

            if not permiso:
                permiso = Permiso(
                    codigo=p_data["codigo"],
                    modulo=p_data["modulo"],
                    descripcion=p_data["desc"],
                    activo=True,
                )
                db.add(permiso)
                db.flush()
                print(f"Nuevo permiso: {p_data['codigo']}")
            else:
                permiso.modulo = p_data["modulo"]
                permiso.descripcion = p_data["desc"]
                permiso.activo = True

            permiso_objects[p_data["codigo"]] = permiso

        # 2. Validación de Integridad de Asignaciones
        all_catalog_codes = {p["codigo"] for p in MASTER_CATALOG}
        for role_name, allowed_codes in ASSIGNMENTS.items():
            for code in allowed_codes:
                if code not in all_catalog_codes:
                    raise ValueError(f"Error de Integridad: El permiso '{code}' en el rol '{role_name}' no existe en el catálogo maestro.")

        # 3. Sincronización de Roles
        for role_name, allowed_codes in ASSIGNMENTS.items():
            rol = db.query(Rol).filter(Rol.nombre == role_name, Rol.activo.is_(True)).first()
            if not rol:
                print(f"ADVERTENCIA: Rol '{role_name}' no existe o está inactivo. Saltando.")
                continue
            
            # Obtener objetos de permiso permitidos (Lanzará KeyError si falta alguno)
            try:
                new_perms = [permiso_objects[code] for code in allowed_codes]
            except KeyError as e:
                raise ValueError(f"Error de Consistencia: No se pudo encontrar el objeto para el permiso '{str(e)}' durante la asignación.")
            
            rol.permisos = new_perms
            print(f"Sincronizados {len(new_perms)} permisos para el rol: {role_name}")

        db.commit()
        print("--- RBAC Sembrado con éxito ---")
    except Exception as e:
        db.rollback()
        print(f"ERROR en seed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()