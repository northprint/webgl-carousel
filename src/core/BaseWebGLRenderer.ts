import { EventEmitter } from './EventEmitter';
import {
  createTexture as createWebGLTexture,
  compileShader as compileWebGLShader,
  createProgram as createWebGLProgram,
} from '../utils/webglHelpers';
import { ShaderType } from '../types/webgl';

export interface WebGLRendererEvents extends Record<string, unknown[]> {
  contextLost: [];
  contextRestored: [];
  error: [Error];
}

export abstract class BaseWebGLRenderer<
  TContext extends WebGLRenderingContext | WebGL2RenderingContext = WebGLRenderingContext,
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

    // Cache image size first (before checking for existing texture)
    if (!this.imageSizes.has(image.src)) {
      const imageSize = {
        width: image.naturalWidth || image.width || 800,
        height: image.naturalHeight || image.height || 600,
      };
      // Ensure we have valid dimensions
      if (imageSize.width === 0 || imageSize.height === 0) {
        imageSize.width = 800;
        imageSize.height = 600;
      }
      this.imageSizes.set(image.src, imageSize);
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

    // Use the helper function for consistent texture creation
    return createWebGLTexture(this.gl, image, {
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
      generateMipmap: false, // Base renderer doesn't use mipmaps
      flipY: false,
      premultiplyAlpha: false,
    });
  }

  // Common shader compilation logic
  protected compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;
    return compileWebGLShader(this.gl, source, type as ShaderType);
  }

  // Common program creation logic
  protected createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = compileWebGLShader(this.gl, vertexSource, ShaderType.VERTEX);
    const fragmentShader = compileWebGLShader(this.gl, fragmentSource, ShaderType.FRAGMENT);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) this.gl.deleteShader(vertexShader);
      if (fragmentShader) this.gl.deleteShader(fragmentShader);
      return null;
    }

    const program = createWebGLProgram(this.gl, vertexShader, fragmentShader);

    // Clean up shaders after linking
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
  protected setImageSizeUniforms(currentImageSrc?: string, nextImageSrc?: string): void {
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
