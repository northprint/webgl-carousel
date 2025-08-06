/**
 * Strict type definitions to improve type safety
 */

/**
 * Strictly typed object with no index signature
 */
export type StrictObject<T> = {
  [K in keyof T]: T[K];
};

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Function type with strict parameters
 */
export type StrictFunction<Args extends readonly unknown[], Return> = (...args: Args) => Return;

/**
 * Event handler type with strict typing
 */
export type StrictEventHandler<T = void> = T extends void ? () => void : (event: T) => void;

/**
 * Strictly typed WebGL context
 */
export type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

/**
 * Strictly typed canvas context
 */
export type CanvasContext = CanvasRenderingContext2D | WebGLContext | null;

/**
 * Numeric range type
 */
export type Range<Min extends number, Max extends number> = number & {
  __brand: 'Range';
  __min: Min;
  __max: Max;
};

/**
 * Create a range-validated number
 */
export function createRange<Min extends number, Max extends number>(
  value: number,
  min: Min,
  max: Max,
): Range<Min, Max> {
  if (value < min || value > max) {
    throw new Error(`Value ${value} is not in range [${min}, ${max}]`);
  }
  return value as Range<Min, Max>;
}

/**
 * Positive number type
 */
export type PositiveNumber = number & { __brand: 'PositiveNumber' };

/**
 * Create a positive number
 */
export function createPositiveNumber(value: number): PositiveNumber {
  if (value <= 0) {
    throw new Error(`Value ${value} is not positive`);
  }
  return value as PositiveNumber;
}

/**
 * URL string type
 */
export type URLString = string & { __brand: 'URLString' };

/**
 * Create a URL string
 */
export function createURLString(value: string): URLString {
  try {
    new URL(value);
    return value as URLString;
  } catch {
    // Try with a base URL for relative paths
    try {
      new URL(value, 'http://example.com');
      return value as URLString;
    } catch {
      throw new Error(`Invalid URL: ${value}`);
    }
  }
}

/**
 * CSS selector type
 */
export type CSSSelector = string & { __brand: 'CSSSelector' };

/**
 * Create a CSS selector
 */
export function createCSSSelector(value: string): CSSSelector {
  // Basic validation - just check it's not empty
  if (!value || value.trim().length === 0) {
    throw new Error('CSS selector cannot be empty');
  }
  return value as CSSSelector;
}

/**
 * Type-safe enum values
 */
export type EnumValue<T> = T[keyof T];

/**
 * Type-safe object keys
 */
export type Keys<T> = keyof T;

/**
 * Type-safe object values
 */
export type Values<T> = T[keyof T];

/**
 * Exact type matching (no excess properties)
 */
export type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;
