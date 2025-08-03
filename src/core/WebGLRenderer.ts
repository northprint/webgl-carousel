import { BaseWebGLRenderer } from './BaseWebGLRenderer';

export interface WebGLRendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
}

export class WebGLRenderer extends BaseWebGLRenderer<WebGLRenderingContext> {
  private vertexBuffer: WebGLBuffer | null = null;
  private options: WebGLRendererOptions;

  constructor(options: WebGLRendererOptions = {}) {
    super();
    this.options = {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      ...options,
    };
  }

  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;

    try {
      this.gl =
        (canvas.getContext('webgl', this.options) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl', this.options) as WebGLRenderingContext | null);

      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      this.setupEventListeners();
      this.initializeVertexBuffer();
      this.setDefaultEffect();

      return true;
    } catch (error) {
      this.emit('error', error as Error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private initializeVertexBuffer(): void {
    if (!this.gl) return;

    // Y texture coordinates are flipped to correct for WebGL's coordinate system
    const vertices = new Float32Array([
      -1.0,
      -1.0,
      0.0,
      1.0, // Bottom-left
      1.0,
      -1.0,
      1.0,
      1.0, // Bottom-right
      -1.0,
      1.0,
      0.0,
      0.0, // Top-left
      1.0,
      1.0,
      1.0,
      0.0, // Top-right
    ]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  private setDefaultEffect(): void {
    const vertexShader = `
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      varying vec2 vTexCoord;
      
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        vTexCoord = aTexCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform float uProgress;
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      
      varying vec2 vTexCoord;
      
      // getCoverUV function for proper aspect ratio handling
      vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
        float imageAspect = imageSize.x / imageSize.y;
        float screenAspect = resolution.x / resolution.y;
        vec2 scale;
        
        if (screenAspect > imageAspect) {
          scale = vec2(1.0, imageAspect / screenAspect);
        } else {
          scale = vec2(screenAspect / imageAspect, 1.0);
        }
        
        return (uv - 0.5) / scale + 0.5;
      }
      
      void main() {
        vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
        vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
        
        vec4 color0 = texture2D(uTexture0, uv0);
        vec4 color1 = texture2D(uTexture1, uv1);
        gl_FragColor = mix(color0, color1, uProgress);
      }
    `;

    this.setEffect({ vertexShader, fragmentShader });
  }

  setEffect(effect: { vertexShader: string; fragmentShader: string }): void {
    if (!this.gl) return;

    try {
      const program = super.createProgram(effect.vertexShader, effect.fragmentShader);
      if (program) {
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        this.program = program;
        super.cacheUniformsAndAttributes();
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }





  render(
    currentTexture: WebGLTexture | null,
    nextTexture: WebGLTexture | null,
    progress: number,
    additionalUniforms?: Record<string, number | number[] | Float32Array>,
    currentImageSrc?: string,
    nextImageSrc?: string,
  ): void {
    if (!this.gl || !this.program || !currentTexture) return;

    this.gl.useProgram(this.program);

    // Clear
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Bind vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    // Set attributes
    const positionLoc = this.attributes.get('aPosition');
    const texCoordLoc = this.attributes.get('aTexCoord');

    if (positionLoc !== undefined) {
      this.gl.enableVertexAttribArray(positionLoc);
      this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 4 * 4, 0);
    }

    if (texCoordLoc !== undefined) {
      this.gl.enableVertexAttribArray(texCoordLoc);
      this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 4 * 4, 2 * 4);
    }

    // Bind textures
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);

    // Bind texture1 - nextTexture if available, otherwise bind current texture
    this.gl.activeTexture(this.gl.TEXTURE1);
    if (nextTexture) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, nextTexture);
    } else {
      // For single texture rendering, bind currentTexture to both slots
      this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
    }

    // Set uniforms
    const texture0Loc = this.uniforms.get('uTexture0');
    const texture1Loc = this.uniforms.get('uTexture1');
    const progressLoc = this.uniforms.get('uProgress');

    if (texture0Loc) this.gl.uniform1i(texture0Loc, 0);
    if (texture1Loc) this.gl.uniform1i(texture1Loc, 1);
    if (progressLoc) this.gl.uniform1f(progressLoc, progress);

    // Set resolution uniform if available
    const resolutionLoc = this.uniforms.get('uResolution');
    if (resolutionLoc && this.canvas) {
      this.gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
    }

    // Set image size uniforms
    super.setImageSizeUniforms(currentImageSrc, nextImageSrc);

    // Set additional uniforms
    if (additionalUniforms) {
      Object.entries(additionalUniforms).forEach(([name, value]) => {
        const location = this.gl!.getUniformLocation(this.program!, name);
        if (location) {
          if (Array.isArray(value) || value instanceof Float32Array) {
            const len = value.length;
            switch (len) {
              case 2:
                this.gl!.uniform2fv(location, value as Float32Array | number[]);
                break;
              case 3:
                this.gl!.uniform3fv(location, value as Float32Array | number[]);
                break;
              case 4:
                this.gl!.uniform4fv(location, value as Float32Array | number[]);
                break;
              default:
                if (len === 1) {
                  this.gl!.uniform1f(location, (value as number[])[0] ?? 0);
                }
                break;
            }
          } else if (typeof value === 'number') {
            this.gl!.uniform1f(location, value);
          }
        }
      });
    }

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }


  dispose(): void {
    if (!this.gl) return;

    // Delete vertex buffer
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }

    // Call parent dispose
    super.disposeCommon();
  }

}
