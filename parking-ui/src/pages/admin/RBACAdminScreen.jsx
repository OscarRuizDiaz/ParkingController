import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  ChevronRight, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  Search,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { PermissionGate } from '../../auth/PermissionGate';
import { PERMISSIONS } from '../../auth/constants/permissions';

const RBACAdminScreen = ({ setAlert }) => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permisosMaster, setPermisosMaster] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = hasPermission(PERMISSIONS.ROLES_MANAGE);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [rolesData, permisosData] = await Promise.all([
        apiService.rbac_getRoles(),
        apiService.rbac_getPermisosMaster()
      ]);
      setRoles(rolesData);
      setPermisosMaster(permisosData);
      
      // Seleccionar el primero por defecto (preferir no-ADMIN)
      if (rolesData.length > 0) {
        const initialRol = rolesData.find(r => r.nombre !== 'ADMINISTRADOR') || rolesData[0];
        await handleSelectRol(initialRol);
      }
    } catch (err) {
      setAlert({ 
        title: 'Error de carga', 
        message: 'No se pudieron recuperar los roles o permisos maestro.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRol = async (rol) => {
    setSelectedRol(rol);
    try {
      const detail = await apiService.rbac_getRolDetalle(rol.id_rol);
      setSelectedPermisos(detail.permisos);
    } catch (err) {
      setAlert({ 
        title: 'Error de detalle', 
        message: 'No se pudo cargar la matriz de permisos del rol.', 
        type: 'error' 
      });
    }
  };

  const handleTogglePermiso = (codigo) => {
    if (selectedRol?.nombre === 'ADMINISTRADOR' || !canManage) return;
    
    setSelectedPermisos(prev => 
      prev.includes(codigo) 
        ? prev.filter(c => c !== codigo) 
        : [...prev, codigo]
    );
  };

  const handleSave = async () => {
    if (!selectedRol || saving || !canManage) return;
    
    console.log("[RBAC] Intentando guardar cambios:");
    console.log(" -> canManage:", canManage);
    console.log(" -> selectedRol:", selectedRol);
    console.log(" -> selectedPermisos:", selectedPermisos);

    setSaving(true);
    try {
      const result = await apiService.rbac_updateRolPermisos(selectedRol.id_rol, selectedPermisos);
      console.log("[RBAC] Resultado del backend:", result);
      
      // Sincronizar con respuesta real del backend post-save
      const updatedDetail = await apiService.rbac_getRolDetalle(selectedRol.id_rol);
      setSelectedPermisos(updatedDetail.permisos);

      setAlert({ 
        title: 'Éxito', 
        message: result.message || `Permisos de ${selectedRol.nombre} actualizados con éxito.`, 
        type: 'success' 
      });
      
      // Actualizar conteo en la lista local de roles
      setRoles(prev => prev.map(r => 
        r.id_rol === selectedRol.id_rol 
          ? { ...r, cantidad_permisos: updatedDetail.permisos.length }
          : r
      ));
    } catch (err) {
      setAlert({ 
        title: 'Error al guardar', 
        message: err.message || 'Hubo un problema al persistir los cambios.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Agrupar permisos por modulo
  const permisosAgrupados = useMemo(() => {
    const grupos = {};
    permisosMaster.forEach(p => {
      if (!grupos[p.modulo]) grupos[p.modulo] = [];
      grupos[p.modulo].push(p);
    });
    return grupos;
  }, [permisosMaster]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Infraestructura RBAC...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* PANEL IZQUIERDO: ROLES */}
      <div className="md:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Roles del Sistema</h2>
          </div>

          <div className="space-y-3">
            {roles.map(rol => (
              <button
                key={rol.id_rol}
                onClick={() => handleSelectRol(rol)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  selectedRol?.id_rol === rol.id_rol
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/5'
                    : 'border-transparent bg-white hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black text-sm uppercase tracking-wider ${
                    selectedRol?.id_rol === rol.id_rol ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {rol.nombre}
                  </span>
                  <div className="bg-white px-2 py-1 rounded-lg border text-[10px] font-black text-slate-400">
                    {rol.cantidad_permisos} PERMISOS
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{rol.descripcion}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Zona Crítica</h4>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed font-medium">
                Los cambios en los permisos afectan el acceso del personal en tiempo real. 
                El rol <strong>ADMINISTRADOR</strong> tiene restricciones de edición visual para evitar bloqueos del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: EDITOR DE PERMISOS */}
      <div className="md:col-span-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Header Editor */}
          <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Matriz de Acceso</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{selectedRol?.nombre}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedRol?.nombre === 'ADMINISTRADOR' ? 'Vista de Solo Lectura' : 'Asignación de Permisos'}
              </h3>
            </div>
            
            <PermissionGate permission={PERMISSIONS.ROLES_MANAGE}>
              <button
                onClick={handleSave}
                disabled={saving || !selectedRol || selectedRol.nombre === 'ADMINISTRADOR'}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Guardando...' : 'Aplicar Cambios'}
              </button>
            </PermissionGate>
          </div>

          {/* Buscador de Permisos */}
          <div className="px-6 py-4 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Filtrar permisos (ej: caja, ventas, tarifas)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>

          {/* Grilla de Permisos */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {Object.keys(permisosAgrupados).map(modulo => {
              const term = searchTerm.toLowerCase();
              const permisosVisibles = permisosAgrupados[modulo].filter(p => 
                p.codigo.toLowerCase().includes(term) || 
                p.descripcion.toLowerCase().includes(term) ||
                p.modulo.toLowerCase().includes(term)
              );

              if (permisosVisibles.length === 0) return null;

              return (
                <div key={modulo} className="mb-8 last:mb-0">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-slate-100"></span> 
                    Módulo: {modulo}
                    <span className="flex-1 h-px bg-slate-100"></span>
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {permisosVisibles.map(permiso => {
                      const isChecked = selectedPermisos.includes(permiso.codigo);
                      const isAdmin = selectedRol?.nombre === 'ADMINISTRADOR';

                      return (
                        <div 
                          key={permiso.codigo}
                          onClick={() => !isAdmin && handleTogglePermiso(permiso.codigo)}
                          className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                            isChecked 
                              ? 'border-slate-900/10 bg-slate-900/[0.02]' 
                              : 'border-slate-50 bg-white hover:border-slate-100 hover:bg-slate-50'
                          } ${isAdmin ? 'cursor-default opacity-80' : ''}`}
                        >
                          <div className={`flex items-center justify-center h-6 w-6 rounded-lg border-2 transition-all ${
                            isChecked
                              ? 'bg-slate-900 border-slate-900'
                              : 'bg-white border-slate-200 group-hover:border-slate-300'
                          }`}>
                            {isChecked && <ShieldCheck className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{permiso.codigo}</span>
                              {!permiso.activo && (
                                <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Inactivo</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{permiso.descripcion}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACAdminScreen;
