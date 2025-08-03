class BaseEffect {
    constructor() {
        // Default vertex shader that can be overridden
        this.vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;
    }
    // WebGL 2.0 support
    get requiresWebGL2() {
        return false;
    }
    // Custom mesh support
    get requiresCustomMesh() {
        return false;
    }
    getMesh() {
        throw new Error('getMesh() must be implemented for effects that require custom meshes');
    }
    // Instance data for instanced rendering
    getInstanceData() {
        return {
            positions: new Float32Array(0),
            offsets: new Float32Array(0),
            scales: new Float32Array(0),
        };
    }
    // Transform feedback varyings for WebGL 2.0
    getTransformFeedbackVaryings() {
        return [];
    }
}

// Common shader functions and utilities
const commonShaderFunctions = `
  // Custom smooth step function for transitions
  float customSmoothstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  
  // Cubic easing function
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  
  // Linear interpolation
  vec4 mix4(vec4 a, vec4 b, float t) {
    return a * (1.0 - t) + b * t;
  }
  
  // 2D rotation matrix
  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
  
  // Convert normalized coordinates to aspect-corrected coordinates
  vec2 aspectCorrect(vec2 uv, vec2 resolution) {
    float aspect = resolution.x / resolution.y;
    return vec2(uv.x * aspect, uv.y);
  }
`;
const createFragmentShader = (effectCode, includeCommon = true) => {
    const common = includeCommon ? commonShaderFunctions : '';
    return `
    precision mediump float;
    
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform vec2 uImageSize0;
    uniform vec2 uImageSize1;
    
    varying vec2 vTexCoord;
    
    // Calculate UV coordinates for cover fit
    vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
      // Ensure we have valid sizes
      if (imageSize.x <= 0.0 || imageSize.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
        return uv;
      }
      
      float imageAspect = imageSize.x / imageSize.y;
      float canvasAspect = resolution.x / resolution.y;
      
      vec2 scale = vec2(1.0);
      if (imageAspect > canvasAspect) {
        // Image is wider, scale by height
        scale.x = imageAspect / canvasAspect;
      } else {
        // Image is taller, scale by width
        scale.y = canvasAspect / imageAspect;
      }
      
      // Center the UV coordinates
      vec2 scaledUV = (uv - 0.5) / scale + 0.5;
      
      return scaledUV;
    }
    
    ${common}
    
    ${effectCode}
  `;
};

class FadeEffect extends BaseEffect {
    constructor() {
        super(...arguments);
        this.name = 'fade';
        this.fragmentShader = createFragmentShader(`
    void main() {
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Simple linear fade
      gl_FragColor = mix(color0, color1, uProgress);
    }
  `);
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
        };
    }
}

