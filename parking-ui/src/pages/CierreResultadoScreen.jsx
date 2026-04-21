import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Printer, ArrowLeft } from 'lucide-react';
import { SummaryRow, Money } from '../components/UI';

/**
 * Reporte de cierre diseñado para impresión física.
 * Utiliza los campos estandarizados de TurnoCajaResumenResponse.
 */
export function PrintableTurnoReport({ cierreResult }) {
  if (!cierreResult) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white p-8 font-mono text-xs leading-relaxed">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-widest">Informe de Cierre de Caja</h1>
        <p className="mt-1">SISTEMA PARKING CONTROLLER</p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="font-bold">TURNO ID:</span>
          <span>#{cierreResult.id_turno}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">CAJA:</span>
          <span>{cierreResult.nombre_caja}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">CAJERO:</span>
          <span>{cierreResult.usuario_nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">CIERRE:</span>
          <span>{new Date(cierreResult.fecha_hora_cierre).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-black pt-4 space-y-3">
        <div className="flex justify-between">
          <span>MONTO INICIAL:</span>
          <span>Gs. {Number(cierreResult.monto_inicial || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>VENTAS EFECTIVO:</span>
          <span>Gs. {Number(cierreResult.total_efectivo || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-b border-black pb-1">
          <span>TOTAL SISTEMA:</span>
          <span>Gs. {(Number(cierreResult.monto_inicial || 0) + Number(cierreResult.total_efectivo || 0)).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2">
          <span>EFECTIVO DECLARADO:</span>
          <span>Gs. {Number(cierreResult.monto_final || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between italic">
          <span>DIFERENCIA:</span>
          <span>Gs. {Number(cierreResult.diferencia || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-12 pt-12 border-t border-dashed border-slate-300 flex justify-around">
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1"></div>
          <p className="text-[10px]">Firma Cajero</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1"></div>
          <p className="text-[10px]">Firma Supervisor</p>
        </div>
      </div>
    </div>
  );
}

const CierreResultadoScreen = ({ cierreResult, onBackToDashboard }) => {
  if (!cierreResult) return null;

  // Normalización de valores numéricos para evitar NaN
  const montoInicial = Number(cierreResult.monto_inicial || 0);
  const totalEfectivo = Number(cierreResult.total_efectivo || 0);
  const montoFinal = Number(cierreResult.monto_final || 0);
  const diferencia = Number(cierreResult.diferencia || 0);
  const totalSistema = montoInicial + totalEfectivo;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl border bg-white p-10 shadow-sm print:hidden">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Turno Cerrado Correctamente</h2>
          <p className="text-slate-500 mt-2">La sesión de caja ha sido finalizada y los registros fueron persistidos.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Contabilidad de Cierre</h3>
            <SummaryRow label="Monto Apertura" value={<Money value={montoInicial} />} />
            <SummaryRow label="Ventas Efectivo" value={<Money value={totalEfectivo} />} />
            <div className="bg-slate-50 p-4 rounded-2xl">
              <SummaryRow label="Total Esperado" value={<Money value={totalSistema} />} strong />
            </div>
            <SummaryRow label="Efectivo Declarado" value={<Money value={montoFinal} />} strong />
            <div className={`flex justify-between items-center p-4 rounded-2xl border ${diferencia < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
              <span className="font-bold">Diferencia de Arqueo:</span>
              <span className="font-black text-lg"><Money value={diferencia} /></span>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Acciones Finales</h3>
            <div className="grid gap-3">
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-lg shadow-slate-200 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer className="h-5 w-5" /> Imprimir Acta de Cierre
              </button>
              <button
                onClick={onBackToDashboard}
                className="w-full bg-white border-2 border-slate-100 text-slate-400 rounded-2xl py-4 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" /> Volver al Dashboard
              </button>
            </div>
            
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-amber-800 text-xs italic">
              <p>Este informe ya no puede ser modificado. Si existe una diferencia negativa, será auditada por la administración central.</p>
            </div>
          </div>
        </div>
      </div>

      <PrintableTurnoReport cierreResult={cierreResult} />
    </div>
  );
};

export default CierreResultadoScreen;
