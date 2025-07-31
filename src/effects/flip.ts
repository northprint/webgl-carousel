import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export type FlipAxis = 'horizontal' | 'vertical';

export class FlipEffect extends BaseEffect {
  readonly name: string;
  private axis: FlipAxis;

  constructor(axis: FlipAxis = 'horizontal') {
    super();
    this.axis = axis;
    this.name = `flip${axis.charAt(0).toUpperCase() + axis.slice(1)}`;
  }

  // Custom vertex shader for 3D flip effect
  readonly vertexShader = `
    precision mediump float;
    
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform float uAxis; // 0 for horizontal, 1 for vertical
    
    varying vec2 vTexCoord;
    varying float vProgress;
    varying float vBackface;
    
    mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
        0.0,                                 0.0,                                 0.0,                                 1.0
      );
    }
    
    void main() {
      vTexCoord = aTexCoord;
      vProgress = uProgress;
      
      // Create rotation axis based on flip direction
      vec3 axis = uAxis > 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      
      // Calculate rotation angle
      float angle = uProgress * 3.14159;
      
      // Apply rotation
      vec4 position = vec4(aPosition, 0.0, 1.0);
      position = rotationMatrix(axis, angle) * position;
      
      // Check if we're showing the backface
      vBackface = step(0.5, uProgress);
      
      // Apply perspective
      float perspective = 1.0 / (1.0 + position.z * 0.5);
      position.xy *= perspective;
      
      gl_Position = position;
    }
  `;

  readonly fragmentShader = createFragmentShader(`
    uniform float uAxis;
    varying float vProgress;
    varying float vBackface;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Determine which side is visible based on rotation angle
      // When progress > 0.5, we're seeing the back side
      bool isBackside = uProgress > 0.5;
      
      // Flip UV coordinates for back side to mirror the image correctly
      if (isBackside) {
        // Check if vertical flip
        if (uAxis > 0.5) {
          uv.y = 1.0 - uv.y;  // Flip vertically for vertical flip
        } else {
          uv.x = 1.0 - uv.x;  // Flip horizontally for horizontal flip
        }
      }
      
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(uv, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(uv, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Show texture0 on front side (progress < 0.5), texture1 on back side (progress >= 0.5)
      gl_FragColor = isBackside ? color1 : color0;
      
      // Add slight darkening during flip for better visual effect
      float darkness = 1.0 - abs(uProgress - 0.5) * 0.4;
      gl_FragColor.rgb *= darkness;
      
      // Handle backface culling - hide pixels that shouldn't be visible
      // This is important for proper 3D flip effect
      float angle = uProgress * 3.14159;
      float cosAngle = cos(angle);
      
      // For horizontal flip, check if we're viewing from behind
      if (uAxis < 0.5 && cosAngle < 0.0 && !isBackside) {
        discard;
      }
      // For vertical flip, similar check
      if (uAxis > 0.5 && cosAngle < 0.0 && !isBackside) {
        discard;
      }
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uAxis: this.axis === 'vertical' ? 1 : 0,
    };
  }
}
