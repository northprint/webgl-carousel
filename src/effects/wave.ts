import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface WaveOptions {
  amplitude?: number;
  frequency?: number;
  speed?: number;
}

export class WaveEffect extends BaseEffect {
  name = 'wave';
  private amplitude: number;
  private frequency: number;
  private speed: number;

  constructor(options: WaveOptions = {}) {
    super();
    this.amplitude = options.amplitude ?? 0.1;
    this.frequency = options.frequency ?? 10.0;
    this.speed = options.speed ?? 1.0;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform float uTime;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Create wave displacement
      float wave = sin(uv.y * uFrequency + uTime * uSpeed) * uAmplitude;
      
      // Apply wave based on progress
      float displacement = wave * (1.0 - abs(uProgress - 0.5) * 2.0);
      
      // Apply wave displacement then aspect ratio correction
      vec2 displacedUV0 = vec2(uv.x + displacement * (1.0 - uProgress), uv.y);
      vec2 displacedUV1 = vec2(uv.x + displacement * uProgress, uv.y);
      
      vec2 uv0 = getCoverUV(displacedUV0, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(displacedUV1, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix with wave-influenced progress
      float mixFactor = smoothstep(0.0, 1.0, uProgress + wave * 0.5);
      
      gl_FragColor = mix(color0, color1, mixFactor);
    }
  `);

  private startTime = Date.now();

  getUniforms(progress: number): Record<string, number | number[]> {
    const time = (Date.now() - this.startTime) / 1000; // Convert to seconds

    return {
      uProgress: progress,
      uAmplitude: this.amplitude,
      uFrequency: this.frequency,
      uSpeed: this.speed,
      uTime: time,
    };
  }

  onBeforeRender(_gl: WebGLRenderingContext): void {
    // Reset time on each transition start
    if (this.lastProgress === 0 && this.lastProgress !== undefined) {
      this.startTime = Date.now();
    }
    this.lastProgress = this.lastProgress ?? 0;
  }

  private lastProgress?: number;
}
