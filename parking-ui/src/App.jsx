import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "./services/api";
import { mapBackendError, getLoadingMessage } from "./utils/ui-messages";
import { useAuth } from "./auth/useAuth";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PermissionGate } from "./auth/PermissionGate";
import { PERMISSIONS } from "./auth/constants/permissions";
import { SCREEN_CONFIG, getScreenById } from './config/screens';
import { eventBus, EVENTS } from './utils/eventBus';

// Componentes UI compartidos
import { Money, StatusAlert } from './components/UI';

// Pantallas
import LoginScreen from "./pages/LoginScreen";
import CajaPrincipal from "./pages/CajaPrincipal";
import TurnoScreen from "./pages/TurnoScreen";
import SupervisionScreen from "./pages/SupervisionScreen";
import RBACAdminScreen from "./pages/admin/RBACAdminScreen";
import UsersAdminScreen from "./pages/admin/UsersAdminScreen";
import TarifaScreen from "./pages/TarifaScreen";
import ResultadoScreen from "./pages/ResultadoScreen";
import ClienteScreen from "./pages/ClienteScreen";
import CierreResultadoScreen, { PrintableTurnoReport } from "./pages/CierreResultadoScreen";
import DashboardGerencial from "./pages/DashboardGerencial";
import Reportes from "./pages/Reportes";

