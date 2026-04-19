-- SCRIPT DE EMERGENCIA: CORRECCIÓN DE INFRAESTRUCTURA RBAC
-- Objetivo: Crear tablas faltantes del esquema de seguridad

-- 1. Tabla de Permisos (Catálogo maestro)
CREATE TABLE IF NOT EXISTS seguridad.permisos (
    id_permiso BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    modulo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Tabla Intermedia: Roles x Permisos
CREATE TABLE IF NOT EXISTS seguridad.roles_permisos (
    id BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_permiso BIGINT NOT NULL,
    
    -- Restricciones de integridad
    CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol) 
        REFERENCES seguridad.roles(id_rol) ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso) 
        REFERENCES seguridad.permisos(id_permiso) ON DELETE CASCADE,
    
    -- Unicidad para evitar duplicados
    CONSTRAINT uix_rol_permiso UNIQUE (id_rol, id_permiso)
);

-- 3. Índices razonables para optimización
CREATE INDEX IF NOT EXISTS idx_permisos_codigo ON seguridad.permisos(codigo);
CREATE INDEX IF NOT EXISTS idx_roles_permisos_id_rol ON seguridad.roles_permisos(id_rol);
CREATE INDEX IF NOT EXISTS idx_roles_permisos_id_permiso ON seguridad.roles_permisos(id_permiso);

COMMENT ON TABLE seguridad.permisos IS 'Catálogo maestro de permisos granulares del sistema';
COMMENT ON TABLE seguridad.roles_permisos IS 'Matriz de asignación de permisos a roles (RBAC Dinámico)';
