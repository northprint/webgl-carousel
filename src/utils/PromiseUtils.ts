/**
 * Promise utility functions for better async control
 */

import { Logger } from './Logger';

export interface TimeoutOptions {
  message?: string;
  fallbackValue?: unknown;
}

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface ConcurrentResult<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: Error;
  index: number;
}

/**
 * Promise utilities for async operations
 */
export class PromiseUtils {
  private static logger = Logger.getInstance().createChild('PromiseUtils');

  /**
   * Add timeout to a promise
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    options: TimeoutOptions = {},
  ): Promise<T> {
    const { message = 'Operation timed out', fallbackValue } = options;

    return Promise.race([
      promise,
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (fallbackValue !== undefined) {
            resolve(fallbackValue as T);
          } else {
            reject(new Error(message));
          }
        }, timeoutMs);

        // Clean up timer if promise resolves first
        promise.finally(() => clearTimeout(timer)).catch(() => {});
      }),
    ]);
  }

  /**
   * Retry a promise-returning function
   */
  static async retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const {
      attempts = 3,
      delay = 1000,
      backoff = 'exponential',
      shouldRetry = () => true,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === attempts || !shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        const waitTime =
          backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay * attempt;

        this.logger.debug(`Retry attempt ${attempt}/${attempts} after ${waitTime}ms`, {
          error: lastError.message,
        });

        await this.delay(waitTime);
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Execute promises with concurrency limit
   */
  static async concurrent<T>(
    tasks: (() => Promise<T>)[],
    limit: number,
  ): Promise<ConcurrentResult<T>[]> {
    const results: ConcurrentResult<T>[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const index = i;

      const promise = task!()
        .then((value) => {
          results[index] = { status: 'fulfilled', value, index };
        })
        .catch((reason) => {
          results[index] = { status: 'rejected', reason, index };
        });

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1,
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Delay helper
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a deferred promise
   */
  static deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
  } {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }

  /**
   * Execute promises in sequence
   */
  static async sequence<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];

    for (const task of tasks) {
      results.push(await task());
    }

    return results;
  }

  /**
   * Wait for the first successful promise
   */
  static async any<T>(promises: Promise<T>[]): Promise<T> {
    return Promise.any(promises).catch(() => {
      throw new Error('All promises rejected');
    });
  }

  /**
   * Create a cancellable promise
   */
  static cancellable<T>(
    executor: (
      resolve: (value: T) => void,
      reject: (reason?: unknown) => void,
      signal: AbortSignal,
    ) => void,
  ): { promise: Promise<T>; cancel: () => void } {
    const controller = new AbortController();

    const promise = new Promise<T>((resolve, reject) => {
      executor(resolve, reject, controller.signal);

      controller.signal.addEventListener('abort', () => {
        reject(new Error('Promise cancelled'));
      });
    });

    return {
      promise,
      cancel: () => controller.abort(),
    };
  }

  /**
   * Map with async function and concurrency control
   */
  static async map<T, R>(
    items: T[],
    mapper: (item: T, index: number) => Promise<R>,
    concurrency = Infinity,
  ): Promise<R[]> {
    const tasks = items.map((item, index) => () => mapper(item, index));
    const results = await this.concurrent(tasks, concurrency);

    return results.map((result) => {
      if (result.status === 'rejected') {
        throw result.reason;
      }
      return result.value!;
    });
  }

  /**
   * Filter with async predicate
   */
  static async filter<T>(
    items: T[],
    predicate: (item: T, index: number) => Promise<boolean>,
    concurrency = Infinity,
  ): Promise<T[]> {
    const results = await this.map(
      items,
      async (item, index) => ({
        item,
        keep: await predicate(item, index),
      }),
      concurrency,
    );

    return results.filter((result) => result.keep).map((result) => result.item);
  }

  /**
   * Memoize an async function
   */
  static memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
  ): T {
    const cache = new Map<string, Promise<ReturnType<T>>>();

    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const promise = fn(...args);
      cache.set(key, promise);

      // Remove from cache on error
      promise.catch(() => cache.delete(key));

      return promise;
    }) as T;
  }
}