import {
  CarFront,
  DoorOpen,
  DoorClosed,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";

/**
 * Shell principal de la aplicación.
 * Gestiona el Header y el Menú Lateral con validación de permisos centralizada.
 */
function AppShell({ children, currentScreen, onNavigate, hasPaymentContext, turnoActual, resumenTurno }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white p-0">
      <header className="border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2 rounded-xl">
              <CarFront className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                ParkingController
              </h1>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                SISTEMA POS & FACTURACIÓN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user?.nombre_completo}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                {user?.nombre_rol}
              </span>
            </div>
            <button
              onClick={logout}
              className="group flex items-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"
              title="Cerrar Sesión"
            >
              <DoorClosed className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6 print:block">
        <aside className="col-span-12 lg:col-span-3 print:hidden">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Menú Operativo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Módulos autorizados para su perfil.
            </p>

            <div className="mt-5 space-y-2">
              {SCREEN_CONFIG
                .filter(s => {
                  const isHidden = s.hiddenMenu;
                  const isRestrictedAndNoContext = s.restricted && !hasPaymentContext;
                  return !isHidden && !isRestrictedAndNoContext;
                })
                .map(item => (
                  <PermissionGate key={item.id} permission={item.permission}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all ${currentScreen === item.id
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                          : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </PermissionGate>
                ))}
            </div>

            <hr className="my-5" />

            <div className="space-y-4">
              <div className="text-xs font-bold uppercase text-slate-400">Estado de Caja</div>
              {turnoActual ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 p-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="text-sm font-bold text-green-900">
                      ID #{turnoActual.id_turno} - ABIERTO
                    </div>
                  </div>
                  {resumenTurno?.nombre_caja && (
                    <div className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 px-1">
                      <DoorOpen className="h-3 w-3" /> {resumenTurno.nombre_caja}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <div className="text-sm font-bold uppercase">Caja Cerrada</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-9 print:col-span-12 print:p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="print:opacity-100 print:translate-y-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("caja");
  const [alert, setAlert] = useState(null);

  // Estados de Caja/Tickets
  const [ticket, setTicket] = useState(null);
  const [searchCode, setSearchCode] = useState("");
  const [medioPago, setMedioPago] = useState("EFECTIVO");
  const [modoCalculo, setModoCalculo] = useState("AUTOMATICO");
  const [manualMinutes, setManualMinutes] = useState(0);

  // Estados de Operación Completa
  const [paymentResult, setPaymentResult] = useState(null);
  const [facturaResult, setFacturaResult] = useState(null);
  const [turnoActual, setTurnoActual] = useState(null);
  const [resumenTurno, setResumenTurno] = useState(null);
  const [cierreResult, setCierreResult] = useState(null);

  // Efecto para limpiar alertas automáticamente
  useEffect(() => {
    if (alert && alert.type !== 'loading') {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchTurnoYResumen = useCallback(async () => {
    try {
      const turno = await apiService.caja_getActual();
      setTurnoActual(turno);
      
      if (turno) {
        try {
          const resumen = await apiService.caja_getResumen();
          console.log("RESUMEN OBTENIDO DESDE BACKEND:", resumen);
          setResumenTurno(resumen);
        } catch (err) {
          setResumenTurno(null);
        }
      } else {
        setResumenTurno(null);
      }
    } catch (err) {
      setTurnoActual(null);
      setResumenTurno(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTurnoYResumen();
    }
  }, [isAuthenticated, fetchTurnoYResumen]);

  const handleResetOperation = useCallback(() => {
    setTicket(null);
    setSearchCode("");
    setAlert(null);
    setPaymentResult(null);
    setFacturaResult(null);
    setManualMinutes(0);
    setModoCalculo("AUTOMATICO");
    setCurrentScreen("caja");
  }, []);

  useEffect(() => {
    setAlert(null);
    if (currentScreen === "caja") {
      setTicket(null);
      setSearchCode("");
      setAlert(null);
      setPaymentResult(null);
      setFacturaResult(null);
      setManualMinutes(0);
      setModoCalculo("AUTOMATICO");
    }
  }, [currentScreen]);

  const handleSearch = async () => {
    if (!turnoActual) {
      setAlert({ title: "Caja Cerrada", message: "Debe abrir caja antes de realizar consultas o cobros.", type: "warning" });
      return;
    }
    const codigo = searchCode;
    if (!codigo) return;

    if (modoCalculo === "MANUAL" && (!manualMinutes || manualMinutes <= 0)) {
      setAlert({
        title: "Minutos Requeridos",
        message: "En modo manual debe ingresar la cantidad de minutos de estancia.",
        type: "warning"
      });
      return;
    }

    setAlert(getLoadingMessage("buscando"));
    setTicket(null);

    try {
      if (modoCalculo === "MANUAL") {
        const simulacion = await apiService.simularManual(codigo, manualMinutes);
        setTicket({
          codigo_ticket: codigo,
          proveedor_origen: "INGRESO_MANUAL",
          fecha_hora_ingreso: new Date().toISOString(),
          estado: "PENDIENTE",
          ...simulacion
        });
      } else {
        const ticketInfo = await apiService.getTicket(codigo);
        const simulacion = await apiService.simulateTicket(codigo);
        setTicket({ ...ticketInfo, ...simulacion });
      }
      setAlert(null);
    } catch (err) {
      setAlert(mapBackendError(err.message || err.detail || err));
    }
  };

  const handleProcessPayment = async () => {
    if (!ticket) return false;
    setAlert(getLoadingMessage("cobrando"));

    try {
      const result = await apiService.processPayment(
        ticket.codigo_ticket,
        medioPago,
        modoCalculo === "MANUAL" ? manualMinutes : null
      );
      setPaymentResult(result);
      setFacturaResult(null);

      setAlert({
        title: "Cobro registrado correctamente",
        message: "La operación fue registrada en caja y el ticket quedó en estado COBRADO.",
        type: "success"
      });

      await fetchTurnoYResumen();
      eventBus.emit(EVENTS.DATA_CHANGED);
      setCurrentScreen("resultado");
      return true;
    } catch (err) {
      setAlert(mapBackendError(err.message || err.detail || err));
      return false;
    }
  };

  const content = useMemo(() => {
    switch (currentScreen) {
      case "resultado":
        return (
          <ResultadoScreen
            paymentResult={paymentResult}
            onContinueToInvoicing={() => setCurrentScreen("cliente")}
            onResetOperation={handleResetOperation}
          />
        );
      case "cliente":
        return (
          <ClienteScreen
            paymentResult={paymentResult}
            facturaResult={facturaResult}
            onInvoiceSuccess={(res) => setFacturaResult(res)}
            alert={alert}
            setAlert={setAlert}
          />
        );
      case "tarifa":
        return <TarifaScreen alert={alert} setAlert={setAlert} />;
      case "supervision":
        return <SupervisionScreen alert={alert} setAlert={setAlert} />;
      case "rbac_admin":
        return <RBACAdminScreen setAlert={setAlert} />;
      case "usuarios":
        return <UsersAdminScreen setAlert={setAlert} />;
      case "dashboard":
        return <DashboardGerencial setAlert={setAlert} />;
      case "reportes":
        return <Reportes setAlert={setAlert} />;
      case "turno":
        return (
          <TurnoScreen
            turnoActual={turnoActual}
            resumen={resumenTurno}
            onTurnoChanged={setTurnoActual}
            onRefreshResumen={async () => {
              await fetchTurnoYResumen();
            }}
            onCierreSuccess={(res) => {
              // Limpiar estados operativos inmediatamente
              setTurnoActual(null);
              setResumenTurno(null);
              setTicket(null);
              // Registrar resultado y navegar
              setCierreResult(res);
              eventBus.emit(EVENTS.DATA_CHANGED);
              setCurrentScreen("cierre_resultado");
            }}
            alert={alert}
            setAlert={setAlert}
          />
        );
      case "cierre_resultado":
        return (
          <CierreResultadoScreen
            cierreResult={cierreResult}
            onBackToDashboard={() => {
              setCierreResult(null);
              setCurrentScreen("caja");
            }}
          />
        );
      case "caja":
      default:
        if (!turnoActual && currentScreen === "caja") {
          return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
              <DoorClosed className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">Caja no Abierta</h3>
              <p className="text-slate-500 mb-8 max-w-sm">Para comenzar a cobrar tickets o realizar simulaciones, primero debe iniciar un turno de caja.</p>
              <button
                onClick={() => setCurrentScreen("turno")}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:shadow-2xl transition-all active:scale-95 flex items-center gap-2"
              >
                Ir a Pantalla de Turnos <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          );
        }
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
            modoCalculo={modoCalculo}
            setModoCalculo={setModoCalculo}
            manualMinutes={manualMinutes}
            setManualMinutes={setManualMinutes}
            turnoActual={turnoActual}
          />
        );
    }
  }, [currentScreen, ticket, searchCode, medioPago, paymentResult, facturaResult, alert, modoCalculo, manualMinutes, turnoActual, cierreResult, handleResetOperation, fetchTurnoYResumen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-slate-900 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppShell
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      hasPaymentContext={!!paymentResult}
      turnoActual={turnoActual}
      resumenTurno={resumenTurno}
    >
      {(() => {
        const screenConfig = getScreenById(currentScreen);
        return (
          <ProtectedRoute
            requiredPermission={screenConfig?.permission}
            onGoHome={handleResetOperation}
          >
            {content}
          </ProtectedRoute>
        );
      })()}
    </AppShell>
  );
}