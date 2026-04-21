import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Printer, CheckCircle2 } from 'lucide-react';
import { StatusAlert, SummaryRow, Money } from '../components/UI';

export function PrintableReceipt({ paymentResult }) {
  if (!paymentResult) return null;
  const formatter = new Intl.NumberFormat("es-PY");

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

const ResultadoScreen = ({ paymentResult, onContinueToInvoicing, onResetOperation }) => {
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
            onClick={() => onResetOperation()}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-4 text-slate-400 font-bold hover:bg-white hover:border-slate-400 transition-all"
          >
            Nueva Operación de Caja
          </button>
        </aside>
      </div>

      <PrintableReceipt paymentResult={paymentResult} />
    </div>
  );
};

export default ResultadoScreen;
