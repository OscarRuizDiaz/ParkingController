import React from 'react';
import { useAuth } from './useAuth';
import AccessDeniedScreen from '../pages/AccessDeniedScreen';

/**
 * Guardia de navegación.
 * Protege pantallas completas validando autenticación y permisos opcionales.
 * 
 * @param {string} requiredPermission - Permiso opcional necesario para acceder.
 * @param {React.ReactNode} unauthenticatedFallback - UI a mostrar si no hay sesión (opcional).
 * @param {function} onGoHome - Callback para navegación interna en caso de acceso denegado.
 */
export const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  unauthenticatedFallback = null,
  onGoHome = () => {}
}) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  // Cargando sesión desde localStorage
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  // Protección de autenticación
  if (!isAuthenticated) {
    return unauthenticatedFallback; 
  }

  // Protección de permisos específicos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedScreen onGoHome={onGoHome} />;
  }

  return <>{children}</>;
};
