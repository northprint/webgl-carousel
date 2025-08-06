import { Logger } from './Logger';
import { ANIMATION_CONSTANTS, TEST_CONSTANTS } from '../constants/magic-numbers';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  INITIALIZATION = 'initialization',
  RENDERING = 'rendering',
  RESOURCE_LOADING = 'resource_loading',
  TRANSITION = 'transition',
  USER_INPUT = 'user_input',
  CONFIGURATION = 'configuration',
  WEBGL = 'webgl',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Enhanced error with additional metadata
 */
export class CarouselError extends Error {
  public readonly timestamp: Date;
  public readonly id: string;

  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly severity: ErrorSeverity,
    public readonly context?: string,
    public readonly originalError?: Error,
    public readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CarouselError';
    this.timestamp = new Date();
    this.id = this.generateId();

    // Maintain proper stack trace
    if (originalError?.stack) {
      this.stack = originalError.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CarouselError);
    }
  }

  private generateId(): string {
    return `${this.category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      data: this.data,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  logger?: Logger;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: CarouselError) => void;
  onRecovery?: (error: CarouselError) => void;
  enableRecovery?: boolean;
  enableReporting?: boolean;
}

/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy {
  canRecover(error: CarouselError): boolean;
  recover(error: CarouselError): Promise<void>;
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private config: Required<ErrorHandlerConfig>;
  private errorHistory: CarouselError[] = [];
  private recoveryStrategies = new Map<ErrorCategory, RecoveryStrategy>();
  private retryCount = new Map<string, number>();

  private constructor(config: ErrorHandlerConfig = {}) {
    this.logger = config.logger ?? Logger.getInstance();
    this.config = {
      logger: this.logger,
      maxRetries: config.maxRetries ?? TEST_CONSTANTS.MAX_RETRY_COUNT,
      retryDelay: config.retryDelay ?? ANIMATION_CONSTANTS.ERROR_RETRY_DELAY,
      onError: config.onError ?? (() => {}),
      onRecovery: config.onRecovery ?? (() => {}),
      enableRecovery: config.enableRecovery ?? true,
      enableReporting: config.enableReporting ?? false,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle error
   */
  public async handleError(
    error: Error | CarouselError | unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    // Convert to CarouselError if needed
    const carouselError = this.normalizeError(error, category, severity, context, data);

    // Add to history
    this.errorHistory.push(carouselError);

    // Log the error
    this.logError(carouselError);

    // Call error callback
    this.config.onError(carouselError);

    // Attempt recovery if enabled
    if (this.config.enableRecovery) {
      await this.attemptRecovery(carouselError);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(carouselError);
    }
  }

  /**
   * Normalize error to CarouselError
   */
  private normalizeError(
    error: Error | CarouselError | unknown,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: string,
    data?: Record<string, unknown>,
  ): CarouselError {
    if (error instanceof CarouselError) {
      return error;
    }

    if (error instanceof Error) {
      return new CarouselError(error.message, category, severity, context, error, data);
    }

    // Handle non-Error objects
    const message = String(error);
    return new CarouselError(message, category, severity, context, undefined, data);
  }

  /**
   * Log error based on severity
   */
  private logError(error: CarouselError): void {
    const logData = error.toJSON();

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.debug(`Error: ${error.message}`, logData, error.context);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`Error: ${error.message}`, logData, error.context);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error(`Error: ${error.message}`, error.originalError || error, error.context);
        break;
    }
  }

  /**
   * Attempt to recover from error
   */
  private async attemptRecovery(error: CarouselError): Promise<void> {
    const strategy = this.recoveryStrategies.get(error.category);

    if (!strategy || !strategy.canRecover(error)) {
      return;
    }

    const retryKey = `${error.category}_${error.message}`;
    const currentRetries = this.retryCount.get(retryKey) || 0;

    if (currentRetries >= this.config.maxRetries) {
      this.logger.error(
        `Max retries (${this.config.maxRetries}) exceeded for error`,
        error,
        'ErrorHandler',
      );
      return;
    }

    this.retryCount.set(retryKey, currentRetries + 1);

    // Wait before retry
    await this.delay(this.config.retryDelay * (currentRetries + 1));

    try {
      await strategy.recover(error);
      this.logger.info(
        `Successfully recovered from error: ${error.message}`,
        undefined,
        'ErrorHandler',
      );
      this.config.onRecovery(error);
      this.retryCount.delete(retryKey); // Reset on success
    } catch (recoveryError) {
      this.logger.error(
        `Recovery failed for error: ${error.message}`,
        recoveryError,
        'ErrorHandler',
      );
    }
  }

  /**
   * Report error (for telemetry/monitoring)
   */
  private reportError(error: CarouselError): void {
    // This could be extended to send errors to a monitoring service
    this.logger.debug('Error reported', error.toJSON(), 'ErrorHandler');
  }

  /**
   * Register recovery strategy
   */
  public registerRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(category, strategy);
  }

  /**
   * Get error history
   */
  public getErrorHistory(
    category?: ErrorCategory,
    severity?: ErrorSeverity,
    limit?: number,
  ): CarouselError[] {
    let filtered = this.errorHistory;

    if (category) {
      filtered = filtered.filter((e) => e.category === category);
    }

    if (severity) {
      filtered = filtered.filter((e) => e.severity === severity);
    }

    if (limit && limit > 0) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryCount.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create context-specific error handler
   */
  public createContextHandler(context: string): ContextErrorHandler {
    return new ContextErrorHandler(this, context);
  }
}

/**
 * Context-specific error handler
 */
export class ContextErrorHandler {
  constructor(
    private handler: ErrorHandler,
    private context: string,
  ) {}

  public async handleError(
    error: Error | unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    data?: Record<string, unknown>,
  ): Promise<void> {
    return this.handler.handleError(error, category, severity, this.context, data);
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();
