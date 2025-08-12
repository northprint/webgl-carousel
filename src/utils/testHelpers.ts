/**
 * Test helper utilities for type-safe testing
 */

/**
 * Type-safe access to private properties for testing
 */
export function getPrivateProperty<T, K extends keyof T>(instance: T, propertyName: K): T[K] {
  return (instance as T)[propertyName];
}

/**
 * Type-safe setter for private properties for testing
 */
export function setPrivateProperty<T, K extends keyof T>(
  instance: T,
  propertyName: K,
  value: T[K],
): void {
  (instance as T)[propertyName] = value;
}

/**
 * Create a type-safe mock with partial implementation
 */
export function createMock<T>(partial: Partial<T>): T {
  return partial as T;
}

/**
 * Type guard for checking if a value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard for checking if a value is an error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safely cast to a specific type with runtime check
 */
export function safeCast<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  fallback: T,
): T {
  return validator(value) ? value : fallback;
}

/**
 * Create a typed spy function (for use with testing frameworks like Vitest)
 */
export function createSpy<T extends (...args: any[]) => any>(): T {
  // This is a placeholder - actual implementation should be provided by the testing framework
  return (() => {}) as T;
}
