import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Pantalla de Acceso Denegado.
 * Implementa navegación interna SPA vía prop callback.
 */
const AccessDeniedScreen = ({ onGoHome }) => {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-full bg-red-50 p-6 text-red-600 shadow-sm"
      >
        <ShieldAlert className="h-16 w-16" />
      </motion.div>
      
      <h2 className="mt-8 text-3xl font-black text-slate-900 tracking-tight">
        Acceso Restringido
      </h2>
      
      <p className="mt-4 max-w-md text-slate-500 text-lg">
        No tienes los permisos necesarios para acceder a este módulo. 
        Solicita autorización a un administrador para habilitar esta funcionalidad.
      </p>

      <div className="mt-10">
        <button
          onClick={() => onGoHome && onGoHome()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all font-bold active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
          Regresar al Inicio
        </button>
      </div>
    </div>
  );
};

export default AccessDeniedScreen;
