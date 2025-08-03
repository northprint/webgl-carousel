import { EventEmitter } from './EventEmitter';

export interface WebGLRendererEvents extends Record<string, unknown[]> {
  contextLost: [];
  contextRestored: [];
  error: [Error];
}

export abstract class BaseWebGLRenderer<
  TContext extends WebGLRenderingContext | WebGL2RenderingContext = WebGLRenderingContext
> extends EventEmitter<WebGLRendererEvents> {
  protected canvas: HTMLCanvasElement | null = null;
  protected gl: TContext | null = null;
  protected program: WebGLProgram | null = null;
  protected textures: Map<string, WebGLTexture> = new Map();
  protected imageSizes: Map<string, { width: number; height: number }> = new Map();
  protected uniforms: Map<string, WebGLUniformLocation> = new Map();
  protected attributes: Map<string, number> = new Map();

  // Abstract methods that must be implemented by subclasses
  abstract initialize(canvas: HTMLCanvasElement): boolean;
  abstract setEffect(effect: { vertexShader: string; fragmentShader: string }): void;
  abstract render(
    currentTexture: WebGLTexture | null,
    nextTexture: WebGLTexture | null,
    progress: number,
    additionalUniforms?: Record<string, number | number[] | Float32Array>,
    currentImageSrc?: string,
    nextImageSrc?: string,
  ): void;
  abstract dispose(): void;

  // Common texture loading logic
  loadTexture(image: HTMLImageElement): WebGLTexture | null {
    if (!this.gl) return null;

    const srcPreview = image.src.substring(0, 50) + '...';
    
    // Cache image size first (before checking for existing texture)
    if (!this.imageSizes.has(image.src)) {
      const imageSize = {
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      };
      this.imageSizes.set(image.src, imageSize);
    } else {
      const cachedSize = this.imageSizes.get(image.src);
    }

    // Check if texture already exists
    const existingTexture = this.textures.get(image.src);
    if (existingTexture) {
      return existingTexture;
    }

    const texture = this.createTexture(image);
    if (texture) {
      // Cache texture with image src as key
      this.textures.set(image.src, texture);
    }

    return texture;
  }

  // Template method for texture creation - can be overridden by subclasses
  protected createTexture(image: HTMLImageElement): WebGLTexture | null {
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

    return texture;
  }

  // Common shader compilation logic
  protected compileShader(source: string, type: number): WebGLShader | null {
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

  // Common program creation logic
  protected createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
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

  // Common uniform and attribute caching logic
  protected cacheUniformsAndAttributes(): void {
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

  // Common resize logic
  resize(width: number, height: number): void {
    if (!this.gl || !this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  // Common context lost/restored handlers
  protected handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.emit('contextLost');
  };

  protected handleContextRestored = (): void => {
    this.initialize(this.canvas!);
    this.emit('contextRestored');
  };

  // Common image size uniform setting logic
  protected setImageSizeUniforms(
    currentImageSrc?: string,
    nextImageSrc?: string,
  ): void {
    if (!this.gl || !this.canvas) return;

    const imageSize0Loc = this.uniforms.get('uImageSize0');
    const imageSize1Loc = this.uniforms.get('uImageSize1');

    if (imageSize0Loc) {
      const size = currentImageSrc ? this.imageSizes.get(currentImageSrc) : null;
      if (size && size.width > 0 && size.height > 0) {
        this.gl.uniform2f(imageSize0Loc, size.width, size.height);
      } else {
        // Default to a square aspect ratio instead of canvas size
        const defaultSize = Math.min(this.canvas.width, this.canvas.height);
        this.gl.uniform2f(imageSize0Loc, defaultSize, defaultSize);
      }
    }

    if (imageSize1Loc) {
      let size = null;
      if (nextImageSrc) {
        size = this.imageSizes.get(nextImageSrc);
      } else if (currentImageSrc) {
        // For initial render, use the same image size for both textures
        size = this.imageSizes.get(currentImageSrc);
      }
      
      if (size && size.width > 0 && size.height > 0) {
        this.gl.uniform2f(imageSize1Loc, size.width, size.height);
      } else {
        // Default to a square aspect ratio instead of canvas size
        const defaultSize = Math.min(this.canvas.width, this.canvas.height);
        this.gl.uniform2f(imageSize1Loc, defaultSize, defaultSize);
      }
    }
  }

  // Common cleanup logic
  protected disposeCommon(): void {
    if (!this.gl) return;

    // Delete textures
    this.textures.forEach((texture) => {
      this.gl!.deleteTexture(texture);
    });
    this.textures.clear();
    this.imageSizes.clear();

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

  getContext(): TContext | null {
    return this.gl;
  }
}