class SlideEffect extends BaseEffect {
    constructor(direction = 'left') {
        super();
        this.fragmentShader = createFragmentShader(`
    uniform vec2 uDirection;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Calculate offset based on progress
      vec2 offset = uDirection * uProgress;
      
      // Calculate UVs for both images with proper aspect ratio
      vec2 uv0 = getCoverUV(uv + offset, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(uv + offset - uDirection, uImageSize1, uResolution);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Calculate transition boundary
      vec2 transitionUV = uv + offset - uDirection;
      
      // Create mask based on direction
      float mask;
      if (abs(uDirection.x) > 0.5) {
        // Horizontal slide
        mask = step(0.0, transitionUV.x) * step(transitionUV.x, 1.0);
      } else {
        // Vertical slide
        mask = step(0.0, transitionUV.y) * step(transitionUV.y, 1.0);
      }
      
      gl_FragColor = mix(color0, color1, mask);
    }
  `);
        this.direction = direction;
        this.name = `slide${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    }
    getUniforms(progress) {
        let direction = [0, 0];
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

class FlipEffect extends BaseEffect {
    constructor(axis = 'horizontal') {
        super();
        // カスタム頂点シェーダー - 画像を変形
        this.vertexShader = `
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
        this.fragmentShader = createFragmentShader(`
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
        this.axis = axis;
        this.name = `flip${axis.charAt(0).toUpperCase() + axis.slice(1)}`;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uAxis: this.axis === 'vertical' ? 1 : 0,
        };
    }
}

class WaveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'wave';
        this.fragmentShader = createFragmentShader(`
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
        this.startTime = Date.now();
        this.amplitude = options.amplitude ?? 0.1;
        this.frequency = options.frequency ?? 10.0;
        this.speed = options.speed ?? 1.0;
    }
    getUniforms(progress) {
        const time = (Date.now() - this.startTime) / 1000; // Convert to seconds
        return {
            uProgress: progress,
            uAmplitude: this.amplitude,
            uFrequency: this.frequency,
            uSpeed: this.speed,
            uTime: time,
        };
    }
    onBeforeRender(_gl) {
        // Reset time on each transition start
        if (this.lastProgress === 0 && this.lastProgress !== undefined) {
            this.startTime = Date.now();
        }
        this.lastProgress = this.lastProgress ?? 0;
    }
}

class DistortionEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'distortion';
        this.fragmentShader = createFragmentShader(`
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
        this.intensity = options.intensity ?? 0.5;
        this.radius = options.radius ?? 0.8;
        this.spiral = options.spiral ?? 2.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uIntensity: this.intensity,
            uRadius: this.radius,
            uSpiral: this.spiral,
        };
    }
}

class DissolveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'dissolve';
        this.fragmentShader = createFragmentShader(`
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
        this.scale = options.scale ?? 10.0;
        this.threshold = options.threshold ?? 0.5;
        this.fadeWidth = options.fadeWidth ?? 0.1;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uScale: this.scale,
            uThreshold: this.threshold,
            uFadeWidth: this.fadeWidth,
        };
    }
}

class CircleEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'circle';
        this.fragmentShader = createFragmentShader(`
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
        this.centerX = options.centerX ?? 0.5;
        this.centerY = options.centerY ?? 0.5;
        this.feather = options.feather ?? 0.1;
        this.scale = options.scale ?? 1.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uCenter: [this.centerX, this.centerY],
            uFeather: this.feather,
            uScale: this.scale,
        };
    }
}

class PixelDissolveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'pixelDissolve';
        this.fragmentShader = createFragmentShader(`
    uniform float uPixelSize;
    uniform float uStagger;
    
    // Simple pseudo-random function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Calculate pixel grid coordinates
      vec2 pixelCoord = floor(vTexCoord * uResolution / uPixelSize);
      
      // Generate random value per pixel
      float pixelRandom = random(pixelCoord);
      
      // Add some variation based on position
      float positionBias = (pixelCoord.x + pixelCoord.y) / (uResolution.x / uPixelSize + uResolution.y / uPixelSize);
      pixelRandom = mix(pixelRandom, positionBias, uStagger);
      
      // Calculate transition threshold
      float threshold = uProgress;
      
      // Determine pixel visibility with hard edge
      float alpha = step(pixelRandom, threshold);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix colors based on pixel visibility
      gl_FragColor = mix(color0, color1, alpha);
    }
  `);
        this.pixelSize = options.pixelSize ?? 20.0;
        this.stagger = options.stagger ?? 0.3;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uPixelSize: this.pixelSize,
            uStagger: this.stagger,
        };
    }
}

class MorphEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'morph';
        // カスタム頂点シェーダー - 頂点を動的に変形
        this.vertexShader = `
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
        this.fragmentShader = createFragmentShader(`
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
        this.gridSize = options.gridSize ?? 50.0;
        this.morphIntensity = options.morphIntensity ?? 0.3;
        this.twistAmount = options.twistAmount ?? 2.0;
        this.waveFrequency = options.waveFrequency ?? 3.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uGridSize: this.gridSize,
            uMorphIntensity: this.morphIntensity,
            uTwistAmount: this.twistAmount,
            uWaveFrequency: this.waveFrequency,
        };
    }
}

class GlitchEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'glitch';
        this.fragmentShader = createFragmentShader(`
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
        this.intensity = options.intensity ?? 0.5;
        this.sliceCount = options.sliceCount ?? 15.0;
        this.colorShift = options.colorShift ?? 0.03;
        this.noiseAmount = options.noiseAmount ?? 0.1;
        this.startTime = Date.now();
    }
    getUniforms(progress) {
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

/**
 * Custom effect that allows loading external shaders
 */
class CustomEffect extends BaseEffect {
    constructor(options) {
        super();
        this.name = options.name;
        this.vertexShader = options.vertexShader;
        this.fragmentShader = options.fragmentShader;
        this.uniformsGetter = options.uniforms;
        this._requiresWebGL2 = options.requiresWebGL2 ?? false;
        this._requiresCustomMesh = options.requiresCustomMesh ?? false;
        this._getMesh = options.getMesh;
        this._getInstanceData = options.getInstanceData;
        this._getTransformFeedbackVaryings = options.getTransformFeedbackVaryings;
    }
    getUniforms(progress) {
        const baseUniforms = {
            uProgress: progress,
        };
        if (this.uniformsGetter) {
            return { ...baseUniforms, ...this.uniformsGetter() };
        }
        return baseUniforms;
    }
    get requiresWebGL2() {
        return this._requiresWebGL2;
    }
    get requiresCustomMesh() {
        return this._requiresCustomMesh;
    }
    getMesh() {
        if (this._getMesh) {
            const mesh = this._getMesh();
            return {
                positions: mesh.positions,
                indices: mesh.indices,
                texCoords: new Float32Array(0), // Default empty
                normals: new Float32Array(0), // Default empty
                triangles: [],
            };
        }
        throw new Error('getMesh() not implemented for this custom effect');
    }
    getInstanceData() {
        if (this._getInstanceData) {
            const data = this._getInstanceData();
            if (data) {
                // Convert Float32Array to the expected format
                return {
                    positions: data,
                    offsets: new Float32Array(0),
                    scales: new Float32Array(0),
                };
            }
        }
        // Return empty data instead of null to match BaseEffect
        return {
            positions: new Float32Array(0),
            offsets: new Float32Array(0),
            scales: new Float32Array(0),
        };
    }
    getTransformFeedbackVaryings() {
        if (this._getTransformFeedbackVaryings) {
            return this._getTransformFeedbackVaryings();
        }
        return [];
    }
}
/**
 * Helper function to create a custom effect from external shader files
 */
async function createCustomEffectFromFiles(name, vertexShaderUrl, fragmentShaderUrl, options) {
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch(vertexShaderUrl).then((r) => r.text()),
        fetch(fragmentShaderUrl).then((r) => r.text()),
    ]);
    return new CustomEffect({
        name,
        vertexShader,
        fragmentShader,
        ...options,
    });
}
/**
 * Helper function to create a custom effect from shader strings
 */
function createCustomEffect(name, vertexShader, fragmentShader, options) {
    // Use default vertex shader if not provided
    const defaultVertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;
    return new CustomEffect({
        name,
        vertexShader: vertexShader || defaultVertexShader,
        fragmentShader,
        ...options,
    });
}

