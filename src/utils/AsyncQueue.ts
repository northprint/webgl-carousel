/**
 * AsyncQueue - Sequential async task execution manager
 * Ensures async operations are executed in order with proper error handling
 */

import { Logger } from './Logger';

export interface QueuedTask<T = unknown> {
  id: string;
  execute: () => Promise<T>;
  onComplete?: (result: T) => void;
  onError?: (error: Error) => void;
  priority?: number;
}

export interface AsyncQueueOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Manages sequential execution of async tasks with error handling
 */
export class AsyncQueue {
  private queue: QueuedTask<any>[] = [];
  private running: Map<string, Promise<any>> = new Map();
  private logger = Logger.getInstance().createChild('AsyncQueue');
  private options: Required<AsyncQueueOptions>;
  private isProcessing = false;
  private abortController?: AbortController;

  constructor(options: AsyncQueueOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 1,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      timeout: options.timeout ?? 30000,
    };
  }

  /**
   * Add a task to the queue
   */
  enqueue<T>(task: QueuedTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask: QueuedTask<T> = {
        ...task,
        execute: async () => {
          try {
            const result = await task.execute();
            task.onComplete?.(result);
            resolve(result);
            return result;
          } catch (error) {
            task.onError?.(error as Error);
            reject(error);
            throw error;
          }
        },
      };

      // Insert based on priority
      if (task.priority !== undefined) {
        const insertIndex = this.queue.findIndex((t) => (t.priority ?? 0) < (task.priority ?? 0));
        if (insertIndex === -1) {
          this.queue.push(wrappedTask);
        } else {
          this.queue.splice(insertIndex, 0, wrappedTask);
        }
      } else {
        this.queue.push(wrappedTask);
      }

      // Start processing if not already running
      if (!this.isProcessing) {
        void this.process();
      }
    });
  }

  /**
   * Process queued tasks
   */
  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 || this.running.size > 0) {
      // Start new tasks up to max concurrent limit
      while (this.queue.length > 0 && this.running.size < this.options.maxConcurrent) {
        const task = this.queue.shift();
        if (!task) break;

        const promise = this.executeWithRetry(task);
        this.running.set(task.id, promise);

        // Clean up when done
        promise
          .finally(() => {
            this.running.delete(task.id);
          })
          .catch(() => {
            // Error already handled in executeWithRetry
          });
      }

      // Wait for at least one task to complete
      if (this.running.size > 0) {
        await Promise.race(Array.from(this.running.values()));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute task with retry logic
   */
  private async executeWithRetry(task: QueuedTask): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        // Create timeout promise if configured
        if (this.options.timeout > 0) {
          return await this.withTimeout(task.execute(), this.options.timeout);
        } else {
          return await task.execute();
        }
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Task ${task.id} failed (attempt ${attempt}/${this.options.retryAttempts})`,
          error,
        );

        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }

    throw (
      lastError || new Error(`Task ${task.id} failed after ${this.options.retryAttempts} attempts`)
    );
  }

  /**
   * Add timeout to a promise
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeout);
      }),
    ]);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all pending tasks
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Abort all running tasks
   */
  abort(): void {
    this.abortController?.abort();
    this.clear();
    this.running.clear();
    this.isProcessing = false;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    running: number;
    total: number;
  } {
    return {
      pending: this.queue.length,
      running: this.running.size,
      total: this.queue.length + this.running.size,
    };
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForAll(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await this.delay(100);
    }
  }
}
