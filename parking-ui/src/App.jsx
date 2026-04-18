import React, { useMemo, useState, useEffect } from "react";
import { apiService } from "./services/api";
import { mapBackendError, getLoadingMessage } from "./utils/ui-messages";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CarFront,
  Clock3,
  Wallet,
  User,
  Building2,
  ScanLine,
  Printer,
  ArrowRight,
  CircleDollarSign,
  Loader2,
  AlertCircle,
  Hash,
  Settings,
  Zap
} from "lucide-react";

const formatter = new Intl.NumberFormat("es-PY");

function Money({ value }) {
  return <span>Gs. {formatter.format(value)}</span>;
}

/**
 * Componente para impresión de ticket térmico.
 * Visible únicamente en modo impresión (CSS media: print).
 */
function PrintableReceipt({ paymentResult }) {
  if (!paymentResult) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white p-4 font-mono text-[10px] leading-tight">
      <div className="text-center border-b border-dashed pb-2 mb-2">
        <h2 className="text-sm font-bold uppercase">ParkingController</h2>
        <p>Servicio de Estacionamiento</p>
        <p>Asunción, Paraguay</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span>{new Date(paymentResult.cobrado_en).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>OPERACIÓN:</span>
          <span className="font-bold">#{paymentResult.id_cobro}</span>
        </div>
        <div className="flex justify-between">
          <span>TICKET:</span>
          <span className="font-bold">{paymentResult.codigo_ticket}</span>
        </div>
        <div className="flex justify-between border-t border-dashed mt-2 pt-2">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold text-xs">Gs. {formatter.format(paymentResult.monto)}</span>
        </div>
        <div className="flex justify-between italic">
          <span>MEDIO PAGO:</span>
          <span>{paymentResult.medio_pago}</span>
        </div>
      </div>
      <div className="mt-4 border-t border-dashed pt-4 text-center">
        <p>CAJERO: {paymentResult.nombre_cajero}</p>
        <p className="mt-2 text-[8px]">ESTA OPERACIÓN NO ES UNA FACTURA VÁLIDA PARA CRÉDITO FISCAL</p>
        <p className="mt-4 font-bold italic underline">¡Gracias por su preferencia!</p>
      </div>
    </div>
  );
}

