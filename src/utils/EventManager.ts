/**
 * Event listener management utility
 * Provides centralized management of DOM and custom event listeners
 * with automatic cleanup and memory leak prevention
 */

import { Logger } from './Logger';

export type EventHandler = (...args: any[]) => void;
export type CleanupFunction = () => void;

interface ListenerInfo {
  target: EventTarget;
  type: string;
  handler: EventHandler;
  options?: AddEventListenerOptions;
}

interface CustomEventInfo {
  type: string;
  handler: EventHandler;
  context?: any;
}

/**
 * Manages event listeners with automatic cleanup
 */
export class EventManager {
  private listeners: Set<ListenerInfo> = new Set();
  private customEvents: Map<string, Set<CustomEventInfo>> = new Map();
  private cleanupFunctions: Set<CleanupFunction> = new Set();
  private rafIds: Set<number> = new Set();
  private timeoutIds: Set<NodeJS.Timeout> = new Set();
  private intervalIds: Set<NodeJS.Timeout> = new Set();
  private logger = Logger.getInstance().createChild('EventManager');
  private isDestroyed = false;

  /**
   * Add a DOM event listener with automatic cleanup
   */
  addEventListener(
    target: EventTarget,
    type: string,
    handler: EventHandler,
    options?: AddEventListenerOptions,
  ): CleanupFunction {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to add event listener after destruction');
      return () => {};
    }

    const listenerInfo: ListenerInfo = { target, type, handler, options };
    this.listeners.add(listenerInfo);
    target.addEventListener(type, handler, options);

