import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Loader2, 
  AlertCircle, 
  CarFront,
  ArrowRight
} from 'lucide-react';

const LoginScreen = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError(''); // Limpia error local al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-3xl mb-4 shadow-xl shadow-slate-200">
            <CarFront className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ParkingController</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestión de Estacionamiento Inteligente</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xl shadow-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Acceso al Sistema</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  type="text"
                  autoComplete="username"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-slate-900 focus:bg-white transition-all font-medium"
                  placeholder="Ej: admin"
                  value={username}
                  onChange={handleInputChange(setUsername)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type="password"
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-slate-900 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  disabled={loading}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm font-medium"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 text-lg font-bold hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  INGRESAR 
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
              Nivel de Seguridad V1.5
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-slate-400">
           {/* Mock info for testing */}
           <div className="text-[10px] text-center opacity-50 space-y-1">
              <p className="font-bold uppercase tracking-wider">Credenciales de Prueba:</p>
              <p>admin / admin123  •  supervisor / super123  •  cajero / cajero123</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
