import { EventEmitter } from './EventEmitter';

export interface WebGLRendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
}

export interface WebGLRendererEvents extends Record<string, unknown[]> {
  contextLost: [];
  contextRestored: [];
  error: [Error];
}

export class WebGLRenderer extends EventEmitter<WebGLRendererEvents> {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private textures: Map<string, WebGLTexture> = new Map();
  private imageSizes: Map<string, { width: number; height: number }> = new Map();
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private attributes: Map<string, number> = new Map();
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

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.emit('contextLost');
  };

  private handleContextRestored = (): void => {
    this.initialize(this.canvas!);
    this.emit('contextRestored');
  };

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
      uniform vec2 uImageSize;
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
      
      varying vec2 vTexCoord;
      
      void main() {
        vec4 color0 = texture2D(uTexture0, vTexCoord);
        vec4 color1 = texture2D(uTexture1, vTexCoord);
        gl_FragColor = mix(color0, color1, uProgress);
      }
    `;

    this.setEffect({ vertexShader, fragmentShader });
  }

  setEffect(effect: { vertexShader: string; fragmentShader: string }): void {
    if (!this.gl) return;

    try {
      const program = this.createProgram(effect.vertexShader, effect.fragmentShader);
      if (program) {
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        this.program = program;
        this.cacheUniformsAndAttributes();
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Failed to link shader program: ${error}`);
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${error}`);
    }

    return shader;
  }

  private cacheUniformsAndAttributes(): void {
    if (!this.gl || !this.program) return;

    this.uniforms.clear();
    this.attributes.clear();

    // Get all active uniforms dynamically from the shader program
    const numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < numUniforms; i++) {
      const info = this.gl.getActiveUniform(this.program, i);
      if (info) {
        const location = this.gl.getUniformLocation(this.program, info.name);
        if (location) {
          this.uniforms.set(info.name, location);
        }
      }
    }

    // Get all active attributes dynamically from the shader program
    const numAttributes = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < numAttributes; i++) {
      const info = this.gl.getActiveAttrib(this.program, i);
      if (info) {
        const location = this.gl.getAttribLocation(this.program, info.name);
        if (location >= 0) {
          this.attributes.set(info.name, location);
        }
      }
    }
  }

  loadTexture(image: HTMLImageElement): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      image,
    );

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Cache texture with image src as key
    this.textures.set(image.src, texture);

    // Cache image size
    this.imageSizes.set(image.src, {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    });

    return texture;
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

    // Always bind texture1, use currentTexture as fallback if nextTexture is null
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, nextTexture || currentTexture);

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
    const imageSize0Loc = this.uniforms.get('uImageSize0');
    const imageSize1Loc = this.uniforms.get('uImageSize1');

    if (imageSize0Loc && currentImageSrc) {
      const size = this.imageSizes.get(currentImageSrc) || { width: 1, height: 1 };
      this.gl.uniform2f(imageSize0Loc, size.width, size.height);
    }

    if (imageSize1Loc && nextImageSrc) {
      const size = this.imageSizes.get(nextImageSrc) || { width: 1, height: 1 };
      this.gl.uniform2f(imageSize1Loc, size.width, size.height);
    }

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

  resize(width: number, height: number): void {
    if (!this.gl || !this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  dispose(): void {
    if (!this.gl) return;

    // Delete textures
    this.textures.forEach((texture) => {
      this.gl!.deleteTexture(texture);
    });
    this.textures.clear();

    // Delete buffers
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }

    // Delete program
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }

    this.gl = null;
    this.canvas = null;
    this.removeAllListeners();
  }

  isInitialized(): boolean {
    return this.gl !== null && this.program !== null;
  }

  getContext(): WebGLRenderingContext | null {
    return this.gl;
  }
}