    // Return cleanup function
    return () => {
      this.removeEventListener(target, type, handler, options);
    };
  }

  /**
   * Remove a specific DOM event listener
   */
  removeEventListener(
    target: EventTarget,
    type: string,
    handler: EventHandler,
    options?: AddEventListenerOptions,
  ): void {
    // Find and remove the listener
    for (const listener of this.listeners) {
      if (listener.target === target && listener.type === type && listener.handler === handler) {
        this.listeners.delete(listener);
        target.removeEventListener(type, handler, options);
        break;
      }
    }
  }

  /**
   * Add multiple event listeners at once
   */
  addEventListeners(
    target: EventTarget,
    events: Record<string, EventHandler>,
    options?: AddEventListenerOptions,
  ): CleanupFunction {
    const cleanups: CleanupFunction[] = [];

    for (const [type, handler] of Object.entries(events)) {
      cleanups.push(this.addEventListener(target, type, handler, options));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  /**
   * Add a custom event listener
   */
  on(type: string, handler: EventHandler, context?: any): CleanupFunction {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to add custom event after destruction');
      return () => {};
    }

    if (!this.customEvents.has(type)) {
      this.customEvents.set(type, new Set());
    }

    const eventInfo: CustomEventInfo = { type, handler, context };
    this.customEvents.get(type)!.add(eventInfo);

    return () => {
      this.off(type, handler, context);
    };
  }

  /**
   * Remove a custom event listener
   */
  off(type: string, handler?: EventHandler, context?: any): void {
    const handlers = this.customEvents.get(type);
    if (!handlers) return;

    if (!handler) {
      // Remove all handlers for this event type
      this.customEvents.delete(type);
      return;
    }

    // Remove specific handler
    for (const eventInfo of handlers) {
      if (
        eventInfo.handler === handler &&
        (context === undefined || eventInfo.context === context)
      ) {
        handlers.delete(eventInfo);
        break;
      }
    }

    // Clean up empty sets
    if (handlers.size === 0) {
      this.customEvents.delete(type);
    }
  }

  /**
   * Emit a custom event
   */
  emit(type: string, ...args: any[]): void {
    const handlers = this.customEvents.get(type);
    if (!handlers) return;

    for (const eventInfo of handlers) {
      try {
        if (eventInfo.context) {
          eventInfo.handler.call(eventInfo.context, ...args);
        } else {
          eventInfo.handler(...args);
        }
      } catch (error) {
        this.logger.error(`Error in event handler for "${type}":`, error as Error);
      }
    }
  }

  /**
   * Add a one-time event listener
   */
  once(type: string, handler: EventHandler, context?: any): CleanupFunction {
    const wrappedHandler = (...args: any[]) => {
      handler.call(context, ...args);
      this.off(type, wrappedHandler, context);
    };

    return this.on(type, wrappedHandler, context);
  }

  /**
   * Add a cleanup function to be called on destroy
   */
  addCleanup(cleanup: CleanupFunction): void {
    if (this.isDestroyed) {
      // If already destroyed, call cleanup immediately
      cleanup();
      return;
    }
    this.cleanupFunctions.add(cleanup);
  }

  /**
   * Remove a cleanup function
   */
  removeCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.delete(cleanup);
  }

  /**
   * Request animation frame with automatic cleanup
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to request animation frame after destruction');
      return -1;
    }

    const id = window.requestAnimationFrame((time) => {
      this.rafIds.delete(id);
      callback(time);
    });

    this.rafIds.add(id);
    return id;
  }

  /**
   * Cancel animation frame
   */
  cancelAnimationFrame(id: number): void {
    if (this.rafIds.has(id)) {
      window.cancelAnimationFrame(id);
      this.rafIds.delete(id);
    }
  }

  /**
   * Set timeout with automatic cleanup
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to set timeout after destruction');
      return {} as NodeJS.Timeout;
    }

    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      callback();
    }, delay);

    this.timeoutIds.add(id);
    return id;
  }

  /**
   * Clear timeout
   */
  clearTimeout(id: NodeJS.Timeout): void {
    if (this.timeoutIds.has(id)) {
      clearTimeout(id);
      this.timeoutIds.delete(id);
    }
  }

  /**
   * Set interval with automatic cleanup
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to set interval after destruction');
      return {} as NodeJS.Timeout;
    }

    const id = setInterval(callback, delay);
    this.intervalIds.add(id);
    return id;
  }

  /**
   * Clear interval
   */
  clearInterval(id: NodeJS.Timeout): void {
    if (this.intervalIds.has(id)) {
      clearInterval(id);
      this.intervalIds.delete(id);
    }
  }

  /**
   * Debounce a function
   */
  debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        this.clearTimeout(timeoutId);
      }

      timeoutId = this.setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Throttle a function
   */
  throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;

        this.setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            func(...lastArgs);
            lastArgs = null;
          }
        }, limit);
      } else {
        lastArgs = args;
      }
    };
  }

  /**
   * Clean up all listeners and resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.logger.debug('Destroying EventManager');

    // Remove all DOM event listeners
    for (const listener of this.listeners) {
      listener.target.removeEventListener(listener.type, listener.handler, listener.options);
    }
    this.listeners.clear();

    // Clear custom events
    this.customEvents.clear();

    // Cancel all animation frames
    for (const id of this.rafIds) {
      window.cancelAnimationFrame(id);
    }
    this.rafIds.clear();

    // Clear all timeouts
    for (const id of this.timeoutIds) {
      clearTimeout(id);
    }
    this.timeoutIds.clear();

    // Clear all intervals
    for (const id of this.intervalIds) {
      clearInterval(id);
    }
    this.intervalIds.clear();

    // Run cleanup functions
    for (const cleanup of this.cleanupFunctions) {
      try {
        cleanup();
      } catch (error) {
        this.logger.error('Error during cleanup:', error as Error);
      }
    }
    this.cleanupFunctions.clear();

    this.isDestroyed = true;
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): { dom: number; custom: number; total: number } {
    const customCount = Array.from(this.customEvents.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );

    return {
      dom: this.listeners.size,
      custom: customCount,
      total: this.listeners.size + customCount,
    };
  }

  /**
   * Check if destroyed
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}
