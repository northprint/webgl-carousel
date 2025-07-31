import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export class SlideEffect extends BaseEffect {
  readonly name: string;
  private direction: SlideDirection;

  constructor(direction: SlideDirection = 'left') {
    super();
    this.direction = direction;
    this.name = `slide${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
  }

  readonly fragmentShader = createFragmentShader(`
    uniform vec2 uDirection;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Calculate offset based on progress
      vec2 offset = uDirection * uProgress;
      
      // Sample textures with offset
      vec2 uv0 = uv + offset;
      vec2 uv1 = uv + offset - uDirection;
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Use step function to create hard edge
      float mask = step(0.0, uv1.x) * step(uv1.x, 1.0) * 
                   step(0.0, uv1.y) * step(uv1.y, 1.0);
      
      gl_FragColor = mix(color0, color1, mask);
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    let direction: number[] = [0, 0];

    switch (this.direction) {
      case 'left':
        direction = [-1, 0];
        break;
      case 'right':
        direction = [1, 0];
        break;
      case 'up':
        direction = [0, 1];
        break;
      case 'down':
        direction = [0, -1];
        break;
    }

    return {
      uProgress: progress,
      uDirection: direction,
    };
  }
}
