/**
 * Magic number constants used throughout the application
 */

// Animation and timing constants
export const ANIMATION_CONSTANTS = {
  DEFAULT_TRANSITION_DURATION: 1000, // milliseconds
  DEFAULT_AUTOPLAY_INTERVAL: 3000, // milliseconds
  MIN_AUTOPLAY_INTERVAL: 100, // milliseconds
  MIN_TRANSITION_DURATION: 0, // milliseconds
  MAX_TRANSITION_DURATION: 10000, // milliseconds
  IMAGE_LOAD_TIMEOUT: 30000, // milliseconds
  ERROR_RETRY_DELAY: 1000, // milliseconds
  DEFAULT_ANIMATION_FPS: 60,
} as const;

// Dimensions and sizes
export const DIMENSION_CONSTANTS = {
  DEFAULT_CANVAS_WIDTH: 800,
  DEFAULT_CANVAS_HEIGHT: 600,
  MAX_TEXTURE_SIZE: 4096,
  MIN_TEXTURE_SIZE: 1,
  DEFAULT_GRID_SIZE: 100,
  MAX_LOG_HISTORY_SIZE: 1000,
  DEFAULT_CAROUSEL_HEIGHT: '400px',
  FULL_WIDTH: '100%',
  FULL_HEIGHT: '100%',
} as const;

// WebGL constants
export const WEBGL_CONSTANTS = {
  // Shader versions
  WEBGL_VERSION_100: '100' as const,
  WEBGL_VERSION_300_ES: '300 es' as const,

  // Buffer sizes
  POSITION_COMPONENTS: 3,
  TEXCOORD_COMPONENTS: 2,
  COLOR_COMPONENTS: 4,

  // Vertex counts
  QUAD_VERTEX_COUNT: 4,
  TRIANGLE_STRIP_VERTEX_COUNT: 4,
} as const;

// Mathematical constants
export const MATH_CONSTANTS = {
  PI: Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  EPSILON: 0.001,
  RANDOM_SEED_1: 12.9898,
  RANDOM_SEED_2: 78.233,
  RANDOM_MULTIPLIER: 43758.5453,
} as const;

// UI constants
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768, // pixels
  DOT_SCALE_HOVER: 1.2,
  DOT_OPACITY_INACTIVE: 0.5,
  DOT_OPACITY_ACTIVE: 0.9,
  BUTTON_OPACITY_DEFAULT: 0.5,
  BUTTON_OPACITY_HOVER: 0.8,
} as const;

// Effect-specific constants
export const EFFECT_CONSTANTS = {
  // Glitch effect
  GLITCH_NOISE_SCALE: 100.0,
  GLITCH_NOISE_INTENSITY: 0.1,
  GLITCH_SCANLINE_FREQUENCY: 800.0,
  GLITCH_SCANLINE_INTENSITY: 0.04,

  // Wave effect
  WAVE_AMPLITUDE: 0.1,
  WAVE_FREQUENCY: 5.0,

  // Morph effect
  MORPH_GRID_DISTORTION_SCALE: 0.1,
  MORPH_DISTORTION_INTENSITY: 0.02,

  // Dissolve effect
  DISSOLVE_THRESHOLD: 0.5,

  // Vignette effect
  VIGNETTE_RADIUS: 0.5,
  VIGNETTE_INTENSITY: 0.5,
} as const;

// Network and server constants
export const NETWORK_CONSTANTS = {
  DEFAULT_PORT: 8888,
  DEV_SERVER_PORT: 5173,
  HTTP_STATUS_OK: 200,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_SERVER_ERROR: 500,
} as const;

// Test constants
export const TEST_CONSTANTS = {
  DEFAULT_TEST_TIMEOUT: 30000, // milliseconds
  E2E_GLOBAL_TIMEOUT: 600000, // 10 minutes in milliseconds
  ELEMENT_VISIBILITY_TIMEOUT: 10000, // milliseconds
  MAX_RETRY_COUNT: 3,
} as const;

// Validation constants
export const VALIDATION_CONSTANTS = {
  MIN_IMAGE_COUNT: 1,
  MAX_IMAGE_COUNT: 100,
  MIN_START_INDEX: 0,
} as const;

// Type guard for checking if a value is within a range
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Helper to get a clamped value
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Helper to normalize a value to 0-1 range
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// Helper to convert degrees to radians
export function degreesToRadians(degrees: number): number {
  return (degrees * MATH_CONSTANTS.PI) / 180;
}

// Helper to convert radians to degrees
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / MATH_CONSTANTS.PI;
}
