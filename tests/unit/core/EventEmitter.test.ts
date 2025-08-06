import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { EventEmitter } from '../../../src/core/EventEmitter';

interface TestEvents {
  test: [string, number];
  noArgs: [];
  error: [Error];
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe('on/emit', () => {
    it('should register and call event handlers', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 'hello', 42);

      expect(handler).toHaveBeenCalledWith('hello', 42);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test', 'world', 99);

      expect(handler1).toHaveBeenCalledWith('world', 99);
      expect(handler2).toHaveBeenCalledWith('world', 99);
    });

    it('should handle events with no arguments', () => {
      const handler = vi.fn();
      emitter.on('noArgs', handler);
      emitter.emit('noArgs');

      expect(handler).toHaveBeenCalledWith();
    });

    it('should not fail when emitting events with no handlers', () => {
      expect(() => emitter.emit('test', 'test', 123)).not.toThrow();
    });

    it('should catch and log handler errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      const errorHandler = () => {
        throw new Error('Handler error');
      };
      const normalHandler = vi.fn();

      emitter.on('test', errorHandler);
      emitter.on('test', normalHandler);
      emitter.emit('test', 'data', 1);

      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event handler for "test"'),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('off', () => {
    it('should remove event handler', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test', 'hello', 42);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.off('test', handler1);
      emitter.emit('test', 'hello', 42);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('hello', 42);
    });

    it('should handle removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => emitter.off('test', handler)).not.toThrow();
    });
  });

  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn();
      emitter.once('test', handler);

      emitter.emit('test', 'first', 1);
      emitter.emit('test', 'second', 2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first', 1);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.removeAllListeners('test');
      emitter.emit('test', 'hello', 42);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should remove all listeners for all events', () => {
      const testHandler = vi.fn();
      const errorHandler = vi.fn();

      emitter.on('test', testHandler);
      emitter.on('error', errorHandler);
      emitter.removeAllListeners();

      emitter.emit('test', 'hello', 42);
      emitter.emit('error', new Error('test'));

      expect(testHandler).not.toHaveBeenCalled();
      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct listener count', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', handler1);
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.on('test', handler2);
      expect(emitter.listenerCount('test')).toBe(2);

      emitter.off('test', handler1);
      expect(emitter.listenerCount('test')).toBe(1);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const handler = vi.fn();

      const result = emitter
        .on('test', handler)
        .emit('test', 'chain', 1)
        .off('test', handler);

      expect(result).toBe(emitter);
      expect(handler).toHaveBeenCalledWith('chain', 1);
    });
  });
});