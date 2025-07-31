import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface MorphOptions {
  gridSize?: number;
  morphIntensity?: number;
  twistAmount?: number;
  waveFrequency?: number;
}

export class MorphEffect extends BaseEffect {
  name = 'morph';
  private gridSize: number;
  private morphIntensity: number;
  private twistAmount: number;
  private waveFrequency: number;

  constructor(options: MorphOptions = {}) {
    super();
    this.gridSize = options.gridSize ?? 50.0;
    this.morphIntensity = options.morphIntensity ?? 0.3;
    this.twistAmount = options.twistAmount ?? 2.0;
    this.waveFrequency = options.waveFrequency ?? 3.0;
  }

  // カスタム頂点シェーダー - 頂点を動的に変形
  readonly vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform float uMorphIntensity;
    uniform float uTwistAmount;
    uniform float uWaveFrequency;
    uniform vec2 uResolution;
    
    varying vec2 vTexCoord;
    varying float vMorphAmount;
    
    void main() {
      vTexCoord = aTexCoord;
      
      // 中心からの距離を計算
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = aTexCoord - center;
      float dist = length(toCenter);
      
      // プログレスに基づくモーフ量を計算
      float morphProgress = smoothstep(0.0, 1.0, uProgress);
      float morphAmount = sin(morphProgress * 3.14159);
      vMorphAmount = morphAmount;
      
      // 頂点の変位を計算
      vec2 position = aPosition;
      
      // ツイスト効果
      float angle = atan(toCenter.y, toCenter.x);
      float twist = sin(angle * uWaveFrequency + morphProgress * uTwistAmount) * morphAmount;
      position.x += twist * toCenter.y * uMorphIntensity;
      position.y -= twist * toCenter.x * uMorphIntensity;
      
      // 波形効果
      float wave = sin(dist * 10.0 - morphProgress * 5.0) * morphAmount;
      position += normalize(toCenter) * wave * uMorphIntensity * 0.5;
      
      // Z軸の変位（3D効果）
      float z = sin(dist * 8.0 + morphProgress * 4.0) * morphAmount * 0.3;
      
      gl_Position = vec4(position, z, 1.0);
    }
  `;

  readonly fragmentShader = createFragmentShader(`
    uniform float uGridSize;
    varying float vMorphAmount;
    
    void main() {
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // グリッドベースの歪み
      vec2 gridUV = vTexCoord * uGridSize;
      vec2 gridPos = floor(gridUV);
      vec2 gridFract = fract(gridUV);
      
      // モーフ量に基づく歪み
      vec2 distortion = sin(gridPos * 0.1 + vMorphAmount * 3.14159) * 0.02 * vMorphAmount;
      
      vec2 distortedUV0 = uv0 + distortion;
      vec2 distortedUV1 = uv1 - distortion;
      
      vec4 color0 = texture2D(uTexture0, distortedUV0);
      vec4 color1 = texture2D(uTexture1, distortedUV1);
      
      // エッジ効果
      float edge = 1.0 - smoothstep(0.4, 0.5, abs(gridFract.x - 0.5)) * 
                         smoothstep(0.4, 0.5, abs(gridFract.y - 0.5));
      edge *= vMorphAmount;
      
      // カラーミックス
      float mixFactor = smoothstep(0.3, 0.7, uProgress);
      vec4 finalColor = mix(color0, color1, mixFactor);
      
      // エッジハイライト
      finalColor.rgb += vec3(edge * 0.2);
      
      // 色収差効果
      vec2 aberration = distortion * 2.0;
      finalColor.r = mix(
        texture2D(uTexture0, distortedUV0 + aberration).r,
        texture2D(uTexture1, distortedUV1 + aberration).r,
        mixFactor
      );
      finalColor.b = mix(
        texture2D(uTexture0, distortedUV0 - aberration).b,
        texture2D(uTexture1, distortedUV1 - aberration).b,
        mixFactor
      );
      
      gl_FragColor = finalColor;
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    return {
      uProgress: progress,
      uGridSize: this.gridSize,
      uMorphIntensity: this.morphIntensity,
      uTwistAmount: this.twistAmount,
      uWaveFrequency: this.waveFrequency,
    };
  }
}
