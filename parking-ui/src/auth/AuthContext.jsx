import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshingRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('parking_session_v1');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Refresca los datos del usuario actual desde el backend.
   * Mantiene el token existente y solo actualiza el perfil y permisos.
   * Cuenta con un bloqueo de concurrencia (isRefreshing).
   */
  const refreshUser = useCallback(async () => {
    if (refreshingRef.current) return null;
    
    const savedSession = localStorage.getItem('parking_session_v1');
    if (!savedSession) return null;

    refreshingRef.current = true;
    try {
      const parsedSession = JSON.parse(savedSession);
      const freshUser = await authService.me(parsedSession.token);
      
      if (freshUser) {
        const updatedSession = { ...freshUser, token: parsedSession.token };
        setUser(updatedSession);
        setIsAuthenticated(true);
        localStorage.setItem('parking_session_v1', JSON.stringify(updatedSession));
        return updatedSession;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error("[Auth] Error al refrescar usuario:", error);
      return null;
    } finally {
      refreshingRef.current = false;
    }
  }, [logout]);

  /**
   * Inicialización de la sesión al cargar la aplicación.
   */
  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      const savedSession = localStorage.getItem('parking_session_v1');
      if (savedSession) {
        await refreshUser();
      }
    } catch (error) {
      console.error("[Auth] Error en inicialización:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [refreshUser, logout]);

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

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Función de validación de permisos
  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    return user?.permisos?.includes(permission) || false;
  }, [user]);

  // Interceptor global para errores de autorización.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let response = await originalFetch(...args);
      
      if (response.status === 401) {
        if (typeof args[0] === 'string' && !args[0].includes('/login/access-token')) {
          logout();
        }
      } else if (response.status === 403) {
        // Implementar un único reintento tras refrescar sesión
        const options = args[1] || {};
        if (!options._retry) {
          console.warn("[Auth] 403 detectado. Intentando re-sincronización y reintento único...");
          await refreshUser();
          
          // Clonar opciones y marcar para evitar bucles
          const retryOptions = { ...options, _retry: true };
          response = await originalFetch(args[0], retryOptions);
        }
      }
      
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, [logout, refreshUser]);

  /**
   * Mecanismo de resincronización automática (polling inteligente).
   * Corre cada 60s solo si la pestaña está visible y el usuario autenticado.
   */
  useEffect(() => {
    if (!isAuthenticated || loading || !user) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, loading, user, refreshUser]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshUser,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

