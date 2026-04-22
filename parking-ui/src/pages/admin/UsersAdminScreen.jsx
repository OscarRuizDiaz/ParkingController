import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Shield,
  Power,
  Key,
  Loader2,
  AlertCircle,
  X,
  Save,
  User,
  Mail,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { PermissionGate } from '../../auth/PermissionGate';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { StatusAlert, Money } from '../../components/UI';

const UsersAdminScreen = ({ setAlert }) => {
  const { user: currentUser, hasPermission, refreshUser } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");

  // Estados para Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos del Formulario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    email: '',
    id_rol: ''
  });
  const [resetPwData, setResetPwData] = useState({ password: '' });

  const canManage = hasPermission(PERMISSIONS.USUARIOS_MANAGE);
  const canReset = hasPermission(PERMISSIONS.USUARIOS_RESET_PASSWORD);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersPromise = apiService.usuarios_getLista();
      const rolesPromise = hasPermission(PERMISSIONS.ROLES_VIEW) 
        ? apiService.rbac_getRoles() 
        : Promise.resolve([]);

      const [usersData, rolesData] = await Promise.all([usersPromise, rolesPromise]);
      setUsuarios(usersData);
      setRoles(rolesData.filter(r => r.activo));
    } catch (err) {
      setAlert({
        title: 'Error de carga',
        message: 'No se pudieron recuperar los usuarios o roles.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return usuarios.filter(u => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = filterRole === "TODOS" || u.nombre_rol === filterRole;
      const matchesStatus = filterStatus === "TODOS" ||
        (filterStatus === "ACTIVOS" && u.activo) ||
        (filterStatus === "INACTIVOS" && !u.activo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usuarios, searchTerm, filterRole, filterStatus]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nombre_completo: '',
      email: '',
      id_rol: roles.length > 0 ? roles[0].id_rol : ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      nombre_completo: user.nombre_completo,
      email: user.email || '',
      id_rol: user.id_rol
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      if (editingUser) {
        await apiService.usuarios_update(editingUser.id_usuario, {
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          id_rol: formData.id_rol
        });

        if (editingUser.id_usuario === currentUser?.id_usuario) {
          await refreshUser();
        }

        setAlert({ title: 'Usuario actualizado', type: 'success' });
      } else {
        await apiService.usuarios_crear(formData);
        setAlert({ title: 'Usuario creado', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await apiService.usuarios_patchEstado(user.id_usuario, !user.activo);

      if (user.id_usuario === currentUser?.id_usuario) {
        await refreshUser();
      }

      setAlert({ title: `Usuario ${user.activo ? 'desactivado' : 'activado'}`, type: 'success' });
      fetchData();
    } catch (err) {
      setAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (saving || !editingUser) return;

    setSaving(true);
    try {
      await apiService.usuarios_resetPassword(editingUser.id_usuario, resetPwData.password);
      setAlert({ title: 'Contraseña reseteada', type: 'success' });
      setIsResetPwOpen(false);
    } catch (err) {
      setAlert({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
        <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Personal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Acciones Globales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" /> Gestión de Personal
          </h1>
          <p className="text-slate-500">Administración de accesos, roles y seguridad del sistema.</p>
        </div>

        <PermissionGate permission={PERMISSIONS.USUARIOS_MANAGE}>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            Nuevo Usuario
          </button>
        </PermissionGate>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-medium transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none appearance-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="TODOS">Todos los Roles</option>
            {roles.map(r => (
              <option key={r.id_rol} value={r.nombre}>{r.nombre}</option>
            ))}
          </select>
        </div>

        <select
          className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="TODOS">Cualquier Estado</option>
          <option value="ACTIVOS">Solo Activos</option>
          <option value="INACTIVOS">Solo Inactivos</option>
        </select>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Información de Usuario</th>
                <th className="px-6 py-4">Rol Asignado</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {filteredUsers.map((u) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={u.id_usuario}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${u.activo ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-400'
                          }`}>
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold text-sm">{u.nombre_completo}</p>
                          <p className="text-slate-400 text-xs font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        u.nombre_rol === 'ADMINISTRADOR' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Shield size={12} />
                        {u.nombre_rol}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-sm font-medium">
                      {u.email || <span className="text-slate-300 italic">No registrado</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          u.activo ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <PermissionGate permission={PERMISSIONS.USUARIOS_MANAGE}>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                            title="Editar usuario"
                          >
                            <Edit3 size={18} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-xl border border-transparent transition-all shadow-sm active:scale-95 ${
                              u.activo ? 'text-red-400 hover:bg-red-50 hover:border-red-100' : 'text-green-400 hover:bg-green-50 hover:border-green-100'
                            }`}
                            title={u.activo ? "Desactivar" : "Activar"}
                          >
                            <Power size={18} />
                          </button>
                        </PermissionGate>

                        <PermissionGate permission={PERMISSIONS.USUARIOS_RESET_PASSWORD}>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setResetPwData({ password: '' });
                              setIsResetPwOpen(true);
                            }}
                            className="p-2 text-amber-500 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all shadow-sm active:scale-95"
                            title="Resetear contraseña"
                          >
                            <Key size={18} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-100" />
              <p>No se encontraron usuarios que coincidan con los criterios de búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales con diseño Light */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-50">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mantenimiento de Perfiles</span>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {editingUser ? 'Actualizar Usuario' : 'Registrar Nuevo'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-5">
                {!editingUser && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Username de Acceso</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        required
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold transition-all outline-none"
                        placeholder="Ej: jperez"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold transition-all outline-none"
                      placeholder="jperez@empresa.com"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Clave de Seguridad</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold transition-all outline-none"
                        placeholder="Min. 6 caracteres"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Rol Operativo</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      required
                      value={formData.id_rol}
                      onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-black transition-all outline-none appearance-none"
                    >
                      {roles.map(r => (
                        <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingUser ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Reset Password */}
      <AnimatePresence>
        {isResetPwOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Key size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nueva Contraseña</h3>
                  <p className="text-slate-500 text-sm mt-1 px-4">Actualizando credenciales para <b>{editingUser.nombre_completo}</b></p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    required
                    autoFocus
                    type="password"
                    placeholder="Escriba la nueva clave..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl px-6 py-4 text-center text-lg font-black tracking-widest outline-none transition-all"
                    value={resetPwData.password}
                    onChange={(e) => setResetPwData({ password: e.target.value })}
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-100 active:scale-95 transition-all"
                    >
                      Confirmar Cambio
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResetPwOpen(false)}
                      className="py-2 text-slate-400 font-bold hover:text-slate-600 text-xs uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersAdminScreen;
