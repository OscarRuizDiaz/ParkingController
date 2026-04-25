/**
 * Bus de eventos global para comunicación entre módulos desacoplados.
 * Permite sincronización en tiempo casi real ante cambios de estado.
 */
class EventBus extends EventTarget {
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName, callback) {
    this.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    this.removeEventListener(eventName, callback);
  }
}

export const eventBus = new EventBus();

// Constantes de eventos
export const EVENTS = {
  DATA_CHANGED: "dataChanged"
};
