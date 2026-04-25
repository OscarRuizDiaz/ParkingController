import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  DoorClosed, 
  Receipt, 
  DoorOpen, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { apiService } from '../services/api';
import { PermissionGate } from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/constants/permissions';
import { SummaryRow, Money } from '../components/UI';

const TurnoScreen = ({ turnoActual, resumen, onTurnoChanged, onRefreshResumen, onCierreSuccess, alert, setAlert }) => {
  const [opening, setOpening] = useState(false);
  const [montoInicial, setMontoInicial] = useState(50000);
  const [showCierre, setShowCierre] = useState(false);
  const [montoFinal, setMontoFinal] = useState("");
  const [cajasDisponibles, setCajasDisponibles] = useState([]);
  const [selectedCajaId, setSelectedCajaId] = useState("");
  const [loadingCajas, setLoadingCajas] = useState(false);

  useEffect(() => {
    const fetchCajas = async () => {
      setLoadingCajas(true);
      try {
        const data = await apiService.maestros_getCajasDisponibles();
        setCajasDisponibles(data);
        if (data.length > 0 && !selectedCajaId) {
          setSelectedCajaId(data[0].id_caja.toString());
        }
      } catch (err) {
        console.error("Error al cargar cajas:", err);
      } finally {
        setLoadingCajas(false);
      }
    };
    if (!turnoActual) fetchCajas();
  }, [turnoActual, selectedCajaId]);

  const handleOpen = async () => {
    if (!selectedCajaId) return;
    setOpening(true);
    try {
      const res = await apiService.caja_abrir(selectedCajaId, montoInicial);
      onTurnoChanged(res);
      onRefreshResumen();
    } catch (err) {
      setAlert({ title: "Error al abrir caja", message: err.message, type: "error" });
    } finally {
      setOpening(false);
    }
  };

  const handleClose = async () => {
    if (!montoFinal) return;
    try {
      const res = await apiService.caja_cerrar(montoFinal);
      onCierreSuccess(res);
      // El estado global lo limpia App via onCierreSuccess
    } catch (err) {
      setAlert({ title: "Error al cerrar caja", message: err.message, type: "error" });
    }
  };

  if (!turnoActual) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white mb-4">
              <Calculator className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Apertura de Turno</h2>
            <p className="text-sm text-slate-500 mt-2">Inicie sesión en un punto de venta para operar.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Seleccionar Caja / POS</label>
              {loadingCajas ? (
                <div className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium italic">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando cajas disponibles...
                </div>
              ) : cajasDisponibles.length === 0 ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>No se encontraron cajas disponibles para abrir en esta sucursal. Verifique que no haya turnos olvidados sin cerrar.</p>
                </div>
              ) : (
                <select
                  className="h-14 w-full rounded-2xl border-2 border-slate-200 px-4 text-lg font-bold outline-none focus:border-slate-900 transition-all bg-white"
                  value={selectedCajaId}
                  onChange={(e) => setSelectedCajaId(e.target.value)}
                >
                  {cajasDisponibles.map(c => (
                    <option key={c.id_caja} value={c.id_caja}>{c.nombre} (ID #{c.id_caja})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Fondo Fijo Inicial (Gs.)</label>
              <input
                type="number"
                className="h-14 w-full rounded-2xl border-2 border-slate-200 px-6 text-2xl font-black outline-none focus:border-slate-900 transition-all"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
              />
            </div>

            <button
              disabled={opening || !selectedCajaId || cajasDisponibles.length === 0}
              onClick={handleOpen}
              className="w-full bg-slate-900 text-white rounded-2xl py-5 text-lg font-bold hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {opening ? "Abriendo..." : "ABRIR TURNO POS ✅"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Caja</h1>
          <p className="text-slate-500">Monitoreo y cierre del turno ID #{turnoActual.id_turno}.</p>
        </div>
        <PermissionGate permission={PERMISSIONS.CAJA_CERRAR}>
          <button
            onClick={() => setShowCierre(true)}
            className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <DoorClosed className="h-5 w-5" /> Cerrar Caja
          </button>
        </PermissionGate>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-400" /> Resumen Operativo
          </h3>
          <div className="space-y-4">
            <SummaryRow label="Monto Inicial" value={<Money value={Number(resumen?.monto_inicial || 0)} />} />
            <SummaryRow label="Total Efectivo" value={<Money value={Number(resumen?.total_efectivo || 0)} />} />
            <SummaryRow label="Total Transferencia" value={<Money value={Number(resumen?.total_transferencia || 0)} />} />
            <SummaryRow label="Total Tarjeta" value={<Money value={Number(resumen?.total_tarjeta || 0)} />} />
            <hr className="border-dashed" />
            <SummaryRow label="Gran Total Cobrado" value={<Money value={Number(resumen?.total_cobrado || 0)} />} strong />
            <SummaryRow label="Cantidad Tickets" value={resumen?.cantidad_cobros || 0} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-lg font-bold mb-2">Información del Turno</h3>
            <div className="space-y-3 mt-4 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Usuario</span>
                <span className="font-bold uppercase">{resumen?.usuario_nombre || "Cargando..."}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Apertura</span>
                <span className="font-bold">{resumen?.fecha_hora_apertura ? new Date(resumen.fecha_hora_apertura).toLocaleString() : "---"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Punto de Venta</span>
                <span className="font-bold">{resumen?.nombre_caja || "Principal"}</span>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex gap-4 text-amber-800 text-sm">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <p>Recuerde que al cerrar la caja debe contar el efectivo físico y declararlo para registrar diferencias.</p>
          </div>
        </div>
      </div>

      {(() => {
        const montoInicialNum = Number(resumen?.monto_inicial ?? 0);
        const totalEfectivoNum = Number(resumen?.total_efectivo ?? 0);
        const efectivoSistema = montoInicialNum + totalEfectivoNum;
        const montoFinalNum = Number(montoFinal || 0);
        const diferenciaOperativa = montoFinalNum - efectivoSistema;

        return showCierre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-6">Cierre de Turno</h2>
              <div className="bg-slate-50 p-6 rounded-2xl mb-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Efectivo en Sistema (Ini + Ventas)</span>
                  <span className="font-bold text-slate-800"><Money value={efectivoSistema} /></span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Efectivo Físico Contado</label>
                  <input
                    type="number"
                    autoFocus
                    className="h-14 w-full rounded-2xl border-2 border-slate-200 px-6 text-2xl font-black outline-none focus:border-red-500 transition-all"
                    placeholder="Gs. 0"
                    value={montoFinal}
                    onChange={(e) => setMontoFinal(e.target.value)}
                  />
                </div>
                {montoFinal !== "" && (
                  <div className="flex justify-between p-3 rounded-lg bg-white border border-slate-200 text-sm">
                    <span className="text-slate-500">Diferencia Operativa:</span>
                    <span className={`font-black ${diferenciaOperativa < 0 ? "text-red-600" : "text-green-600"}`}>
                      <Money value={diferenciaOperativa} />
                    </span>
                  </div>
                )}
              </div>
              <div className="grid gap-3">
                <button onClick={handleClose} className="w-full bg-red-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                  CONFIRMAR CIERRE DE CAJA 🔒
                </button>
                <button onClick={() => setShowCierre(false)} className="w-full text-slate-400 font-bold py-2">
                  Continuar Operando
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
};

export default TurnoScreen;
