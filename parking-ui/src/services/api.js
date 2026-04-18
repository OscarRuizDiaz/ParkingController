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
  }
};
