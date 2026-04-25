import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calculator, 
  Receipt, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock
} from "lucide-react";
import { apiService } from "../services/api";
import { Money } from "../components/UI";
import { mapBackendError } from "../utils/ui-messages";
import { eventBus, EVENTS } from "../utils/eventBus";

const Badge = ({ children }) => {
  const styles = {
    ABIERTO: "bg-green-50 text-green-700 border-green-100",
    CERRADO: "bg-slate-100 text-slate-700 border-slate-200",
    ANULADO: "bg-red-50 text-red-700 border-red-100",
    EFECTIVO: "bg-emerald-50 text-emerald-700 border-emerald-100",
    TARJETA: "bg-blue-50 text-blue-700 border-blue-100",
    TRANSFERENCIA: "bg-purple-50 text-purple-700 border-purple-100"
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles[children] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
      {children}
    </span>
  );
};

const Pagination = ({ total, limit, offset, onPageChange }) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm mt-6">
      <div className="text-sm font-bold text-slate-500">
        Mostrando <span className="text-slate-900">{Math.min(offset + 1, total)}</span> a <span className="text-slate-900">{Math.min(offset + limit, total)}</span> de <span className="text-slate-900">{total}</span> registros
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(offset - limit)}
          disabled={offset === 0}
          className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-black text-slate-900 px-4">
          PÁGINA {currentPage} DE {totalPages}
        </div>
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default function Reportes({ setAlert }) {
  const [activeTab, setActiveTab] = useState('turnos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ items: [], total: 0 });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    usuarios_cajeros: [],
    cajas: [],
    medios_pago: []
  });

  const [filters, setFilters] = useState({
    fecha_desde: new Date().toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
    usuario_id: "",
    caja_id: "",
    estado: "",
    medio_pago: "",
    limit: 50,
    offset: 0
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

  const loadReporte = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      let res;
      if (activeTab === 'turnos') {
        res = await apiService.getReporteTurnos(debouncedFilters);
      } else {
        res = await apiService.getReporteCobros(debouncedFilters);
      }
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
  }, [activeTab, debouncedFilters, setAlert]);

  useEffect(() => {
    loadFiltros();
  }, []);

  // Carga cuando cambian los filtros debounced y polling
  useEffect(() => {
    loadReporte();
    
    // Listener para cambios en tiempo real
    const handleDataChanged = () => loadReporte(true);
    eventBus.on(EVENTS.DATA_CHANGED, handleDataChanged);
    
    pollingRef.current = setInterval(() => {
      loadReporte(true);
    }, 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      eventBus.off(EVENTS.DATA_CHANGED, handleDataChanged);
    };
  }, [loadReporte]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  const clearFilters = () => {
    setFilters({
      fecha_desde: new Date().toISOString().split('T')[0],
      fecha_hasta: new Date().toISOString().split('T')[0],
      usuario_id: "",
      caja_id: "",
      estado: "",
      medio_pago: "",
      limit: 50,
      offset: 0
    });
  };

  const renderTurnosTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cajero</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Caja</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Apertura</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cierre</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Inicial</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cobrado</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Diferencia</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.items.map(item => (
            <tr key={`turno-${item.turno_id}`} className="hover:bg-slate-50/50 transition-colors group">
              <td className="py-4 px-4 font-black text-slate-900 text-sm">#{item.turno_id}</td>
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{item.usuario_nombre}</span>
                  <span className="text-[10px] text-slate-400 font-medium">ID: {item.usuario_id}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm font-medium text-slate-600">{item.caja_nombre}</td>
              <td className="py-4 px-4">
                <div className="text-xs font-bold text-slate-700">{new Date(item.fecha_apertura).toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-400">{new Date(item.fecha_apertura).toLocaleTimeString()}</div>
              </td>
              <td className="py-4 px-4">
                {item.fecha_cierre ? (
                  <>
                    <div className="text-xs font-bold text-slate-700">{new Date(item.fecha_cierre).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">{new Date(item.fecha_cierre).toLocaleTimeString()}</div>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-indigo-500">EN CURSO</span>
                )}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-600 text-sm"><Money amount={Number(item.monto_inicial || 0)} /></td>
              <td className="py-4 px-4 text-right font-black text-slate-900 text-sm"><Money amount={Number(item.total_cobrado || 0)} /></td>
              <td className={`py-4 px-4 text-right font-bold text-sm ${item.diferencia < 0 ? 'text-red-500' : item.diferencia > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                {item.diferencia !== null ? <Money amount={Number(item.diferencia || 0)} /> : '-'}
              </td>
              <td className="py-4 px-4"><Badge>{item.estado}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCobrosTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cajero</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Caja</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medio Pago</th>
            <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.items.map(item => (
            <tr key={`cobro-${item.cobro_id}-${item.ticket_id}`} className="hover:bg-slate-50/50 transition-colors group">
              <td className="py-4 px-4 font-black text-slate-900 text-sm">#{item.cobro_id}</td>
              <td className="py-4 px-4">
                <span className="bg-slate-900 text-white px-2 py-1 rounded-lg text-[10px] font-black">{item.codigo_ticket}</span>
              </td>
              <td className="py-4 px-4">
                <div className="text-xs font-bold text-slate-700">{new Date(item.fecha_cobro).toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-400">{new Date(item.fecha_cobro).toLocaleTimeString()}</div>
              </td>
              <td className="py-4 px-4 text-sm font-bold text-slate-900">{item.usuario_nombre}</td>
              <td className="py-4 px-4 text-sm font-medium text-slate-600">{item.caja_nombre}</td>
              <td className="py-4 px-4"><Badge>{item.medio_pago}</Badge></td>
              <td className="py-4 px-4 text-right font-black text-slate-900 text-sm"><Money amount={Number(item.monto || 0)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            Reportes Históricos
            {refreshing && <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />}
          </h2>
          <p className="text-slate-500 font-medium">Historial detallado de operaciones y transacciones.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100">
              <Clock className="h-3 w-3" />
              ACTUALIZADO: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button 
            onClick={() => loadReporte()}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl font-bold border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => { setActiveTab('turnos'); setFilters(f => ({ ...f, offset: 0 })); }}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'turnos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Calculator className="h-4 w-4 inline-block mr-2" />
          Reporte de Turnos
        </button>
        <button
          onClick={() => { setActiveTab('cobros'); setFilters(f => ({ ...f, offset: 0 })); }}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'cobros' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Receipt className="h-4 w-4 inline-block mr-2" />
          Reporte de Cobros
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Desde</label>
            <input type="date" name="fecha_desde" value={filters.fecha_desde} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Hasta</label>
            <input type="date" name="fecha_hasta" value={filters.fecha_hasta} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Cajero</label>
            <select name="usuario_id" value={filters.usuario_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3">
              <option value="">TODOS</option>
              {filtrosDisponibles.usuarios_cajeros.map(u => <option key={`usuario-${u.id}`} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Caja</label>
            <select name="caja_id" value={filters.caja_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3">
              <option value="">TODAS</option>
              {filtrosDisponibles.cajas.map(c => <option key={`caja-${c.id}`} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {activeTab === 'turnos' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Estado</label>
              <select name="estado" value={filters.estado} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3">
                <option value="">TODOS</option>
                <option value="ABIERTO">ABIERTO</option>
                <option value="CERRADO">CERRADO</option>
                <option value="ANULADO">ANULADO</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Medio Pago</label>
              <select name="medio_pago" value={filters.medio_pago} onChange={handleFilterChange} className="w-full bg-slate-50 border-transparent rounded-2xl font-bold text-sm p-3">
                <option value="">TODOS</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TARJETA">TARJETA</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={clearFilters} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest p-3.5 rounded-2xl transition-all">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && !data.items.length ? (
          <div className="p-20 text-center">
            <RefreshCw className="h-10 w-10 text-slate-200 mb-4 animate-spin mx-auto" />
            <p className="text-slate-500 font-bold">Consultando registros...</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-20 text-center">
            <Search className="h-10 w-10 text-slate-200 mb-4 mx-auto" />
            <p className="text-slate-500 font-bold">No se encontraron resultados</p>
          </div>
        ) : (
          activeTab === 'turnos' ? renderTurnosTable() : renderCobrosTable()
        )}
      </div>

      {/* Paginación */}
      {data.total > 0 && (
        <Pagination 
          total={data.total} 
          limit={filters.limit} 
          offset={filters.offset} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
}