function StatusAlert({ alert }) {
  if (!alert) return null;

  const configs = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      iconText: "text-green-600",
      icon: CheckCircle2,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconText: "text-amber-600",
      icon: AlertCircle,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconText: "text-red-600",
      icon: AlertTriangle,
    },
    loading: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-800",
      iconText: "text-slate-600",
      icon: Loader2,
      animate: true,
    },
  };

  const config = configs[alert.type] || configs.error;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-start gap-4 rounded-2xl border ${config.bg} ${config.border} p-5 shadow-sm`}
    >
      <div className={`mt-0.5 ${config.iconText}`}>
        <Icon className={`h-6 w-6 ${config.animate ? "animate-spin" : ""}`} />
      </div>
      <div className="flex-1">
        <h3 className={`text-base font-semibold ${config.text}`}>
          {alert.title}
        </h3>
        <p className={`mt-1 text-sm ${config.text} opacity-90`}>
          {alert.message}
        </p>
      </div>
    </motion.div>
  );
}

function AppShell({ children, currentScreen, setCurrentScreen, hasPaymentContext }) {
  const screens = [
    { id: "caja", label: "Caja Principal", restricted: false },
    { id: "resultado", label: "Resumen de Cobro", restricted: true },
    { id: "cliente", label: "Facturación Fiscal", restricted: true },
    { id: "tarifa", label: "Motor Tarifario", restricted: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white p-0">
      <header className="border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ParkingController
            </h1>
            <p className="text-sm text-slate-500">
              Módulo de Caja y Facturación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">
              POS
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
              V1.2
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6 print:block">
        <aside className="col-span-12 lg:col-span-3 print:hidden">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Pantallas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Navegación del flujo operativo.
            </p>

            <div className="mt-5 space-y-2">
              {screens.map((screen) => {
                const isDisabled = screen.restricted && !hasPaymentContext;
                return (
                  <button
                    key={screen.id}
                    onClick={() => !isDisabled && setCurrentScreen(screen.id)}
                    disabled={isDisabled}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${currentScreen === screen.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isDisabled
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-800 hover:bg-slate-100"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      {screen.label}
                      {isDisabled && <Clock3 className="h-3 w-3 opacity-50" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <hr className="my-5" />

            <div className="space-y-4">
              <div className="text-xs font-bold uppercase text-slate-400">Estado de Caja</div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <div className="text-sm font-medium">CAJERO_DEMO - ABIERTA</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-9 print:col-span-12 print:p-0">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="print:opacity-100 print:translate-y-0"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function CajaPrincipal({
  ticket,
  searchCode,
  setSearchCode,
  onSearch,
  medioPago,
  setMedioPago,
  onProcessPayment,
  alert
}) {
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

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
              <div>
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
                    onKeyUp={(e) => e.key === "Enter" && onSearch(searchCode)}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  className="h-12 rounded-xl bg-slate-900 px-8 text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all active:scale-95"
                  onClick={() => onSearch(searchCode)}
                  disabled={alert?.type === "loading" || !searchCode}
                >
                  <span className="inline-flex items-center gap-2">
                    {alert?.type === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </span>
                </button>
              </div>
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
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoBox icon={CarFront} label="Proveedor" value={ticket?.proveedor_origen || "---"} />
              <InfoBox icon={Clock3} label="Ingreso" value={ticket?.fecha_hora_ingreso ? new Date(ticket.fecha_hora_ingreso).toLocaleString() : "---"} />
              <InfoBox icon={Receipt} label="Estado" value={ticket?.estado || "---"} badge={!!ticket} />
              <InfoBox icon={CircleDollarSign} label="Tarifa Actual" value={ticket?.detalle_calculo?.tarifa_aplicada ? `Gs. ${formatter.format(ticket.detalle_calculo.tarifa_aplicada)}` : "---"} />
            </div>

            <hr className="my-6 border-slate-100" />

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Minutos" value={ticket?.minutos_calculados ?? "0"} subtitle="Permanencia" />
              <MetricCard title="Bloques" value={ticket?.bloques ?? "0"} subtitle="Cálculo base" />
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
                  <button
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200 transition-all font-semibold active:scale-95"
                    onClick={() => setShowConfirm(true)}
                    disabled={!ticket || ticket.estado === "COBRADO" || ticket.estado === "FACTURADO" || alert?.type === "loading"}
                  >
                    Confirmar Cobro
                  </button>
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
}

function ResultadoScreen({ paymentResult, onContinueToInvoicing }) {
  if (!paymentResult) {
    return (
      <div className="rounded-2xl border bg-white p-10 shadow-sm text-center">
        <StatusAlert
          alert={{
            title: "Sin datos de cobro",
            message: "No hay una operación de cobro registrada para mostrar. Primero debe procesar un ticket.",
            type: "warning"
          }}
        />
        <p className="mt-6 text-sm text-slate-500">
          Esta pantalla se activa automáticamente después de confirmar un pago exitoso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-1">
        <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm print:border-none print:shadow-none">
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <StatusAlert
              alert={{
                title: "Cobro registrado correctamente",
                message: "La operación fue guardada con éxito. El ticket ha sido marcado como cobrado.",
                type: "success"
              }}
            />

            <div className="grid w-full max-w-xl gap-3 rounded-2xl bg-slate-50 p-6 text-left md:grid-cols-2 mt-6 print:hidden">
              <SummaryRow label="Ticket Original" value={paymentResult.codigo_ticket || "---"} />
              <SummaryRow label="Importe Guaraníes" value={<Money value={paymentResult.monto || 0} />} strong />
              <SummaryRow label="Forma de Pago" value={paymentResult.medio_pago} />
              <SummaryRow label="Cajero Responsable" value={paymentResult.nombre_cajero} />
              <SummaryRow label="ID de Operación" value={`#${paymentResult.id_cobro}`} />
              <SummaryRow label="Marca de Tiempo" value={new Date(paymentResult.cobrado_en).toLocaleString()} />
            </div>

            <div className="flex flex-wrap gap-4 pt-8 print:hidden">
              <button
                className="rounded-2xl bg-blue-600 px-8 py-4 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all font-bold flex items-center gap-3 active:scale-95"
                onClick={() => onContinueToInvoicing()}
              >
                <ArrowRight className="h-5 w-5" />
                Continuar a Facturación Fiscal
              </button>
              <button
                className="rounded-2xl border-2 border-slate-200 px-6 py-4 text-slate-700 hover:bg-slate-50 transition-all font-bold flex items-center gap-3 active:scale-95"
                onClick={() => window.print()}
              >
                <Printer className="h-5 w-5" />
                Imprimir Comprobante (No Fiscal)
              </button>
            </div>
          </div>
        </div>

        <aside className="print:hidden space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Resumen de Caja</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-blue-50 p-4 text-blue-700 font-medium">
                La liquidación <strong>#{paymentResult.id_liquidacion}</strong> ha sido cerrada. El ticket está listo para ser facturado si el cliente lo solicita.
              </div>
              <div className="flex items-center gap-2 italic text-slate-500">
                <Printer className="h-4 w-4" />
                <span>Utilice papel térmico 80mm</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-4 text-slate-400 font-bold hover:bg-white hover:border-slate-400 transition-all"
          >
            Nueva Operación de Caja
          </button>
        </aside>
      </div>

      {/* Componente oculto para impresión */}
      <PrintableReceipt paymentResult={paymentResult} />
    </div>
  );
}

