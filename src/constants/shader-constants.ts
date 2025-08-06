/**
 * Shader constants as strings for GLSL code
 * Since we can't use template literals in shader strings,
 * we define these as comments that document the magic numbers
 */

// Random function constants (used in multiple shaders)
export const SHADER_RANDOM_SEED_1 = 12.9898;
export const SHADER_RANDOM_SEED_2 = 78.233;
export const SHADER_RANDOM_MULTIPLIER = 43758.5453;

// Mathematical constants
export const SHADER_PI = 3.14159;
export const SHADER_TWO_PI = 6.28318;
export const SHADER_HALF_PI = 1.5708;

// Glitch effect constants
export const SHADER_GLITCH_NOISE_SCALE = 100.0;
export const SHADER_GLITCH_NOISE_INTENSITY = 0.1;
export const SHADER_GLITCH_SCANLINE_FREQUENCY = 800.0;
export const SHADER_GLITCH_SCANLINE_INTENSITY = 0.04;

// Wave effect constants
export const SHADER_WAVE_AMPLITUDE = 0.1;
export const SHADER_WAVE_FREQUENCY = 5.0;

// Morph effect constants
export const SHADER_MORPH_GRID_DISTORTION_SCALE = 0.1;
export const SHADER_MORPH_DISTORTION_INTENSITY = 0.02;

// Dissolve effect constants
export const SHADER_DISSOLVE_THRESHOLD = 0.5;

// Vignette effect constants
export const SHADER_VIGNETTE_RADIUS = 0.5;
export const SHADER_VIGNETTE_INTENSITY = 0.5;

// WebGL version strings
export const SHADER_VERSION_100 = '#version 100';
export const SHADER_VERSION_300_ES = '#version 300 es';

// Precision declarations
export const SHADER_PRECISION_HIGH = 'precision highp float;';
export const SHADER_PRECISION_MEDIUM = 'precision mediump float;';
export const SHADER_PRECISION_LOW = 'precision lowp float;';

/**
 * Helper to generate GLSL constants definition
 */
export function generateGLSLConstants(): string {
  return `
    // Mathematical constants
    const float PI = ${SHADER_PI};
    const float TWO_PI = ${SHADER_TWO_PI};
    const float HALF_PI = ${SHADER_HALF_PI};
    
    // Random function constants
    const vec2 RANDOM_SEED = vec2(${SHADER_RANDOM_SEED_1}, ${SHADER_RANDOM_SEED_2});
    const float RANDOM_MULTIPLIER = ${SHADER_RANDOM_MULTIPLIER};
  `;
}

/**
 * Standard random function for shaders
 */
export function getRandomFunction(): string {
  return `
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(${SHADER_RANDOM_SEED_1}, ${SHADER_RANDOM_SEED_2}))) * ${SHADER_RANDOM_MULTIPLIER});
    }
  `;
}

/**
 * Standard noise function for shaders
 */
export function getNoiseFunction(): string {
  return `
    ${getRandomFunction()}
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
  `;
}
