import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ResizeObserverManager } from '../../../src/utils/ResizeObserverManager';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  observedElements: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    this.observedElements.add(target);
  }

  unobserve(target: Element) {
    this.observedElements.delete(target);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper method to trigger resize
  triggerResize(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}

describe('ResizeObserverManager', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let mockResizeObserver: MockResizeObserver;
  let manager: ResizeObserverManager | null = null;

  beforeAll(() => {
    // Save original ResizeObserver if it exists
    originalResizeObserver = (global as any).ResizeObserver;
    
    // Set up mock ResizeObserver
    (global as any).ResizeObserver = vi.fn((callback: ResizeObserverCallback) => {
      mockResizeObserver = new MockResizeObserver(callback);
      return mockResizeObserver;
    });
  });

  afterAll(() => {
    // Restore original ResizeObserver
    if (originalResizeObserver) {
      (global as any).ResizeObserver = originalResizeObserver;
    } else {
      delete (global as any).ResizeObserver;
    }
  });

  beforeEach(() => {
    manager = new ResizeObserverManager();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
      manager = null;
    }
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      const instance = new ResizeObserverManager();
      
      expect(instance).toBeInstanceOf(ResizeObserverManager);
      instance.destroy();
    });

    it('should accept custom debounce delay', () => {
      const instance = new ResizeObserverManager(200);
      
      expect(instance).toBeInstanceOf(ResizeObserverManager);
      instance.destroy();
    });
  });

  describe('observer management', () => {
    it('should observe an element', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.observe(element, callback);
      
      expect(mockResizeObserver.observedElements.has(element)).toBe(true);
    });

    it('should unobserve an element', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.observe(element, callback);
      manager!.unobserve(element);
      
      expect(mockResizeObserver.observedElements.has(element)).toBe(false);
    });

    it('should handle multiple callbacks for the same element', () => {
      const element = document.createElement('div');
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      manager!.observe(element, callback1);
      manager!.observe(element, callback2);
      
      // Trigger resize
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      mockResizeObserver.triggerResize([entry]);
      
      // Wait for debounce
      setTimeout(() => {
        expect(callback1).toHaveBeenCalledWith(entry);
        expect(callback2).toHaveBeenCalledWith(entry);
      }, 110);
    });

    it('should remove specific callback', () => {
      const element = document.createElement('div');
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      manager!.observe(element, callback1);
      manager!.observe(element, callback2);
      manager!.unobserve(element, callback1);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      mockResizeObserver.triggerResize([entry]);
      
      setTimeout(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith(entry);
      }, 110);
    });

    it('should handle resize events', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.observe(element, callback);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 200,
          height: 150,
          top: 0,
          right: 200,
          bottom: 150,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      mockResizeObserver.triggerResize([entry]);
      
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(entry);
      }, 110);
    });
  });

  describe('error handling', () => {
    it('should handle missing ResizeObserver gracefully', () => {
      // Remove ResizeObserver
      delete (global as any).ResizeObserver;
      
      const element = document.createElement('div');
      const callback = vi.fn();
      
      // Create new instance without ResizeObserver
      const newManager = new ResizeObserverManager();
      
      expect(() => {
        newManager.observe(element, callback);
      }).not.toThrow();
      
      newManager.destroy();
      
      // Restore for other tests
      (global as any).ResizeObserver = vi.fn((callback: ResizeObserverCallback) => {
        mockResizeObserver = new MockResizeObserver(callback);
        return mockResizeObserver;
      });
    });

    it('should handle errors in callbacks', () => {
      const element = document.createElement('div');
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      manager!.observe(element, errorCallback);
      manager!.observe(element, normalCallback);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      expect(() => {
        mockResizeObserver.triggerResize([entry]);
      }).not.toThrow();
      
      setTimeout(() => {
        expect(errorCallback).toHaveBeenCalled();
        expect(normalCallback).toHaveBeenCalled();
      }, 110);
    });
  });

  describe('cleanup', () => {
    it('should disconnect all observers on destroy', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const callback = vi.fn();
      
      manager!.observe(element1, callback);
      manager!.observe(element2, callback);
      
      manager!.destroy();
      
      expect(mockResizeObserver.observedElements.size).toBe(0);
    });

    it('should handle multiple destroy calls', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.observe(element, callback);
      
      manager!.destroy();
      
      expect(() => {
        manager!.destroy();
      }).not.toThrow();
    });
  });

  describe('debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce resize callbacks', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.setDebounceDelay(100);
      manager!.observe(element, callback);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      // Trigger multiple resize events
      mockResizeObserver.triggerResize([entry]);
      mockResizeObserver.triggerResize([entry]);
      mockResizeObserver.triggerResize([entry]);
      
      expect(callback).not.toHaveBeenCalled();
      
      // Fast forward time
      vi.advanceTimersByTime(100);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should use default debounce time', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      // Default is 100ms debounce
      manager!.observe(element, callback);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      mockResizeObserver.triggerResize([entry]);
      
      // Default is 100ms debounce
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel debounced callback on unobserve', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      
      manager!.setDebounceDelay(100);
      manager!.observe(element, callback);
      
      const entry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        } as DOMRectReadOnly,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      
      mockResizeObserver.triggerResize([entry]);
      
      // Unobserve before debounce completes
      manager!.unobserve(element);
      
      vi.advanceTimersByTime(100);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track observed elements count', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const callback = vi.fn();
      
      expect(manager!.getObservedCount()).toBe(0);
      
      manager!.observe(element1, callback);
      expect(manager!.getObservedCount()).toBe(1);
      
      manager!.observe(element2, callback);
      expect(manager!.getObservedCount()).toBe(2);
      
      manager!.unobserve(element1);
      expect(manager!.getObservedCount()).toBe(1);
    });

    it('should check if destroyed', () => {
      expect(manager!.destroyed).toBe(false);
      
      manager!.destroy();
      expect(manager!.destroyed).toBe(true);
    });
  });
});