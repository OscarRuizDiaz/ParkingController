/**
 * Servicios para interactuar con la API del Backend Real.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const getAuthHeaders = (extraHeaders = {}) => {
  const sessionStr = localStorage.getItem("parking_session_v1");
  const headers = { "Content-Type": "application/json", ...extraHeaders };

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      const token = session.token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn("[api] Sesión encontrada pero sin token válido.");
      }
    } catch (e) {
      console.error("[api] Error parseando sesión para headers:", e);
    }
  } else {
    console.warn("[api] No hay sesión en localStorage para construir headers.");
  }
  return headers;
};

/**
 * Interceptor central de respuestas.
 */
const handleResponse = async (response, fallbackMsg) => {
  if (response.status === 401) {
    const event = new CustomEvent('parking-auth-error', { detail: { status: 401 } });
    window.dispatchEvent(event);
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = fallbackMsg;
    
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // Unpack FastAPI validation errors
        msg = errorData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(' | ');
      } else if (typeof errorData.detail === 'object') {
        msg = JSON.stringify(errorData.detail);
      }
    }
    throw new Error(msg);
  }

  return await response.json();
};

export const apiService = {
  // === TICKETS ===
  async getTicket(codigo) {
    const response = await fetch(`${BASE_URL}/tickets/${codigo}`, { headers: getAuthHeaders() });
    if (response.status === 404) throw new Error("TICKET_NOT_FOUND");
    return handleResponse(response, "Error recuperando ticket");
  },

  async simulateTicket(codigo) {
    const response = await fetch(`${BASE_URL}/tickets/${codigo}/simular`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error simulando ticket");
  },

  async simularManual(codigo_ticket, minutos_manuales) {
    const response = await fetch(`${BASE_URL}/tickets/simular-manual`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ codigo_ticket, minutos_manuales: parseInt(minutos_manuales) }),
    });
    return handleResponse(response, "Error en simulación manual");
  },

  async processPayment(codigo_ticket, medio_pago, minutos_manuales = null) {
    const response = await fetch(`${BASE_URL}/ventas/cobrar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        codigo_ticket, 
        medio_pago,
        minutos_manuales: minutos_manuales ? parseInt(minutos_manuales) : null
      }),
    });
    return handleResponse(response, "Error procesando pago");
  },

  // === MAESTROS / CLIENTES ===
  async buscarCliente(tipo_documento, numero_documento) {
    const response = await fetch(
      `${BASE_URL}/maestros/buscar?tipo_documento=${tipo_documento}&numero_documento=${numero_documento}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) return null;
    return await response.json();
  },

  async facturar(data) {
    const response = await fetch(`${BASE_URL}/facturacion/emitir`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Error emitiendo factura");
  },

  // === TARIFAS ===
  async getTarifaActiva() {
    const response = await fetch(`${BASE_URL}/tarifas/activa`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo tarifa");
  },

  async updateTarifaActiva(payload) {
    const response = await fetch(`${BASE_URL}/tarifas/activa`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response, "Error actualizando tarifa");
  },

  // === CAJA / TURNOS ===
  async maestros_getCajasDisponibles() {
    const response = await fetch(`${BASE_URL}/maestros/cajas/disponibles`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo cajas disponibles");
  },

  async caja_abrir(id_caja, monto_inicial) {
    const response = await fetch(`${BASE_URL}/ventas/caja/abrir`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id_caja, monto_inicial: parseFloat(monto_inicial) })
    });
    return handleResponse(response, "Error abriendo caja");
  },

  async caja_getActual() {
    const response = await fetch(`${BASE_URL}/ventas/caja/actual`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error recuperando turno actual");
  },

  async caja_getResumen() {
    const response = await fetch(`${BASE_URL}/ventas/caja/resumen`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo resumen de caja");
  },

  async caja_cerrar(monto_final_declarado) {
    const response = await fetch(`${BASE_URL}/ventas/caja/cerrar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ monto_final_declarado: parseFloat(monto_final_declarado) })
    });
    return handleResponse(response, "Error cerrando caja");
  },

  async caja_getAbiertas() {
    const response = await fetch(`${BASE_URL}/ventas/caja/abiertas`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo turnos abiertos");
  },

  async caja_cerrarForzado(id_turno, payload) {
    const response = await fetch(`${BASE_URL}/ventas/caja/cerrar-forzado/${id_turno}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        monto_final_declarado: parseFloat(payload.monto_final_declarado),
        motivo: payload.motivo
      })
    });
    return handleResponse(response, "Error en cierre forzado");
  },

  // === RBAC / SEGURIDAD ===
  async rbac_getRoles() {
    const response = await fetch(`${BASE_URL}/rbac/roles`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo roles");
  },

  async rbac_getPermisosMaster() {
    const response = await fetch(`${BASE_URL}/rbac/permisos`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo catálogo de permisos");
  },

  async rbac_getRolDetalle(id_rol) {
    const response = await fetch(`${BASE_URL}/rbac/roles/${id_rol}`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo detalle del rol");
  },

  async rbac_updateRolPermisos(id_rol, permisos) {
    const response = await fetch(`${BASE_URL}/rbac/roles/${id_rol}/permisos`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ permisos })
    });
    return handleResponse(response, "Error actualizando permisos del rol");
  },

  // === USUARIOS ===
  async usuarios_getLista() {
    const response = await fetch(`${BASE_URL}/usuarios/`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo lista de usuarios");
  },

  async usuarios_crear(payload) {
    const response = await fetch(`${BASE_URL}/usuarios/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response, "Error creando usuario");
  },

  async usuarios_update(id_usuario, payload) {
    const response = await fetch(`${BASE_URL}/usuarios/${id_usuario}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response, "Error actualizando usuario");
  },

  async usuarios_patchEstado(id_usuario, activo) {
    const response = await fetch(`${BASE_URL}/usuarios/${id_usuario}/estado`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    return handleResponse(response, "Error cambiando estado del usuario");
  },

  async usuarios_resetPassword(id_usuario, nueva_password) {
    const response = await fetch(`${BASE_URL}/usuarios/${id_usuario}/reset-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ nueva_password })
    });
    return handleResponse(response, "Error reseteando contraseña");
  },

  // === REPORTES Y DASHBOARD ===
  async getReporteFiltros() {
    const response = await fetch(`${BASE_URL}/reportes/filtros`, { headers: getAuthHeaders() });
    return handleResponse(response, "Error obteniendo filtros de reportes");
  },

  async getDashboardResumen(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`${BASE_URL}/reportes/dashboard/resumen?${queryParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response, "Error obteniendo resumen del dashboard");
  },

  async getReporteTurnos(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`${BASE_URL}/reportes/turnos?${queryParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response, "Error obteniendo reporte de turnos");
  },

  async getReporteCobros(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`${BASE_URL}/reportes/cobros?${queryParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response, "Error obteniendo reporte de cobros");
  }
};
