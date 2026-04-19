import React from 'react';
import { useAuth } from './useAuth';

/**
 * Componente para control granular de UI basado en permisos.
 * 
 * @param {string} permission - Identificador del permiso requerido. Si es nulo, permite acceso.
 * @param {string} mode - 'hide' (defecto) oculta el componente, 'disable' añade prop disabled.
 * @param {React.ReactNode} fallback - Contenido opcional si no tiene permiso (solo modo 'hide').
 */
export const PermissionGate = ({ 
  children, 
  permission = null, 
  mode = 'hide', 
  fallback = null 
}) => {
  const { hasPermission } = useAuth();

  // Si no se define permiso, el acceso es público para este componente
  if (!permission) {
    return <>{children}</>;
  }

  const canAccess = hasPermission(permission);

  if (!canAccess) {
    if (mode === 'disable') {
      // Inyectamos props de deshabilitado si es un único elemento hijo válido
      try {
        const child = React.Children.only(children);
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            disabled: true,
            'aria-disabled': true 
          });
        }
      } catch (e) {
        // Si no es un Children.only o falla la clonación, retornamos tal cual para evitar crash
        console.warn("PermissionGate: mode='disable' requiere un único elemento hijo válido.");
      }
      return children;
    }
    
    // Modo 'hide' (default)
    return fallback;
  }

  return <>{children}</>;
};
