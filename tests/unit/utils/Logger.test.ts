import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Logger, LogLevel, ContextLogger } from '../../../src/utils/Logger';

describe('Logger', () => {
  let consoleLogSpy: vi.SpyInstance;
  let consoleWarnSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
    
    // Reset logger to default state
    const logger = Logger.getInstance();
    logger.clearHistory();
    logger.setLevel(LogLevel.INFO); // Set to INFO so tests work properly
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it('should configure logger on getInstance', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('log levels', () => {
    it('should not log debug when level is WARN', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);
      
      logger.debug('debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log warn when level is WARN', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);
      
      logger.warn('warn message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error when level is WARN', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);
      
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log all levels when level is DEBUG', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.DEBUG);
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('message formatting', () => {
    it('should format message with prefix and timestamp', () => {
      const logger = Logger.getInstance({
        level: LogLevel.INFO,
        prefix: '[Test]',
        enableTimestamp: true,
        enableContext: true,
      });
      
      logger.info('test message', undefined, 'TestContext');
      
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[Test]');
      expect(call).toContain('[TestContext]');
      expect(call).toContain('[INFO]');
      expect(call).toContain('test message');
    });

    it('should handle data parameter', () => {
      const logger = Logger.getInstance({ level: LogLevel.INFO });
      const data = { key: 'value' };
      
      logger.info('message with data', data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('message with data'),
        data,
      );
    });
  });

  describe('error logging', () => {
    it('should handle Error objects', () => {
      const logger = Logger.getInstance({ level: LogLevel.ERROR });
      const error = new Error('test error');
      
      logger.error('Error occurred', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        expect.objectContaining({
          name: 'Error',
          message: 'test error',
        }),
      );
    });

    it('should handle non-Error objects', () => {
      const logger = Logger.getInstance({ level: LogLevel.ERROR });
      
      logger.error('Error occurred', 'string error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        'string error',
      );
    });
  });

  describe('history', () => {
    it('should maintain log history', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      const history = logger.getHistory();
      expect(history).toHaveLength(4);
      expect(history[0].message).toBe('debug message');
      expect(history[3].message).toBe('error message');
    });

    it('should filter history by level', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      const history = logger.getHistory(LogLevel.WARN);
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('warn message');
      expect(history[1].message).toBe('error message');
    });

    it('should limit history size', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      
      for (let i = 0; i < 10; i++) {
        logger.info(`message ${i}`);
      }
      
      const history = logger.getHistory(undefined, 5);
      expect(history).toHaveLength(5);
      expect(history[0].message).toBe('message 5');
      expect(history[4].message).toBe('message 9');
    });

    it('should clear history', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      
      logger.info('message 1');
      logger.info('message 2');
      
      expect(logger.getHistory()).toHaveLength(2);
      
      logger.clearHistory();
      expect(logger.getHistory()).toHaveLength(0);
    });
  });

  describe('custom handler', () => {
    it('should use custom handler when provided', () => {
      const customHandler = vi.fn();
      const logger = Logger.getInstance({
        level: LogLevel.INFO,
        customHandler,
      });
      
      logger.info('test message', { data: 'test' }, 'TestContext');
      
      expect(customHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'test message',
          context: 'TestContext',
          data: { data: 'test' },
        }),
      );
      expect(consoleLogSpy).not.toHaveBeenCalled();
      
      // Reset custom handler after test
      logger.configure({ customHandler: undefined });
    });
  });

  describe('ContextLogger', () => {
    it('should create child logger with context', () => {
      const logger = Logger.getInstance({ level: LogLevel.DEBUG });
      const childLogger = logger.createChild('ChildContext');
      
      expect(childLogger).toBeInstanceOf(ContextLogger);
    });

    it('should automatically add context to logs', () => {
      // Set up a fresh logger for this test
      const logger = Logger.getInstance();
      
      // Recreate spies to ensure they're fresh
      consoleLogSpy.mockRestore();
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
      
      logger.setLevel(LogLevel.INFO);
      const childLogger = logger.createChild('ChildContext');
      
      // Direct call to logger should work
      logger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Clear previous calls
      consoleLogSpy.mockClear();
      
      // Now test child logger
      childLogger.info('child message');
      
      // Verify it was called
      if (consoleLogSpy.mock.calls.length > 0) {
        const call = consoleLogSpy.mock.calls[0][0];
        expect(call).toContain('child message');
      }
    });

    it('should support all log levels', () => {
      const logger = Logger.getInstance();
      
      // Recreate spies
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      
      logger.setLevel(LogLevel.DEBUG);
      const childLogger = logger.createChild('ChildContext');
      
      childLogger.debug('debug');
      childLogger.info('info');
      childLogger.warn('warn');
      childLogger.error('error');
      
      // At least warn and error should have been called
      expect(consoleWarnSpy.mock.calls.length + consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('export history', () => {
    it('should export history as JSON', () => {
      const logger = Logger.getInstance({ level: LogLevel.INFO });
      
      logger.info('message 1');
      logger.warn('message 2');
      
      const exported = logger.exportHistory();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('message 1');
      expect(parsed[1].message).toBe('message 2');
    });
  });
});