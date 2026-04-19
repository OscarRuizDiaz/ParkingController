/**
 * Servicios para interactuar con la API del Backend.
 */

const BASE_URL = "http://localhost:8000/api/v1";

export const apiService = {
  /**
   * Busca un ticket por su código.
   */
  async getTicket(codigo) {
    const response = await fetch(`${BASE_URL}/tickets/${codigo}`);
    if (response.status === 404) {
      throw new Error("TICKET_NOT_FOUND");
    }
    if (!response.ok) {
      throw new Error("BACKEND_ERROR");
    }
    return await response.json();
  },

  /**
   * Ejecuta la simulación de liquidación para un ticket.
   */
  async simulateTicket(codigo) {
    const response = await fetch(`${BASE_URL}/tickets/${codigo}/simular`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "SIMULATION_ERROR");
    }
    return await response.json();
  },

  /**
   * Registra el cobro real de un ticket.
   */
  async processPayment(codigo_ticket, medio_pago, minutos_manuales = null) {
    const response = await fetch(`${BASE_URL}/ventas/cobrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        codigo_ticket, 
        medio_pago,
        minutos_manuales: minutos_manuales !== null ? parseInt(minutos_manuales) : null
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    return await response.json();
  },

  /**
   * Simulación manual basada en minutos ingresados por el usuario.
   */
  async simularManual(codigo_ticket, minutos_manuales) {
    const response = await fetch(`${BASE_URL}/tickets/simular-manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        codigo_ticket, 
        minutos_manuales: parseInt(minutos_manuales)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error en simulación manual");
    }

    return await response.json();
  },

  async buscarCliente(tipo_documento, numero_documento) {
    const response = await fetch(
      `${BASE_URL}/maestros/buscar?tipo_documento=${tipo_documento}&numero_documento=${numero_documento}`
    );
    if (!response.ok) return null;
    return await response.json();
  },

  async facturar(data) {
    const response = await fetch(`${BASE_URL}/facturacion/emitir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    return await response.json();
  },
  // === TARIFAS ===
  async getTarifaActiva() {
    const response = await fetch(`${BASE_URL}/tarifas/activa`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error obteniendo tarifa activa");
    }
    return await response.json();
  },

  async updateTarifaActiva(payload) {
    const response = await fetch(`${BASE_URL}/tarifas/activa`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error actualizando tarifa");
    }
    return await response.json();
  },

  // === CAJA / TURNOS ===
  async caja_abrir(id_caja, monto_inicial) {
    const response = await fetch(`${BASE_URL}/ventas/caja/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_caja, monto_inicial: parseFloat(monto_inicial) })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al abrir caja");
    }
    return await response.json();
  },

  async caja_getActual() {
    const response = await fetch(`${BASE_URL}/ventas/caja/actual`);
    if (!response.ok) {
        // Si el servidor responde con error, lanzamos para que el catch lo capture
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al recuperar turno actual");
    }
    return await response.json();
  },

  async caja_getResumen() {
    const response = await fetch(`${BASE_URL}/ventas/caja/resumen`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error obteniendo resumen de caja");
    }
    return await response.json();
  },

  async caja_cerrar(monto_final_declarado) {
    const response = await fetch(`${BASE_URL}/ventas/caja/cerrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto_final_declarado: parseFloat(monto_final_declarado) })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al cerrar caja");
    }
    return await response.json();
  }
};
