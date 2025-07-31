import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface PixelDissolveOptions {
  pixelSize?: number;
  stagger?: number;
}

export class PixelDissolveEffect extends BaseEffect {
  name = 'pixelDissolve';
  private pixelSize: number;
  private stagger: number;

  constructor(options: PixelDissolveOptions = {}) {
    super();
    this.pixelSize = options.pixelSize ?? 20.0;
    this.stagger = options.stagger ?? 0.3;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform float uPixelSize;
    uniform float uStagger;
    
    // Simple pseudo-random function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Calculate pixel grid coordinates
      vec2 pixelCoord = floor(vTexCoord * uResolution / uPixelSize);
      
      // Generate random value per pixel
      float pixelRandom = random(pixelCoord);
      
      // Add some variation based on position
      float positionBias = (pixelCoord.x + pixelCoord.y) / (uResolution.x / uPixelSize + uResolution.y / uPixelSize);
      pixelRandom = mix(pixelRandom, positionBias, uStagger);
      
      // Calculate transition threshold
      float threshold = uProgress;
      
      // Determine pixel visibility with hard edge
      float alpha = step(pixelRandom, threshold);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix colors based on pixel visibility
      gl_FragColor = mix(color0, color1, alpha);
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uPixelSize: this.pixelSize,
      uStagger: this.stagger,
    };
  }
}
