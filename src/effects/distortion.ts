import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface DistortionOptions {
  intensity?: number;
  radius?: number;
  spiral?: number;
}

export class DistortionEffect extends BaseEffect {
  name = 'distortion';
  private intensity: number;
  private radius: number;
  private spiral: number;

  constructor(options: DistortionOptions = {}) {
    super();
    this.intensity = options.intensity ?? 0.5;
    this.radius = options.radius ?? 0.8;
    this.spiral = options.spiral ?? 2.0;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform float uIntensity;
    uniform float uRadius;
    uniform float uSpiral;
    
    vec2 distort(vec2 uv, float progress) {
      // Center the coordinates
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = uv - center;
      float dist = length(dir);
      
      // Create distortion effect
      float distortionAmount = 0.0;
      
      if (dist < uRadius) {
        // Smooth the edge of distortion
        float edge = smoothstep(0.0, uRadius, dist);
        
        // Calculate rotation based on distance and progress
        float angle = progress * uSpiral * (1.0 - edge);
        
        // Apply rotation
        float s = sin(angle);
        float c = cos(angle);
        dir = vec2(
          dir.x * c - dir.y * s,
          dir.x * s + dir.y * c
        );
        
        // Add radial distortion
        float radialDistort = (1.0 - edge) * progress * uIntensity;
        dir *= 1.0 + radialDistort;
      }
      
      return center + dir;
    }
    
    void main() {
      // Create two different distortion phases
      float phase1 = smoothstep(0.0, 0.5, uProgress);
      float phase2 = smoothstep(0.5, 1.0, uProgress);
      
      // Distort UV coordinates
      vec2 distortedUV0 = distort(vTexCoord, phase1);
      vec2 distortedUV1 = distort(vTexCoord, 1.0 - phase2);
      
      // Apply aspect ratio correction after distortion
      vec2 uv0 = getCoverUV(distortedUV0, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(distortedUV1, uImageSize1, uResolution);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix based on progress
      float mixFactor = smoothstep(0.4, 0.6, uProgress);
      
      gl_FragColor = mix(color0, color1, mixFactor);
      
      // Add vignette effect during transition
      float vignette = 1.0 - length(vTexCoord - 0.5) * 0.5 * sin(uProgress * 3.14159);
      gl_FragColor.rgb *= vignette;
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uIntensity: this.intensity,
      uRadius: this.radius,
      uSpiral: this.spiral,
    };
  }
}
