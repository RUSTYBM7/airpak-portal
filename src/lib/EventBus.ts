type EventCallback = (data: any) => void;

interface EventListeners {
  [eventName: string]: EventCallback[];
}

class EventBus {
  private listeners: EventListeners = {};

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return a cleanup function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );

    if (this.listeners[event].length === 0) {
      delete this.listeners[event];
    }
  }

  emit(event: string, data?: any): void {
    // Exact match
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    // Namespace match (e.g., 'shipment:*')
    const namespaceMatches = Object.keys(this.listeners).filter((key) => {
      if (key.endsWith('*')) {
        const prefix = key.slice(0, -1);
        return event.startsWith(prefix) && event !== key;
      }
      return false;
    });

    namespaceMatches.forEach((match) => {
      this.listeners[match].forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event listener for ${match}:`, error);
        }
      });
    });
  }

  // Clear all listeners (useful for testing or full cleanup)
  clear(): void {
    this.listeners = {};
  }
}

// Export a singleton instance
export const eventBus = new EventBus();
