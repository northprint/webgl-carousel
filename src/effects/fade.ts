import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export class FadeEffect extends BaseEffect {
  readonly name = 'fade';

  readonly fragmentShader = createFragmentShader(`
    void main() {
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Simple linear fade
      gl_FragColor = mix(color0, color1, uProgress);
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
    };
  }
}
