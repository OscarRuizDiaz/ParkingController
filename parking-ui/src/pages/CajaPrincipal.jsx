import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanLine, 
  Hash, 
  Search, 
  Loader2, 
  AlertCircle, 
  Zap, 
  CarFront, 
  Clock3, 
  Receipt, 
  CircleDollarSign 
} from 'lucide-react';
import { PermissionGate } from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/constants/permissions';
import { StatusAlert, InfoBox, MetricCard, SummaryRow, Money } from '../components/UI';

const CajaPrincipal = ({
  ticket,
  searchCode,
  setSearchCode,
  onSearch,
  medioPago,
  setMedioPago,
  onProcessPayment,
  alert,
  modoCalculo,
  setModoCalculo,
  manualMinutes,
  setManualMinutes,
  turnoActual
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-6 print:hidden">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
          <div className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <ScanLine className="h-5 w-5" />
              Caja principal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingreso del ticket y cálculo de liquidación.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Documento / Código Ticket
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                  <input
                    className="h-12 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                    placeholder="TK-000000"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    onKeyUp={(e) => e.key === "Enter" && onSearch()}
                  />
                </div>
              </div>

              <div className="w-full md:w-44">
                <label className="mb-2 block text-sm font-medium text-slate-700">Modo Cálculo</label>
                <PermissionGate permission={PERMISSIONS.TICKETS_SIMULAR} mode="disable">
                  <select
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-900 disabled:opacity-50"
                    value={modoCalculo}
                    onChange={(e) => setModoCalculo(e.target.value)}
                  >
                    <option value="AUTOMATICO">🕒 AUTOMÁTICO</option>
                    <option value="MANUAL">⌨️ MANUAL</option>
                  </select>
                </PermissionGate>
              </div>

              {modoCalculo === "MANUAL" && (
                <div className="w-full md:w-32">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Minutos</label>
                  <PermissionGate permission={PERMISSIONS.TICKETS_SIMULAR} mode="disable">
                    <input
                      type="number"
                      min="1"
                      className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-bold outline-none focus:border-slate-900 disabled:opacity-50"
                      placeholder="Min."
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                    />
                  </PermissionGate>
                </div>
              )}

              <PermissionGate permission={PERMISSIONS.TICKETS_BUSCAR} mode="disable">
                <button
                  className="h-12 rounded-xl bg-slate-900 px-8 text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all active:scale-95 mb-0.5"
                  onClick={() => onSearch()}
                  disabled={alert?.type === "loading" || !turnoActual || !searchCode || (modoCalculo === "MANUAL" && !manualMinutes)}
                >
                  <span className="inline-flex items-center gap-2">
                    {alert?.type === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Consultar
                  </span>
                </button>
              </PermissionGate>
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {alert && <StatusAlert alert={alert} />}
              </AnimatePresence>
              {ticket?.modo_visualizacion === "HISTORICO" && !alert && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-800 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Valores congelados al momento del cobro. Cálculo histórico.</span>
                </motion.div>
              )}
              {ticket?.detalle_calculo?.origen_calculo === "MANUAL" && !alert && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800 text-sm font-medium">
                  <Zap className="h-5 w-5 shrink-0" />
                  <span>Cálculo forzado de forma manual - Minutos ingresados por el operador.</span>
                </motion.div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoBox icon={CarFront} label="Proveedor" value={ticket?.proveedor_origen || "---"} />
              <InfoBox icon={Clock3} label="Ingreso" value={ticket?.fecha_hora_ingreso ? new Date(ticket.fecha_hora_ingreso).toLocaleString() : "---"} />
              <InfoBox icon={Receipt} label="Estado" value={ticket?.estado || "---"} badge={!!ticket} />
              <InfoBox icon={CircleDollarSign} label="Tarifa Actual" value={ticket?.detalle_calculo?.modo_calculo || "---"} />
            </div>

            <hr className="my-6 border-slate-100" />

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Minutos" value={ticket?.minutos_calculados ?? "0"} subtitle="Permanencia" />
              <MetricCard title="Bloques" value={ticket ? `${ticket.bloques}` : "0"} subtitle="Cálculo base" />
              <MetricCard title="Total Cobro" value={<Money value={ticket?.monto_a_cobrar ?? 0} />} subtitle="Importe a cobrar" emphasize />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <label className="mb-2 block text-sm font-semibold text-slate-800">Medio de pago</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-slate-900"
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                >
                  <option value="EFECTIVO">💵 EFECTIVO</option>
                  <option value="TRANSFERENCIA">📱 TRANSFERENCIA</option>
                  <option value="TARJETA">💳 TARJETA</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col justify-center">
                <div className="mb-2 text-sm font-semibold text-slate-800">Acciones Operativas</div>
                <div className="flex gap-3">
                  <PermissionGate permission={PERMISSIONS.TICKETS_COBRAR} mode="disable">
                    <button
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200 transition-all font-semibold active:scale-95"
                      onClick={() => setShowConfirm(true)}
                      disabled={!ticket || ticket.estado === "COBRADO" || ticket.estado === "FACTURADO" || alert?.type === "loading"}
                    >
                      Confirmar Cobro
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Resumen de Liquidación</h3>
          <p className="mt-1 text-sm text-slate-500 border-b border-slate-100 pb-4">
            Pre-visualización de la operación en curso.
          </p>

          <div className="mt-5 space-y-4 text-sm font-medium">
            <SummaryRow label="Ticket" value={ticket?.codigo_ticket || "---"} />
            <SummaryRow label="Tiempo Estimado" value={ticket ? `${ticket.minutos_calculados} min` : "---"} />
            <SummaryRow label="Total Bloques" value={ticket ? `${ticket.bloques}` : "---"} />
            <div className="border-t border-slate-100 pt-4 mt-4">
              <SummaryRow label="Monto a Recibir" value={<Money value={ticket?.monto_a_cobrar || 0} />} strong />
            </div>
            <SummaryRow label="Medio Elegido" value={medioPago} />
          </div>

          <div className="mt-8 rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800 text-xs flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>Valide el ticket físico antes de proceder. Una vez confirmado, el ticket queda bloqueado para facturación fiscal.</p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 text-center">Registrar Ingreso</h3>
            <p className="mt-2 text-sm text-slate-500 text-center">
              Confirme la recepción del dinero según el monto indicado.
            </p>

            <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-6">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 mb-1">MONTO TOTAL</span>
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  <Money value={ticket?.monto_a_cobrar || 0} />
                </span>
                <span className="mt-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">{medioPago}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                onClick={async () => {
                  const success = await onProcessPayment();
                  if (success) setShowConfirm(false);
                }}
                disabled={alert?.type === "loading"}
              >
                {alert?.type === "loading" ? "Procesando..." : "SÍ, REGISTRAR COBRO ✅"}
              </button>
              <button
                className="w-full rounded-2xl border-2 border-slate-100 py-3 font-semibold text-slate-400 hover:bg-slate-50"
                onClick={() => setShowConfirm(false)}
                disabled={alert?.type === "loading"}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CajaPrincipal;
