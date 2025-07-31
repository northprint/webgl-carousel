export type EventHandler = (...args: unknown[]) => void;

export interface EventMap {
  [event: string]: unknown[];
}

export class EventEmitter<T extends EventMap = EventMap> {
  private events: Map<keyof T, Set<EventHandler>> = new Map();

  on<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler as EventHandler);
    return this;
  }

  off<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): this {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
    return this;
  }

  once<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this {
    const onceHandler = (...args: T[K]) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    return this.on(event, onceHandler);
  }

  removeAllListeners(event?: keyof T): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event: keyof T): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }
}
