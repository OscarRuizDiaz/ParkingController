import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  Ticket, 
  Calendar, 
  Wallet, 
  CreditCard, 
  Send, 
  MoreHorizontal,
  RefreshCw,
  Search,
  Clock,
  Filter
} from "lucide-react";
import { apiService } from "../services/api";
import { Money } from "../components/UI";
import { mapBackendError } from "../utils/ui-messages";
import { eventBus, EVENTS } from "../utils/eventBus";

const KPICard = ({ title, value, icon: Icon, colorClass, subtitle, isMoney = false }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-1">
          {isMoney ? <Money amount={Number(value || 0)} /> : value}
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-2xl ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export default function DashboardGerencial({ setAlert }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    usuarios_cajeros: [],
    cajas: [],
    sucursales: []
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  const [filters, setFilters] = useState({
    fecha_desde: new Date().toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
    usuario_id: "",
    caja_id: "",
    sucursal: ""
  });

  // Estado para filtros con debounce
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const pollingRef = useRef(null);

  // Efecto para aplicar debounce a los filtros
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters]);

  const loadFiltros = async () => {
    try {
      const res = await apiService.getReporteFiltros();
      setFiltrosDisponibles(res);
    } catch (err) {
      console.error("Error cargando filtros:", err);
    }
  };

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await apiService.getDashboardResumen(debouncedFilters);
      setData(res);
      setLastUpdate(new Date());
    } catch (err) {
      if (err.message === "SESSION_EXPIRED") return;
      if (err.message === "No autorizado para esta operación") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }
      setAlert(mapBackendError(err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedFilters, setAlert]);

  useEffect(() => {
    loadFiltros();
  }, []);

  // Carga cuando cambian los filtros debounced y polling
  useEffect(() => {
    loadDashboard();
    
    // Listener para cambios en tiempo real
    const handleDataChanged = () => loadDashboard(true);
    eventBus.on(EVENTS.DATA_CHANGED, handleDataChanged);
    
    pollingRef.current = setInterval(() => {
      loadDashboard(true);
    }, 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      eventBus.off(EVENTS.DATA_CHANGED, handleDataChanged);
    };
  }, [loadDashboard]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fecha_desde: new Date().toISOString().split('T')[0],
      fecha_hasta: new Date().toISOString().split('T')[0],
      usuario_id: "",
      caja_id: "",
      sucursal: ""
    });
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
        <RefreshCw className="h-12 w-12 text-slate-200 mb-4 animate-spin" />
        <h3 className="text-xl font-black text-slate-900">Cargando Dashboard...</h3>
        <p className="text-slate-500">Estamos recopilando los indicadores en tiempo real.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header y Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            Dashboard Gerencial
            {refreshing && <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />}
          </h2>
          <p className="text-slate-500 font-medium">Indicadores clave de rendimiento operativo.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100">
              <Clock className="h-3 w-3" />
              ACTUALIZADO: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button 
            onClick={() => loadDashboard()}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl font-bold border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-slate-900">
          <Filter className="h-5 w-5" />
          <h3 className="font-bold">Filtros de Búsqueda</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Desde</label>
            <input 
              type="date" 
              name="fecha_desde"
              value={filters.fecha_desde}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:ring-0 rounded-2xl font-bold text-slate-900 p-3 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Hasta</label>
            <input 
              type="date" 
              name="fecha_hasta"
              value={filters.fecha_hasta}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:ring-0 rounded-2xl font-bold text-slate-900 p-3 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Cajero</label>
            <select 
              name="usuario_id"
              value={filters.usuario_id}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:ring-0 rounded-2xl font-bold text-slate-900 p-3 transition-all"
            >
              <option value="">TODOS</option>
              {filtrosDisponibles.usuarios_cajeros.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Caja</label>
            <select 
              name="caja_id"
              value={filters.caja_id}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:ring-0 rounded-2xl font-bold text-slate-900 p-3 transition-all"
            >
              <option value="">TODAS</option>
              {filtrosDisponibles.cajas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Sucursal</label>
            <select 
              name="sucursal"
              value={filters.sucursal}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border-transparent focus:border-slate-900 focus:ring-0 rounded-2xl font-bold text-slate-900 p-3 transition-all"
            >
              <option value="">TODAS</option>
              {filtrosDisponibles.sucursales.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button 
              onClick={clearFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-3.5 rounded-2xl transition-all active:scale-95"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Recaudado" 
          value={Number(data?.total_recaudado || 0)} 
          icon={TrendingUp} 
          colorClass="bg-indigo-50 text-indigo-600"
          isMoney
          subtitle="Ingresos brutos confirmados"
        />
        <KPICard 
          title="Tickets Cobrados" 
          value={data?.cantidad_tickets_cobrados || 0} 
          icon={Ticket} 
          colorClass="bg-emerald-50 text-emerald-600"
          subtitle="Unidades únicas procesadas"
        />
        <KPICard 
          title="Turnos Cerrados" 
          value={data?.cantidad_turnos_cerrados || 0} 
          icon={Calendar} 
          colorClass="bg-amber-50 text-amber-600"
          subtitle="Ciclos operativos finalizados"
        />
        <KPICard 
          title="Promedio x Turno" 
          value={Number(data?.promedio_recaudacion_por_turno || 0)} 
          icon={MoreHorizontal} 
          colorClass="bg-slate-50 text-slate-600"
          isMoney
          subtitle="Rendimiento medio por caja"
        />
      </div>

      {/* Métodos de Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Efectivo" 
          value={Number(data?.total_efectivo || 0)} 
          icon={Wallet} 
          colorClass="bg-green-50 text-green-600"
          isMoney
        />
        <KPICard 
          title="Tarjeta" 
          value={Number(data?.total_tarjeta || 0)} 
          icon={CreditCard} 
          colorClass="bg-blue-50 text-blue-600"
          isMoney
        />
        <KPICard 
          title="Transferencia" 
          value={Number(data?.total_transferencia || 0)} 
          icon={Send} 
          colorClass="bg-purple-50 text-purple-600"
          isMoney
        />
        <KPICard 
          title="Otros" 
          value={Number(data?.total_otros || 0)} 
          icon={MoreHorizontal} 
          colorClass="bg-slate-50 text-slate-400"
          isMoney
        />
      </div>

      {/* Estado sin datos */}
      {data && data.total_recaudado === 0 && data.cantidad_tickets_cobrados === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <Search className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Sin movimientos en el periodo</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Pruebe ajustando el rango de fechas o los filtros de búsqueda.</p>
        </div>
      )}
    </div>
  );
}
