// Common shader functions and utilities

export const commonShaderFunctions = `
  // Custom smooth step function for transitions
  float customSmoothstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  
  // Cubic easing function
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  
  // Linear interpolation
  vec4 mix4(vec4 a, vec4 b, float t) {
    return a * (1.0 - t) + b * t;
  }
  
  // 2D rotation matrix
  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
  
  // Convert normalized coordinates to aspect-corrected coordinates
  vec2 aspectCorrect(vec2 uv, vec2 resolution) {
    float aspect = resolution.x / resolution.y;
    return vec2(uv.x * aspect, uv.y);
  }
`;

export const createFragmentShader = (effectCode: string, includeCommon = true): string => {
  const common = includeCommon ? commonShaderFunctions : '';

  return `
    precision mediump float;
    
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform vec2 uImageSize0;
    uniform vec2 uImageSize1;
    
    varying vec2 vTexCoord;
    
    // Calculate UV coordinates for cover fit
    vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
      // Ensure we have valid sizes
      if (imageSize.x <= 0.0 || imageSize.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
        return uv;
      }
      
      float imageAspect = imageSize.x / imageSize.y;
      float canvasAspect = resolution.x / resolution.y;
      
      vec2 scale = vec2(1.0);
      if (imageAspect > canvasAspect) {
        // Image is wider, scale by height
        scale.x = imageAspect / canvasAspect;
      } else {
        // Image is taller, scale by width
        scale.y = canvasAspect / imageAspect;
      }
      
      // Center the UV coordinates
      vec2 scaledUV = (uv - 0.5) / scale + 0.5;
      
      return scaledUV;
    }
    
    ${common}
    
    ${effectCode}
  `;
};
