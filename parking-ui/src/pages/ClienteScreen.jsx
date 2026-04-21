import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { getLoadingMessage } from '../utils/ui-messages';
import { StatusAlert, SummaryRow, Money } from '../components/UI';
import ResultadoScreen from './ResultadoScreen';

const ClienteScreen = ({ paymentResult, facturaResult, onInvoiceSuccess, alert, setAlert }) => {
  const [docType, setDocType] = useState("CI");
  const [docNumber, setDocNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [formData, setFormData] = useState({ nombre: "" });

  const handleSearchClient = async () => {
    if (!docNumber) return;
    setIsSearching(true);
    setAlert(null);
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

    setAlert(getLoadingMessage("cobrando"));

    try {
      const res = await apiService.facturar(payload);
      onInvoiceSuccess(res);
      setAlert({
        title: "Factura Generada ✓",
        message: `Comprobante ${res.numero_factura} registrado con éxito.`,
        type: "success"
      });
    } catch (err) {
      setAlert({ title: "Error Facturación", message: err.message, type: "error" });
    }
  };

  if (!paymentResult) return <ResultadoScreen />;

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

          {alert && <StatusAlert alert={alert} />}

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
};

export default ClienteScreen;
