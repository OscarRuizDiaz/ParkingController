import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../auth/useAuth';
import { Money } from '../components/UI';
import { getLoadingMessage } from '../utils/ui-messages';

const SupervisionScreen = ({ alert, setAlert }) => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [montoFinal, setMontoFinal] = useState("");
  const [motivo, setMotivo] = useState("");
  const { user } = useAuth();

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.caja_getAbiertas();
      setTurnos(data);
    } catch (err) {
      setAlert({ title: "Error Supervision", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [setAlert]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const handleCierreForzado = async () => {
    if (!selectedTurno || !montoFinal || !motivo) return;

    setAlert(getLoadingMessage("cobrando"));
    try {
      await apiService.caja_cerrarForzado(selectedTurno.id_turno, {
        monto_final_declarado: montoFinal,
        motivo: motivo
      });

      setAlert({
        title: "Cierre Exitoso",
        message: `El turno #${selectedTurno.id_turno} ha sido cerrado administrativamente.`,
        type: "success"
      });

      setShowModal(false);
      setSelectedTurno(null);
      setMontoFinal("");
      setMotivo("");
      fetchTurnos();
    } catch (err) {
      setAlert({ title: "Error en Cierre", message: err.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" /> Supervisión de Cajas
          </h1>
          <p className="text-slate-500">Monitorización global de turnos abiertos y control administrativo.</p>
        </div>
        <button
          onClick={fetchTurnos}
          disabled={loading}
          className="p-3 rounded-xl bg-white border hover:bg-slate-50 transition-all active:scale-95"
          title="Actualizar lista"
        >
          <Zap className={`h-5 w-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 italic text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          Cargando estado global de cajas...
        </div>
      ) : turnos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-200 mb-6" />
          <h3 className="text-xl font-bold text-slate-900">Operación Limpia</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">No se detectaron turnos abiertos en este momento en ninguna sucursal.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase text-slate-400 tracking-widest">
            <div className="col-span-3">Operador</div>
            <div className="col-span-2 text-center">Caja</div>
            <div className="col-span-2 text-center">Apertura</div>
            <div className="col-span-2 text-right">Ventas (Ef.)</div>
            <div className="col-span-3 text-right">Acción</div>
          </div>
          {turnos.map(t => {
            const isOwn = Number(t.id_usuario) === Number(user?.id_usuario);
            return (
              <motion.div
                key={t.id_turno}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`grid grid-cols-12 items-center px-6 py-5 bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${isOwn ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200'}`}
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${isOwn ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {t.usuario_nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {t.usuario_nombre}
                      {isOwn && <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Mí Turno</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">ID #{t.id_turno}</div>
                  </div>
                </div>
                <div className="col-span-2 text-center text-sm font-semibold text-slate-600">
                  {t.nombre_caja}
                </div>
                <div className="col-span-2 text-center text-[11px] font-medium text-slate-500">
                  {new Date(t.fecha_hora_apertura).toLocaleTimeString()}
                </div>
                <div className="col-span-2 text-right font-black text-slate-900">
                  <Money value={t.total_efectivo} />
                </div>
                <div className="col-span-3 text-right">
                  {isOwn ? (
                    <span className="text-xs text-blue-500 font-bold italic px-4 py-2 opacity-60">Operación en curso...</span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTurno(t);
                        setShowModal(true);
                      }}
                      className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-red-100"
                    >
                      Intervenir Cierre
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <ShieldAlert className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900">Cierre Administrativo</h2>
            <p className="mt-2 text-sm text-slate-500 text-center">
              Intervención del turno <span className="font-bold text-slate-900">#{selectedTurno?.id_turno}</span> de <span className="font-bold text-slate-900">{selectedTurno?.usuario_nombre}</span>.
            </p>

            <div className="mt-8 space-y-5">
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-red-800 text-xs">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>Esta es una acción crítica que quedará registrada bajo su firma digital para auditoría de sucursal.</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Efectivo Físico Arqueado (Gs.)</label>
                <input
                  type="number"
                  autoFocus
                  className="h-14 w-full rounded-2xl border-2 border-slate-200 px-6 text-2xl font-black outline-none focus:border-red-600 transition-all"
                  placeholder="0"
                  value={montoFinal}
                  onChange={(e) => setMontoFinal(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Motivo / Justificación</label>
                <textarea
                  rows="3"
                  className="w-full rounded-2xl border-2 border-slate-200 p-4 text-sm font-medium outline-none focus:border-red-600 transition-all resize-none"
                  placeholder="Especifique el motivo de la intervención..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <button
                onClick={handleCierreForzado}
                disabled={!montoFinal || !motivo}
                className="w-full bg-red-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-30"
              >
                PROCEDER CON CIERRE FORZADO 🔒
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTurno(null);
                  setMontoFinal("");
                  setMotivo("");
                }}
                className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
              >
                Cancelar Intervención
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SupervisionScreen;
