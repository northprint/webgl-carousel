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

  // カスタム頂点シェーダー - 画像を変形
  readonly vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform float uAxis;
    
    varying vec2 vTexCoord;
    
    void main() {
      vTexCoord = aTexCoord;
      
      // 回転角度
      float angle = uProgress * 3.14159;
      float scale = abs(cos(angle));
      
      vec2 position = aPosition;
      
      if (uAxis < 0.5) {
        // Horizontal flip - X方向のみ縮小
        position.x *= scale;
      } else {
        // Vertical flip - Y方向のみ縮小  
        position.y *= scale;
      }
      
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  readonly fragmentShader = createFragmentShader(`
    uniform float uAxis;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // 回転角度
      float angle = uProgress * 3.14159;
      float cosAngle = cos(angle);
      
      // スケール計算（0で完全に消える）
      float scale = abs(cosAngle);
      
      // 表裏の判定
      bool isBackface = cosAngle < 0.0;
      
      vec4 finalColor;
      
      if (!isBackface) {
        // 表面：1枚目の画像
        vec2 uv0 = getCoverUV(uv, uImageSize0, uResolution);
        finalColor = texture2D(uTexture0, uv0);
      } else {
        // 裏面：2枚目の画像
        vec2 uv1 = getCoverUV(uv, uImageSize1, uResolution);
        finalColor = texture2D(uTexture1, uv1);
      }
      
      // 軽いシェーディング効果
      float shading = 0.7 + 0.3 * scale;
      finalColor.rgb *= shading;
      
      gl_FragColor = finalColor;
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uAxis: this.axis === 'vertical' ? 1 : 0,
    };
  }
}
