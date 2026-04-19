import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('parking_session_v1');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await authService.login(username, password);
      localStorage.setItem('parking_session_v1', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const initAuth = useCallback(async () => {
    const savedSession = localStorage.getItem('parking_session_v1');
    if (!savedSession) {
      setLoading(false);
      return;
    }

    try {
      const parsedSession = JSON.parse(savedSession);
      // Validar token contra backend para restaurar sesión real
      const freshUser = await authService.me(parsedSession.token);
      
      if (freshUser) {
        setUser(freshUser);
        setIsAuthenticated(true);
        // Actualizar por si acaso cambió algo (ej: permisos)
        localStorage.setItem('parking_session_v1', JSON.stringify(freshUser));
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error restaurando sesión:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Función de validación de permisos
  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // Interceptor global para errores 401
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        // Evitar logout si es el propio login fallido
        if (!args[0].includes('/login/access-token')) {
          logout();
        }
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshUser: initAuth,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

