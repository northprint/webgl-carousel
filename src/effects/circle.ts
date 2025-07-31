import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface CircleOptions {
  centerX?: number;
  centerY?: number;
  feather?: number;
  scale?: number;
}

export class CircleEffect extends BaseEffect {
  name = 'circle';
  private centerX: number;
  private centerY: number;
  private feather: number;
  private scale: number;

  constructor(options: CircleOptions = {}) {
    super();
    this.centerX = options.centerX ?? 0.5;
    this.centerY = options.centerY ?? 0.5;
    this.feather = options.feather ?? 0.1;
    this.scale = options.scale ?? 1.0;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform vec2 uCenter;
    uniform float uFeather;
    uniform float uScale;
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Calculate distance from center
      vec2 center = uCenter;
      vec2 pos = vTexCoord - center;
      
      // Correct for aspect ratio
      float aspect = uResolution.x / uResolution.y;
      pos.x *= aspect;
      
      float dist = length(pos);
      
      // Calculate circle radius based on progress
      float radius = uProgress * uScale * sqrt(2.0); // sqrt(2) to cover corners
      
      // Create smooth edge
      float alpha = smoothstep(radius - uFeather, radius + uFeather, dist);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix based on circle mask
      gl_FragColor = mix(color1, color0, alpha);
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uCenter: [this.centerX, this.centerY],
      uFeather: this.feather,
      uScale: this.scale,
    };
  }
}