// Re-export all effects
// Create and export singleton instances
const fadeEffect = new FadeEffect();
const slideLeftEffect = new SlideEffect('left');
const slideRightEffect = new SlideEffect('right');
const slideUpEffect = new SlideEffect('up');
const slideDownEffect = new SlideEffect('down');
const flipHorizontalEffect = new FlipEffect('horizontal');
const flipVerticalEffect = new FlipEffect('vertical');
const waveEffect = new WaveEffect();
const gentleWaveEffect = new WaveEffect({ amplitude: 0.05, frequency: 5.0, speed: 0.5 });
const intenseWaveEffect = new WaveEffect({ amplitude: 0.2, frequency: 15.0, speed: 2.0 });
const distortionEffect = new DistortionEffect();
const subtleDistortionEffect = new DistortionEffect({
    intensity: 0.3,
    radius: 0.6,
    spiral: 1.0,
});
const extremeDistortionEffect = new DistortionEffect({
    intensity: 1.0,
    radius: 1.0,
    spiral: 4.0,
});
const dissolveEffect = new DissolveEffect();
const smoothDissolveEffect = new DissolveEffect({
    scale: 5.0,
    threshold: 0.5,
    fadeWidth: 0.2,
});
const pixelDissolveEffect = new PixelDissolveEffect();
const largePixelDissolveEffect = new PixelDissolveEffect({
    pixelSize: 40.0,
    stagger: 0.2,
});
const smallPixelDissolveEffect = new PixelDissolveEffect({
    pixelSize: 10.0,
    stagger: 0.4,
});
const circleEffect = new CircleEffect();
const circleFromCenterEffect = new CircleEffect({
    centerX: 0.5,
    centerY: 0.5,
    feather: 0.05,
    scale: 1.2,
});
const circleFromCornerEffect = new CircleEffect({
    centerX: 0.0,
    centerY: 0.0,
    feather: 0.1,
    scale: 1.5,
});
const morphEffect = new MorphEffect();
const intenseMorphEffect = new MorphEffect({
    gridSize: 100.0,
    morphIntensity: 0.5,
    twistAmount: 4.0,
    waveFrequency: 5.0,
});
const glitchEffect = new GlitchEffect();
const intenseGlitchEffect = new GlitchEffect({
    intensity: 0.8,
    sliceCount: 25.0,
    colorShift: 0.05,
    noiseAmount: 0.2,
});
const subtleGlitchEffect = new GlitchEffect({
    intensity: 0.3,
    sliceCount: 10.0,
    colorShift: 0.02,
    noiseAmount: 0.05,
});
// Set unique names for effect variants
gentleWaveEffect.name = 'gentleWave';
intenseWaveEffect.name = 'intenseWave';
subtleDistortionEffect.name = 'subtleDistortion';
extremeDistortionEffect.name = 'extremeDistortion';
pixelDissolveEffect.name = 'pixelDissolve';
smoothDissolveEffect.name = 'smoothDissolve';
circleFromCenterEffect.name = 'circleFromCenter';
circleFromCornerEffect.name = 'circleFromCorner';
largePixelDissolveEffect.name = 'largePixelDissolve';
smallPixelDissolveEffect.name = 'smallPixelDissolve';
intenseMorphEffect.name = 'intenseMorph';
intenseGlitchEffect.name = 'intenseGlitch';
subtleGlitchEffect.name = 'subtleGlitch';
// Collection of all default effects
function getDefaultEffects() {
    return [
        fadeEffect,
        slideLeftEffect,
        slideRightEffect,
        slideUpEffect,
        slideDownEffect,
        flipHorizontalEffect,
        flipVerticalEffect,
        waveEffect,
        gentleWaveEffect,
        intenseWaveEffect,
        distortionEffect,
        subtleDistortionEffect,
        extremeDistortionEffect,
        dissolveEffect,
        pixelDissolveEffect,
        largePixelDissolveEffect,
        smallPixelDissolveEffect,
        smoothDissolveEffect,
        circleEffect,
        circleFromCenterEffect,
        circleFromCornerEffect,
        morphEffect,
        intenseMorphEffect,
        glitchEffect,
        intenseGlitchEffect,
        subtleGlitchEffect,
    ];
}
// Helper to register all default effects
function registerDefaultEffects(manager) {
    getDefaultEffects().forEach((effect) => manager.register(effect));
}

export { BaseEffect, CircleEffect, CustomEffect, DissolveEffect, DistortionEffect, FadeEffect, FlipEffect, GlitchEffect, MorphEffect, PixelDissolveEffect, SlideEffect, WaveEffect, circleEffect, circleFromCenterEffect, circleFromCornerEffect, commonShaderFunctions, createCustomEffect, createCustomEffectFromFiles, createFragmentShader, dissolveEffect, distortionEffect, extremeDistortionEffect, fadeEffect, flipHorizontalEffect, flipVerticalEffect, gentleWaveEffect, getDefaultEffects, glitchEffect, intenseGlitchEffect, intenseMorphEffect, intenseWaveEffect, largePixelDissolveEffect, morphEffect, pixelDissolveEffect, registerDefaultEffects, slideDownEffect, slideLeftEffect, slideRightEffect, slideUpEffect, smallPixelDissolveEffect, smoothDissolveEffect, subtleDistortionEffect, subtleGlitchEffect, waveEffect };
//# sourceMappingURL=carousel-effects.esm.js.map