function TarifaScreen({ alert, setAlert }) {
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
      setAlert(null); // Limpiar alertas globales si la carga es exitosa
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
      setAlert({ title: "Error de Guardado", message: err.message, type: "error" });
    }
  };

  const simulation = useMemo(() => {
    if (!tarifa) return null;
    const base = Number(tarifa.valor_base);
    const fraccion = Number(tarifa.fraccion_minutos);

    if (tarifa.modo_calculo === "BLOQUE_FIJO") {
      const bloques = Math.ceil(simMinutes / fraccion);
      return { total: base * bloques, detalle: `${bloques} bloque(s) de ${fraccion} min` };
    } else {
      const minsExcedentes = Math.max(0, simMinutes - fraccion);
      const valorMinuto = base / fraccion;
      const excedente = Math.round(minsExcedentes * valorMinuto);
      return { total: base + excedente, detalle: `Base (${base}) + ${minsExcedentes} min excedentes (${excedente})` };
    }
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
        <p className="text-slate-500 mb-8">No pudimos conectar con el motor tarifario. Verifique que el servidor esté en línea.</p>
        <button
          onClick={fetchTarifa}
          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold hover:shadow-lg transition-all active:scale-95"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Motor Tarifario</h1>
          <p className="text-slate-500">Configure las reglas de cálculo de importe para el estacionamiento.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" /> Parámetros Base
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Nombre de Tarifa</label>
              <input
                className="h-12 w-full rounded-xl border border-slate-200 px-4 font-medium outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                value={tarifa.nombre || ""}
                onChange={(e) => setTarifa({ ...tarifa, nombre: e.target.value })}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Monto Base (Gs)</label>
                <input
                  type="number"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                  value={tarifa.valor_base || 0}
                  onChange={(e) => setTarifa({ ...tarifa, valor_base: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Bloque Base (Min)</label>
                <input
                  type="number"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                  value={tarifa.fraccion_minutos || 0}
                  onChange={(e) => setTarifa({ ...tarifa, fraccion_minutos: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Método de Cálculo</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "BLOQUE_FIJO", label: "Bloque Fijo (Redondeo arriba)", desc: "40 min = 1 bloque, 61 min = 2 bloques" },
                  { id: "BASE_MAS_EXCEDENTE_PROPORCIONAL", label: "Base + Excedente Proporcional", desc: "Base por 1er bloque + cargo por cada min adicional" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTarifa({ ...tarifa, modo_calculo: mode.id })}
                    className={`p-4 text-left rounded-2xl border-2 transition-all ${tarifa.modo_calculo === mode.id ? "border-slate-900 bg-slate-50" : "border-slate-100 hover:border-slate-200"}`}
                  >
                    <div className="font-bold text-slate-900">{mode.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-amber-400" /> Simulador en Vivo
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Tiempo de Estancia (Minutos)</label>
                <input
                  type="range" min="1" max="300"
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(e.target.value)}
                />
                <div className="mt-2 text-4xl font-black text-amber-400">{simMinutes} <span className="text-lg text-slate-400 font-bold uppercase tracking-widest">MIN</span></div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monto a Cobrar Estimaudo</div>
                <div className="text-5xl font-black tracking-tighter"><Money value={simulation?.total || 0} /></div>
                <div className="mt-2 text-sm text-slate-400 font-medium italic">Regla: {simulation?.detalle}</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50 text-slate-500 text-sm italic">
            <AlertCircle className="h-5 w-5 mb-3 text-slate-400" />
            Esta configuración es global y afecta a todos los turnos abiertos. Se recomienda realizar cambios de tarifa fuera de horario pico para evitar discrepancias de pre-vvisualización en cajas activas.
          </div>
        </div>
      </div>

      {alert && <StatusAlert alert={alert} />}
    </div>
  );
}

function ClienteScreen({ paymentResult, facturaResult, onInvoiceSuccess, alert, setAlert }) {
  const [docType, setDocType] = useState("CI");
  const [docNumber, setDocNumber] = useState("");
  const [clientData, setClientData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", direccion: "", telefono: "" });

  const handleSearchClient = async () => {
    if (!docNumber) return;
    setIsSearching(true);
    try {
      const data = await apiService.buscarCliente(docType, docNumber);
      if (data) {
        setClientData(data);
        setIsNewClient(false);
      } else {
        setClientData(null);
        setIsNewClient(true);
      }
    } catch (err) {
      console.error("Error buscando cliente:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!paymentResult) return;

    const payload = {
      id_cobro: paymentResult.id_cobro,
      tipo_documento: docType,
      numero_documento: docNumber,
      nombre_razon_social: isNewClient ? formData.nombre : clientData.nombre_razon_social,
      condicion_venta: "CONTADO"
    };

    setAlert(getLoadingMessage("cobrando")); // Reutilizamos mensaje de cobro (facturando)

    try {
      const res = await apiService.facturar(payload);
      onInvoiceSuccess(res);
      setAlert({
        title: "Factura Generada ✓",
        message: `Comprobante ${res.numero_factura} registrado con éxito.`,
        type: "success"
      });
    } catch (err) {
      setAlert(mapBackendError(err));
    }
  };

  if (!paymentResult) return <ResultadoScreen />;

  // Cálculo seguro o valores de backend
  const fiscalDetail = useMemo(() => {
    if (facturaResult) {
      return {
        base: Number(facturaResult.total) - Number(facturaResult.iva_10),
        iva: Number(facturaResult.iva_10),
        total: Number(facturaResult.total)
      };
    }
    const total = Number(paymentResult.monto);
    const iva = Math.round(total / 11);
    const base = total - iva;
    return { base, iva, total };
  }, [paymentResult, facturaResult]);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-slate-900 p-3 rounded-2xl text-white">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Módulo de Facturación</h2>
            <p className="text-sm text-slate-500">Gestión de datos fiscales y emisión de comprobantes oficiales.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-[150px_1fr_auto]">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo Doc.</label>
              <select
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold focus:ring-2 focus:ring-slate-900/5 transition-all"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="CI">CI</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Número Documento</label>
              <input
                className="h-12 w-full rounded-xl border border-slate-200 px-4 font-mono text-lg focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                onBlur={handleSearchClient}
                placeholder="Sin puntos ni guiones"
              />
            </div>

            <div className="flex items-end">
              <button
                className="h-12 rounded-xl border-2 border-slate-900 px-6 font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                onClick={handleSearchClient}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isNewClient ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-6 rounded-2xl bg-amber-50 border border-amber-100 italic">
                <div className="flex items-center gap-2 text-amber-900 font-bold not-italic mb-2">
                  <AlertCircle className="h-5 w-5" /> Alta Rápida de Cliente
                </div>
                <div className="grid gap-4">
                  <input
                    placeholder="Nombre Completo / Razón Social"
                    className="h-12 w-full rounded-xl border border-amber-200 px-4 not-italic font-medium bg-white"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </motion.div>
            ) : clientData ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold">
                    {clientData.nombre_razon_social.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-blue-900 text-lg">{clientData.nombre_razon_social}</div>
                    <div className="text-blue-600 text-sm font-medium">{clientData.tipo_documento}: {clientData.numero_documento}</div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {(alert || facturaResult) && <StatusAlert alert={alert} />}

          <div className="pt-4 flex gap-4">
            <button
              className="flex-1 rounded-2xl bg-slate-900 py-4 text-white font-bold text-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-slate-200"
              onClick={handleCreateInvoice}
              disabled={(!clientData && !isNewClient) || (isNewClient && !formData.nombre) || alert?.type === "loading" || !!facturaResult}
            >
              {facturaResult ? "FACTURA EMITIDA ✓" : "Emitir Factura (IVA 10%)"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Concepto de Facturación</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center text-slate-500 font-medium pb-2 border-b border-slate-50">
              <span>ID Cobro Asociado</span>
              <span className="text-slate-900">#{paymentResult.id_cobro}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium pb-2 border-b border-slate-50">
              <span>Base Imponible</span>
              <Money value={fiscalDetail.base} />
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>IVA (10%)</span>
              <Money value={fiscalDetail.iva} />
            </div>
            <div className="mt-6 pt-6 border-t-2 border-slate-900">
              <SummaryRow label="TOTAL FACTURA" value={<Money value={fiscalDetail.total} />} strong />
            </div>
          </div>

          {facturaResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Nro Factura</span>
                <span className="font-bold text-slate-900">{facturaResult.numero_factura}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Fecha EM</span>
                <span className="font-bold text-slate-900">{new Date(facturaResult.fecha_emision || new Date()).toLocaleDateString()}</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-slate-500 text-xs text-center border border-slate-100">
          <p>La facturación fiscal descarga el crédito impositivo al cliente. Este proceso es final y oficial.</p>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, badge = false }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-300">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-base font-bold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap">
        {badge ? (
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] text-white tracking-widest uppercase">
            {value}
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, emphasize = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${emphasize ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" : "bg-white border-slate-100"
        }`}
    >
      <div className={emphasize ? "text-xs font-bold text-slate-400 uppercase" : "text-xs font-bold text-slate-400 uppercase"}>
        {title}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tighter">{value}</div>
      <div className={emphasize ? "mt-1 text-xs text-slate-400 font-medium" : "mt-1 text-xs text-slate-500 font-medium"}>
        {subtitle}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={strong ? "text-xl font-black text-slate-900 tracking-tight" : "text-base font-bold text-slate-800"}>
        {value}
      </span>
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("caja");
  const [ticket, setTicket] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchCode, setSearchCode] = useState("");
  const [medioPago, setMedioPago] = useState("EFECTIVO");
  const [paymentResult, setPaymentResult] = useState(null);
  const [facturaResult, setFacturaResult] = useState(null);

  // Limpieza de estado al navegar
  useEffect(() => {
    setAlert(null);
    if (currentScreen === "caja") {
      setTicket(null);
      setSearchCode("");
      setAlert(null);
      setPaymentResult(null);
      setFacturaResult(null);
    }
  }, [currentScreen]);

  const handleSearch = async (codigo) => {
    if (!codigo) return;
    setAlert(getLoadingMessage("buscando"));
    setTicket(null);

    try {
      const ticketInfo = await apiService.getTicket(codigo);
      const simulacion = await apiService.simulateTicket(codigo);
      setTicket({ ...ticketInfo, ...simulacion });
      setAlert(null);
    } catch (err) {
      setAlert(mapBackendError(err.message || err.detail || err));
      console.error("Error en búsqueda:", err);
    }
  };

  const handleProcessPayment = async () => {
    if (!ticket) return false;
    setAlert(getLoadingMessage("cobrando"));

    try {
      const result = await apiService.processPayment(ticket.codigo_ticket, medioPago);
      setPaymentResult(result);
      setFacturaResult(null); // Limpiar factura previa si existe

      setAlert({
        title: "Cobro registrado correctamente",
        message: "La operación fue registrada en caja y el ticket quedó en estado COBRADO.",
        type: "success"
      });

      setCurrentScreen("resultado");
      return true;
    } catch (err) {
      setAlert(mapBackendError(err.message || err.detail || err));
      return false;
    }
  };

  const handleInvoiceSuccess = (result) => {
    setFacturaResult(result);
    // Podríamos opcionalmente navegar a una pantalla de "Factura Exitosa" 
    // pero por ahora el mensaje de éxito en ClienteScreen es suficiente.
  };

  const content = useMemo(() => {
    switch (currentScreen) {
      case "resultado":
        return (
          <ResultadoScreen
            paymentResult={paymentResult}
            onContinueToInvoicing={() => setCurrentScreen("cliente")}
          />
        );
      case "cliente":
        return (
          <ClienteScreen
            paymentResult={paymentResult}
            facturaResult={facturaResult}
            onInvoiceSuccess={handleInvoiceSuccess}
            alert={alert}
            setAlert={setAlert}
          />
        );
      case "tarifa":
        return <TarifaScreen alert={alert} setAlert={setAlert} />;
      case "caja":
      default:
        return (
          <CajaPrincipal
            ticket={ticket}
            searchCode={searchCode}
            setSearchCode={setSearchCode}
            onSearch={handleSearch}
            medioPago={medioPago}
            setMedioPago={setMedioPago}
            onProcessPayment={handleProcessPayment}
            alert={alert}
          />
        );
    }
  }, [currentScreen, ticket, searchCode, medioPago, paymentResult, facturaResult, alert]);

  return (
    <AppShell
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
      hasPaymentContext={!!paymentResult}
    >
      {content}
    </AppShell>
  );
}