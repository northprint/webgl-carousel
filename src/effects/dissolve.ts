import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface DissolveOptions {
  scale?: number;
  threshold?: number;
  fadeWidth?: number;
}

export class DissolveEffect extends BaseEffect {
  name = 'dissolve';
  private scale: number;
  private threshold: number;
  private fadeWidth: number;

  constructor(options: DissolveOptions = {}) {
    super();
    this.scale = options.scale ?? 10.0;
    this.threshold = options.threshold ?? 0.5;
    this.fadeWidth = options.fadeWidth ?? 0.1;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform float uScale;
    uniform float uThreshold;
    uniform float uFadeWidth;
    
    // Simple pseudo-random function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Noise function
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
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Generate noise for dissolve effect
      float n = noise(vTexCoord * uScale);
      
      // Add some variation with multiple octaves
      n += noise(vTexCoord * uScale * 2.0) * 0.5;
      n += noise(vTexCoord * uScale * 4.0) * 0.25;
      n = n / 1.75; // Normalize
      
      // Calculate dissolve threshold
      float threshold = uProgress * (1.0 + uFadeWidth * 2.0) - uFadeWidth;
      
      // Create smooth transition
      float alpha = smoothstep(threshold - uFadeWidth, threshold + uFadeWidth, n);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix colors based on dissolve
      gl_FragColor = mix(color1, color0, alpha);
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uScale: this.scale,
      uThreshold: this.threshold,
      uFadeWidth: this.fadeWidth,
    };
  }
}