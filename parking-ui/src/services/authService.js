import { ROLE_PERMISSIONS } from '../auth/constants/rolePermissions';

const BASE_URL = "http://localhost:8000/api/v1";

export const authService = {
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/login/access-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Credenciales inválidas.');
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Error en login');
    }

    const data = await response.json();
    
    // Normalización Backend -> Frontend (id_usuario, username, nombre, role, permissions, token)
    const userRole = data.user.role;
    return {
      id_usuario: data.user.id,
      username: data.user.username,
      nombre: data.user.nombre,
      role: userRole,
      permissions: ROLE_PERMISSIONS[userRole] || [],
      token: data.access_token
    };
  },

  async logout() {
    // Limpieza local manejada por AuthContext
    return true;
  },

  async me(token) {
    if (!token) return null;
    try {
      const response = await fetch(`${BASE_URL}/usuarios/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;

      const userData = await response.json();
      const userRole = userData.role;
      
      return {
        id_usuario: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole] || [],
        token: token
      };
    } catch (e) {
      return null;
    }
  }
};
