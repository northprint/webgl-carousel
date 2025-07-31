import { BaseEffect } from './BaseEffect';

export interface PageFlipOptions {
  perspective?: number;
  depth?: number;
  shadow?: number;
}

export class PageFlipEffect extends BaseEffect {
  name = 'pageFlip';
  private perspective: number;
  private depth: number;
  private shadow: number;

  constructor(options: PageFlipOptions = {}) {
    super();
    this.perspective = options.perspective ?? 800;
    this.depth = options.depth ?? 40;
    this.shadow = options.shadow ?? 0.5;
  }

  readonly vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform float uPerspective;
    uniform float uDepth;
    
    varying vec2 vTexCoord;
    varying float vIsFlipping;
    varying float vShadow;
    
    void main() {
      vTexCoord = aTexCoord;
      vec4 position = vec4(aPosition, 0.0, 1.0);
      
      // Determine if this vertex is part of the flipping page (right half)
      float isRightSide = step(0.0, aPosition.x);
      vIsFlipping = isRightSide;
      
      if (isRightSide > 0.5) {
        // This is the right side that flips
        float angle = uProgress * 3.14159;
        float cosAngle = cos(angle);
        float sinAngle = sin(angle);
        
        // Translate to origin (left edge of right page)
        position.x = aPosition.x;
        
        // Apply rotation around Y axis at x=0
        float newX = position.x * cosAngle;
        float newZ = position.x * sinAngle;
        
        position.x = newX;
        position.z = newZ * uDepth;
        
        // Apply perspective
        position.x = position.x / (1.0 + position.z / uPerspective);
        position.y = position.y / (1.0 + position.z / uPerspective);
        
        // Calculate shadow
        vShadow = 1.0 - sinAngle * 0.5;
      } else {
        vShadow = 1.0;
      }
      
      gl_Position = position;
    }
  `;

  readonly fragmentShader = `
    precision mediump float;
    
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform vec2 uImageSize0;
    uniform vec2 uImageSize1;
    uniform float uShadowStrength;
    
    varying vec2 vTexCoord;
    varying float vIsFlipping;
    varying float vShadow;
    
    // Calculate UV coordinates for cover fit
    vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
      if (imageSize.x <= 0.0 || imageSize.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
        return uv;
      }
      
      float imageAspect = imageSize.x / imageSize.y;
      float canvasAspect = resolution.x / resolution.y;
      
      vec2 scale = vec2(1.0);
      if (imageAspect > canvasAspect) {
        scale.x = imageAspect / canvasAspect;
      } else {
        scale.y = canvasAspect / imageAspect;
      }
      
      return (uv - 0.5) / scale + 0.5;
    }
    
    void main() {
      vec4 color;
      
      if (vIsFlipping > 0.5) {
        // Right side (flipping page)
        if (uProgress < 0.5) {
          // First half of flip - show front of page (current image)
          vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
          color = texture2D(uTexture0, uv0);
        } else {
          // Second half of flip - show back of page (next image, flipped)
          vec2 flippedCoord = vec2(1.0 - vTexCoord.x, vTexCoord.y);
          vec2 uv1 = getCoverUV(flippedCoord, uImageSize1, uResolution);
          color = texture2D(uTexture1, uv1);
        }
        
        // Apply shadow
        color.rgb *= mix(1.0 - uShadowStrength, 1.0, vShadow);
      } else {
        // Left side (static)
        if (uProgress < 0.5) {
          // Show current image on left side
          vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
          color = texture2D(uTexture0, uv0);
        } else {
          // Show next image on left side after flip passes halfway
          vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
          color = texture2D(uTexture1, uv1);
        }
        
        // Add shadow from the flipping page
        if (uProgress > 0.0 && uProgress < 1.0) {
          float shadowDistance = 1.0 - vTexCoord.x;
          float shadowFactor = 1.0 - shadowDistance * uProgress * uShadowStrength * 0.5;
          color.rgb *= shadowFactor;
        }
      }
      
      gl_FragColor = color;
    }
  `;

  getUniforms(progress: number): Record<string, number | number[] | Float32Array> {
    return {
      uProgress: progress,
      uPerspective: this.perspective,
      uDepth: this.depth,
      uShadowStrength: this.shadow,
    };
  }
}
