import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Loader2, 
  AlertCircle, 
  Zap, 
  Calculator, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { apiService } from '../services/api';
import { getLoadingMessage } from '../utils/ui-messages';
import { StatusAlert, Money } from '../components/UI';

const TarifaScreen = ({ alert, setAlert }) => {
  const [tarifa, setTarifa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorTarifa, setErrorTarifa] = useState(null);
  const [simMinutes, setSimMinutes] = useState(65);

  const fetchTarifa = async () => {
    setIsLoading(true);
    setErrorTarifa(null);
    try {
      const data = await apiService.getTarifaActiva();
      setTarifa(data);
      setAlert(null);
    } catch (err) {
      console.error("Error cargando tarifa:", err);
      setErrorTarifa(err.message || "No se pudo recuperar la tarifa activa.");
      setAlert({ title: "Error de Conexión", message: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTarifa();
  }, []);

  const handleSave = async () => {
    if (!tarifa) return;
    setAlert(getLoadingMessage("cobrando"));
    try {
      const payload = {
        nombre: tarifa.nombre,
        modo_calculo: tarifa.modo_calculo,
        valor_base: Number(tarifa.valor_base),
        fraccion_minutos: Number(tarifa.fraccion_minutos),
        redondea_hacia_arriba: tarifa.redondea_hacia_arriba,
        configuracion_json: tarifa.configuracion_json
      };
      await apiService.updateTarifaActiva(payload);
      setAlert({ title: "Configuración Guardada", message: "La nueva tarifa se aplicará a todos los tickets pendientes.", type: "success" });
    } catch (err) {
      let msg = err.message;
      if (typeof msg === 'object') {
        msg = JSON.stringify(msg);
      }
      setAlert({ title: "Error de Guardado", message: msg, type: "error" });
    }
  };

  const simulation = useMemo(() => {
    if (!tarifa) return null;
    const base = Number(tarifa.valor_base);
    const fraccion = Number(tarifa.fraccion_minutos);

    if (tarifa.modo_calculo === "BLOQUE_FIJO") {
      const bloques = Math.ceil(simMinutes / fraccion);
      return { total: base * bloques, detalle: `${bloques} bloque(s) de ${fraccion} min` };
    } else if (tarifa.modo_calculo === "BASE_MAS_EXCEDENTE_PROPORCIONAL") {
      const minsExcedentes = Math.max(0, simMinutes - fraccion);
      const valorMinuto = base / fraccion;
      const excedente = Math.round(minsExcedentes * valorMinuto);
      return { total: base + excedente, detalle: `Base (${base}) + ${minsExcedentes} min excedentes (${excedente})` };
    }
    return { total: 0, detalle: "Modo de cálculo no reconocido" };
  }, [tarifa, simMinutes]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
        <p className="text-slate-500 font-medium animate-pulse">Obteniendo configuración activa...</p>
      </div>
    );
  }

  if (errorTarifa || !tarifa) {
    return (
      <div className="mx-auto max-w-2xl p-10 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center justify-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <span className="font-bold">{errorTarifa || "Error de configuración"}</span>
        </div>
        <button onClick={fetchTarifa} className="text-slate-900 font-bold hover:underline">Reintentar conexión</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-slate-400" /> Configuración de Tarifas
          </h1>
          <p className="text-slate-500">Ajuste de parámetros globales de cobro y lógica de cálculo.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <Save className="h-5 w-5" /> Guardar Cambios
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-500" /> Parámetros Base
          </h3>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre de Tarifa</label>
            <input 
              className="h-12 w-full rounded-xl border border-slate-200 px-4 font-bold focus:border-slate-900 outline-none transition-all"
              value={tarifa.nombre}
              onChange={(e) => setTarifa({...tarifa, nombre: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Base (Gs.)</label>
              <input 
                type="number"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 font-black text-lg focus:border-slate-900 outline-none transition-all"
                value={tarifa.valor_base}
                onChange={(e) => setTarifa({...tarifa, valor_base: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fracción (Minutos)</label>
              <input 
                type="number"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 font-black text-lg focus:border-slate-900 outline-none transition-all"
                value={tarifa.fraccion_minutos}
                onChange={(e) => setTarifa({...tarifa, fraccion_minutos: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lógica de Aplicación</label>
            <select 
              className="h-12 w-full rounded-xl border border-slate-200 px-4 font-bold focus:border-slate-900 outline-none transition-all bg-slate-50"
              value={tarifa.modo_calculo}
              onChange={(e) => setTarifa({...tarifa, modo_calculo: e.target.value})}
            >
              <option value="BLOQUE_FIJO">Bloque Fijo (Cobrar bloques completos)</option>
              <option value="BASE_MAS_EXCEDENTE_PROPORCIONAL">Por Minuto (Base + excedente prorrateado)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <input 
              type="checkbox" 
              id="redondeo"
              className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              checked={tarifa.redondea_hacia_arriba}
              onChange={(e) => setTarifa({...tarifa, redondea_hacia_arriba: e.target.checked})}
            />
            <label htmlFor="redondeo" className="text-sm font-bold text-slate-700 cursor-pointer">Redondear excedentes hacia arriba</label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-slate-50 p-8 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-slate-400" /> Simulador de Cálculo
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo de Permanencia</label>
                  <span className="text-sm font-black text-slate-900">{simMinutes} minutos</span>
                </div>
                <input 
                  type="range" min="1" max="480" step="1"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(parseInt(e.target.value))}
                />
              </div>

              <div className="mt-10 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resultado Estimado</span>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">
                  <Money value={simulation?.total || 0} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-400 italic">{simulation?.detalle}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex gap-4 text-blue-800 text-sm">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <p>Los cambios en la tarifa afectarán únicamente a los nuevos cobros realizados a partir de este momento.</p>
          </div>
        </div>
      </div>
      
      {alert && <StatusAlert alert={alert} />}
    </div>
  );
};

export default TarifaScreen;
