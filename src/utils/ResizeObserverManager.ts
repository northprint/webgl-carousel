/**
 * ResizeObserver management utility
 * Provides efficient resize observation with debouncing
 */

import { Logger } from './Logger';

export interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize?: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize?: ReadonlyArray<ResizeObserverSize>;
}

export type ResizeCallback = (entry: ResizeObserverEntry) => void;

interface ObserverInfo {
  element: Element;
  callback: ResizeCallback;
  options?: ResizeObserverOptions;
}

/**
 * Manages ResizeObserver with automatic cleanup and debouncing
 */
export class ResizeObserverManager {
  private observer: ResizeObserver | null = null;
  private observations: Map<Element, Set<ObserverInfo>> = new Map();
  private logger = Logger.getInstance().createChild('ResizeObserverManager');
  private debounceDelay: number;
  private debounceTimers: Map<Element, NodeJS.Timeout> = new Map();
  private isDestroyed = false;

  constructor(debounceDelay: number = 100) {
    this.debounceDelay = debounceDelay;
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      this.logger.warn('ResizeObserver is not supported in this environment');
      return;
    }

    try {
      this.observer = new ResizeObserver((entries) => {
        this.handleResize(entries);
      });
    } catch (error) {
      this.logger.error('Failed to create ResizeObserver:', error as Error);
    }
  }

  private handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const callbacks = this.observations.get(entry.target);
      if (!callbacks) continue;

      // Clear existing debounce timer
      const existingTimer = this.debounceTimers.get(entry.target);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        this.debounceTimers.delete(entry.target);

        // Execute all callbacks for this element
        for (const info of callbacks) {
          try {
            info.callback(entry);
          } catch (error) {
            this.logger.error('Error in resize callback:', error as Error);
          }
        }
      }, this.debounceDelay);

      this.debounceTimers.set(entry.target, timer);
    }
  }

  /**
   * Observe an element for resize changes
   */
  observe(element: Element, callback: ResizeCallback, options?: ResizeObserverOptions): () => void {
    if (this.isDestroyed) {
      this.logger.warn('Attempting to observe after destruction');
      return () => {};
    }

    if (!this.observer) {
      this.logger.warn('ResizeObserver not available');
      return () => {};
    }

    // Get or create callback set for this element
    if (!this.observations.has(element)) {
      this.observations.set(element, new Set());
      this.observer.observe(element, options);
    }

    const info: ObserverInfo = { element, callback, options };
    this.observations.get(element)!.add(info);

    // Return cleanup function
    return () => {
      this.unobserve(element, callback);
    };
  }

  /**
   * Stop observing an element
   */
  unobserve(element: Element, callback?: ResizeCallback): void {
    const callbacks = this.observations.get(element);
    if (!callbacks) return;

    if (callback) {
      // Remove specific callback
      for (const info of callbacks) {
        if (info.callback === callback) {
          callbacks.delete(info);
          break;
        }
      }
    } else {
      // Remove all callbacks for this element
      callbacks.clear();
    }

    // If no more callbacks, stop observing
    if (callbacks.size === 0) {
      this.observations.delete(element);
      this.observer?.unobserve(element);

      // Clear any pending debounce timer
      const timer = this.debounceTimers.get(element);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(element);
      }
    }
  }

  /**
   * Observe multiple elements
   */
  observeMultiple(
    elements: Element[],
    callback: ResizeCallback,
    options?: ResizeObserverOptions,
  ): () => void {
    const cleanups = elements.map((element) => this.observe(element, callback, options));

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  /**
   * Get the bounding rect of an element with caching
   */
  getBoundingRect(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }

  /**
   * Set debounce delay
   */
  setDebounceDelay(delay: number): void {
    this.debounceDelay = delay;
  }

  /**
   * Get the number of observed elements
   */
  getObservedCount(): number {
    return this.observations.size;
  }

  /**
   * Disconnect all observations and clean up
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.logger.debug('Destroying ResizeObserverManager');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear observations
    this.observations.clear();

    this.isDestroyed = true;
  }

  /**
   * Check if destroyed
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * Singleton instance for global use
 */
let globalInstance: ResizeObserverManager | null = null;

/**
 * Get or create global ResizeObserverManager instance
 */
export function getGlobalResizeObserver(): ResizeObserverManager {
  if (!globalInstance) {
    globalInstance = new ResizeObserverManager();
  }
  return globalInstance;
}

/**
 * Destroy global instance
 */
export function destroyGlobalResizeObserver(): void {
  if (globalInstance) {
    globalInstance.destroy();
    globalInstance = null;
  }
}
