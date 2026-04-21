import { 
  ScanLine, 
  CheckCircle2, 
  Receipt, 
  Calculator, 
  Settings,
  Shield,
  ShieldAlert,
  Users
} from "lucide-react";
import { PERMISSIONS } from "../auth/constants/permissions";

/**
 * Configuración centralizada de las pantallas del sistema.
 * Única fuente de verdad para el menú lateral y la protección de rutas.
 */
export const SCREEN_CONFIG = [
  { 
    id: "caja", 
    label: "Caja Principal", 
    icon: ScanLine, 
    permission: PERMISSIONS.CAJA_VIEW 
  },
  { 
    id: "resultado", 
    label: "Resumen de Cobro", 
    icon: CheckCircle2, 
    permission: PERMISSIONS.CAJA_VIEW,
    restricted: true // Solo accesible si hay un contexto de pago previo
  },
  { 
    id: "cliente", 
    label: "Facturación Fiscal", 
    icon: Receipt, 
    permission: PERMISSIONS.FACTURACION_VIEW,
    restricted: true 
  },
  { 
    id: "turno", 
    label: "Gestión de Turnos", 
    icon: Calculator, 
    permission: PERMISSIONS.TURNOS_VIEW 
  },
  { 
    id: "tarifa", 
    label: "Config. Tarifa", 
    icon: Settings, 
    permission: PERMISSIONS.TARIFAS_VIEW 
  },
  {
    id: "cierre_resultado",
    label: "Resultado del Cierre",
    icon: CheckCircle2,
    permission: PERMISSIONS.CAJA_VIEW,
    hiddenMenu: true // No se muestra en la navegación lateral
  },
  {
    id: "supervision",
    label: "Supervisión Cajas",
    icon: Shield,
    permission: PERMISSIONS.CAJA_GESTION
  },
  {
    id: "usuarios",
    label: "Gestión Personal",
    icon: Users,
    permission: PERMISSIONS.USUARIOS_VIEW
  },
  {
    id: "rbac_admin",
    label: "Seguridad y Roles",
    icon: ShieldAlert,
    permission: PERMISSIONS.ROLES_VIEW
  }
];

export const getScreenById = (id) => SCREEN_CONFIG.find(s => s.id === id);
