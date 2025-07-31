import { BaseEffect } from './BaseEffect';
import { createFragmentShader } from './shaderUtils';

export interface GlitchOptions {
  intensity?: number;
  sliceCount?: number;
  colorShift?: number;
  noiseAmount?: number;
}

export class GlitchEffect extends BaseEffect {
  name = 'glitch';
  private intensity: number;
  private sliceCount: number;
  private colorShift: number;
  private noiseAmount: number;
  private startTime: number;

  constructor(options: GlitchOptions = {}) {
    super();
    this.intensity = options.intensity ?? 0.5;
    this.sliceCount = options.sliceCount ?? 15.0;
    this.colorShift = options.colorShift ?? 0.03;
    this.noiseAmount = options.noiseAmount ?? 0.1;
    this.startTime = Date.now();
  }

  readonly fragmentShader = createFragmentShader(`
    uniform float uIntensity;
    uniform float uSliceCount;
    uniform float uColorShift;
    uniform float uNoiseAmount;
    uniform float uTime;
    
    // 擬似乱数生成
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // ノイズ関数
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
      vec2 uv = vTexCoord;
      
      // グリッチ強度の計算（時間ベース）
      float glitchStrength = step(0.5, sin(uTime * 20.0)) * uIntensity;
      glitchStrength *= step(0.8, random(vec2(uTime * 10.0, 0.0)));
      
      // プログレスに基づくグリッチの増減
      float progressGlitch = sin(uProgress * 3.14159);
      glitchStrength *= progressGlitch;
      
      // 水平スライスの計算
      float slice = floor(uv.y * uSliceCount);
      float sliceOffset = random(vec2(slice, uTime)) * 2.0 - 1.0;
      sliceOffset *= step(0.7, random(vec2(slice * 2.0, uTime * 10.0))) * glitchStrength;
      
      // UV座標の歪み
      vec2 distortedUV = uv;
      distortedUV.x += sliceOffset * 0.1;
      
      // ブロックノイズ
      vec2 blockSize = vec2(0.05, 0.03);
      vec2 blockCoord = floor(uv / blockSize) * blockSize;
      float blockNoise = step(0.9, random(blockCoord + vec2(uTime * 5.0))) * glitchStrength;
      distortedUV += blockNoise * (random(blockCoord * 2.0) - 0.5) * uNoiseAmount;
      
      // アスペクト比補正を適用
      vec2 uv0 = getCoverUV(distortedUV, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(distortedUV, uImageSize1, uResolution);
      
      // テクスチャサンプリング
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // RGB分離（グリッチ効果）
      vec4 color0Shift = vec4(
        texture2D(uTexture0, getCoverUV(distortedUV + vec2(uColorShift * glitchStrength, 0.0), uImageSize0, uResolution)).r,
        color0.g,
        texture2D(uTexture0, getCoverUV(distortedUV - vec2(uColorShift * glitchStrength, 0.0), uImageSize0, uResolution)).b,
        color0.a
      );
      
      vec4 color1Shift = vec4(
        texture2D(uTexture1, getCoverUV(distortedUV + vec2(uColorShift * glitchStrength, 0.0), uImageSize1, uResolution)).r,
        color1.g,
        texture2D(uTexture1, getCoverUV(distortedUV - vec2(uColorShift * glitchStrength, 0.0), uImageSize1, uResolution)).b,
        color1.a
      );
      
      // カラーミックス
      float mixFactor = smoothstep(0.3, 0.7, uProgress);
      vec4 finalColor = mix(color0Shift, color1Shift, mixFactor);
      
      // デジタルノイズ
      float digitalNoise = random(uv + vec2(uTime * 100.0)) * glitchStrength * 0.1;
      finalColor.rgb += vec3(digitalNoise);
      
      // カラー反転（ランダム）
      float invertChance = step(0.95, random(vec2(uTime * 30.0))) * glitchStrength;
      finalColor.rgb = mix(finalColor.rgb, 1.0 - finalColor.rgb, invertChance);
      
      // スキャンライン
      float scanline = sin(uv.y * 800.0) * 0.04 * glitchStrength;
      finalColor.rgb -= scanline;
      
      gl_FragColor = finalColor;
    }
  `);

  getUniforms(progress: number): Record<string, number | number[]> {
    const time = (Date.now() - this.startTime) / 1000;
    return {
      uProgress: progress,
      uIntensity: this.intensity,
      uSliceCount: this.sliceCount,
      uColorShift: this.colorShift,
      uNoiseAmount: this.noiseAmount,
      uTime: time,
    };
  }
}