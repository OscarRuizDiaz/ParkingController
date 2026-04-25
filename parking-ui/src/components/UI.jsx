import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';

const formatter = new Intl.NumberFormat("es-PY");

export function Money({ value, amount }) {
  const val = value !== undefined ? value : amount;
  const safeValue = Number(val ?? 0);
  const finalValue = Number.isFinite(safeValue) ? safeValue : 0;
  return <span>Gs. {formatter.format(finalValue)}</span>;
}

export function StatusAlert({ alert }) {
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

export function InfoBox({ icon: Icon, label, value, badge = false }) {
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
        ) : value}
      </div>
    </div>
  );
}

export function MetricCard({ title, value, subtitle, emphasize = false }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${emphasize ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-100'}`}>
      <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${emphasize ? 'text-slate-400' : 'text-slate-400'}`}>{title}</div>
      <div className={`text-2xl font-black ${emphasize ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      <div className={`text-[10px] font-bold mt-1 ${emphasize ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</div>
    </div>
  );
}

export function SummaryRow({ label, value, strong = false }) {
  return (
    <div className={`flex justify-between items-center py-1 ${strong ? 'text-slate-900' : 'text-slate-600'}`}>
      <span className={strong ? "font-black uppercase text-xs tracking-wider" : "font-medium"}>{label}</span>
      <span className={strong ? "font-black text-lg" : "font-bold"}>{value}</span>
    </div>
  );
}
