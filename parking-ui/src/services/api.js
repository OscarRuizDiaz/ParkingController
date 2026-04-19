/**
 * Servicios para interactuar con la API del Backend Real.
 */

const BASE_URL = "http://localhost:8000/api/v1";

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
    throw new Error(errorData.detail || fallbackMsg);
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
  }
};
