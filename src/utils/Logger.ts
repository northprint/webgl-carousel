/**
 * Log levels for the logger
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
  error?: Error;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableContext?: boolean;
  customHandler?: (entry: LogEntry) => void;
}

/**
 * Logger class for centralized logging
 */
import { DIMENSION_CONSTANTS } from '../constants/magic-numbers';

export class Logger {
  private static instance: Logger | null = null;
  private config: LoggerConfig;
  private history: LogEntry[] = [];
  private readonly maxHistorySize = DIMENSION_CONSTANTS.MAX_LOG_HISTORY_SIZE;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.WARN,
      prefix: config.prefix ?? '[WebGLCarousel]',
      enableTimestamp: config.enableTimestamp ?? true,
      enableContext: config.enableContext ?? true,
      customHandler: config.customHandler as ((entry: LogEntry) => void) | undefined,
    } as Required<LoggerConfig>;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      Logger.instance.configure(config);
    }
    return Logger.instance;
  }

  /**
   * Configure the logger
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  public getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Debug log
   */
  public debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info log
   */
  public info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning log
   */
  public warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error log
   */
  public error(message: string, error?: Error | unknown, context?: string): void {
    let errorObj: Error | undefined;
    let data: unknown;

    if (error instanceof Error) {
      errorObj = error;
      data = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      data = error;
    }

    this.log(LogLevel.ERROR, message, data, context, errorObj);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string,
    error?: Error,
  ): void {
    // Check if this level should be logged
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
      error,
    };

    // Add to history
    this.addToHistory(entry);

    // Use custom handler if provided
    if (this.config.customHandler) {
      this.config.customHandler(entry);
      return;
    }

    // Format and output
    const formattedMessage = this.formatMessage(entry);
    this.output(level, formattedMessage, data);
  }

  /**
   * Format log message
   */
  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    if (this.config.enableTimestamp) {
      parts.push(`[${this.formatTimestamp(entry.timestamp)}]`);
    }

    if (this.config.enableContext && entry.context) {
      parts.push(`[${entry.context}]`);
    }

    parts.push(this.getLevelString(entry.level));
    parts.push(entry.message);

    return parts.join(' ');
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Get level string
   */
  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '[DEBUG]';
      case LogLevel.INFO:
        return '[INFO]';
      case LogLevel.WARN:
        return '[WARN]';
      case LogLevel.ERROR:
        return '[ERROR]';
      default:
        return '';
    }
  }

  /**
   * Output to console
   */
  private output(level: LogLevel, message: string, data?: unknown): void {
    const args = data !== undefined ? [message, data] : [message];

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.log(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
    }
  }

  /**
   * Add entry to history
   */
  private addToHistory(entry: LogEntry): void {
    this.history.push(entry);

    // Trim history if it exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get log history
   */
  public getHistory(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.history;

    if (level !== undefined) {
      filtered = filtered.filter((entry) => entry.level >= level);
    }

    if (limit !== undefined && limit > 0) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear log history
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * Export history as JSON
   */
  public exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Create a child logger with context
   */
  public createChild(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context logger that automatically adds context to logs
 */
export class ContextLogger {
  constructor(
    private logger: Logger,
    private context: string,
  ) {}

  public debug(message: string, data?: unknown): void {
    this.logger.debug(message, data, this.context);
  }

  public info(message: string, data?: unknown): void {
    this.logger.info(message, data, this.context);
  }

  public warn(message: string, data?: unknown): void {
    this.logger.warn(message, data, this.context);
  }

  public error(message: string, error?: Error | unknown): void {
    this.logger.error(message, error, this.context);
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance();
