/**
 * Mapea errores técnicos del backend a mensajes legibles
 * y estructurados para el usuario final de caja.
 * 
 * @param {Error|Object} error - El objeto de error o respuesta del backend.
 * @param {number} status - El código de estado HTTP (opcional).
 * @returns {Object} { title, message, type }
 */
export function mapBackendError(error, status = null) {
  const messageStr = typeof error === 'string' ? error : (error.message || error.detail || "");
  
  // 1. Manejo de Errores Específicos de Negocio (Backend)
  
  // Ticket / Parking
  if (
    messageStr.includes("TICKET_NOT_FOUND") || 
    messageStr.includes("No existe un ticket") || 
    messageStr.includes("Ticket no encontrado")
  ) {
    return {
      title: "Ticket no encontrado",
      message: "No existe un ticket con ese código. Verificá el número e intentá nuevamente.",
      type: "warning"
    };
  }

  if (messageStr.includes("ya ha sido cobrado")) {
    return {
      title: "Operación no permitida",
      message: "Este ticket ya fue procesado previamente. No es posible realizar un nuevo cobro.",
      type: "error"
    };
  }

  if (messageStr.includes("ya ha sido facturado")) {
    return {
      title: "Ticket ya facturado",
      message: "Este ticket ya fue facturado y no puede volver a procesarse.",
      type: "error"
    };
  }

  if (messageStr.includes("sin tarifa activa") || messageStr.includes("Tarifa activa no encontrada")) {
    return {
      title: "Tarifa no disponible",
      message: "No existe una tarifa activa para calcular el importe del estacionamiento.",
      type: "error"
    };
  }

  // Caja / Ventas
  if (messageStr.includes("No hay un turno de caja abierto")) {
    return {
      title: "Caja no disponible",
      message: "No hay un turno de caja abierto para registrar el cobro.",
      type: "error"
    };
  }

  if (messageStr.includes("Ya existe un cobro registrado") || messageStr.includes("duplicidad")) {
    return {
      title: "Cobro ya registrado",
      message: "Ya existe un cobro asociado a este ticket o liquidación.",
      type: "warning"
    };
  }

  if (messageStr.includes("confirmada/cobrada anteriormente") || messageStr.includes("confirmada")) {
    return {
        title: "Liquidación ya procesada",
        message: "Esta liquidación ya fue confirmada anteriormente.",
        type: "warning"
    };
  }

  // 2. Errores por Status HTTP
  if (status === 401 || status === 403) {
    return {
      title: "Acceso denegado",
      message: "No tenés permisos suficientes para realizar esta operación.",
      type: "error"
    };
  }

  if (status >= 500) {
    return {
      title: "Error de servidor",
      message: "Ocurrió un inconveniente al comunicarse con el sistema (500). Reintentá en unos momentos.",
      type: "error"
    };
  }

  // 3. Fallback Final
  return {
    title: "Error inesperado",
    message: messageStr || "Ocurrió un inconveniente al comunicarse con el sistema. Reintentá en unos momentos.",
    type: "error"
  };
}

/**
 * Retorna la configuración para un estado de carga.
 */
export function getLoadingMessage(context = "buscando") {
    return {
        title: context === "buscando" ? "Buscando ticket..." : "Procesando cobro...",
        message: "Por favor, esperá un momento mientras el sistema responde.",
        type: "loading"
    };
}
