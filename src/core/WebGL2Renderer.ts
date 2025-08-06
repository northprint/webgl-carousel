import { BaseWebGLRenderer } from './BaseWebGLRenderer';
import { Logger } from '../utils/Logger';
import {
  createTexture as createWebGLTexture,
  createRenderTexture,
  compileShader as compileWebGLShader,
  createProgram as createWebGLProgram,
} from '../utils/webglHelpers';
import { ShaderType } from '../types/webgl';

export interface WebGL2RendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}

export interface MeshData {
  vertices: Float32Array;
  indices: Uint16Array;
  normals?: Float32Array;
  texCoords: Float32Array;
  instanceData?: Float32Array;
}

export interface TransformFeedbackData {
  buffers: WebGLBuffer[];
  varyings: string[];
}

export class WebGL2Renderer extends BaseWebGLRenderer<WebGL2RenderingContext> {
  private vertexArray: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private uniformBlockIndices: Map<string, number> = new Map();
  private options: WebGL2RendererOptions;
  private meshData: MeshData | null = null;
  private transformFeedback: WebGLTransformFeedback | null = null;
  private computeTextures: Map<string, WebGLTexture> = new Map();

  constructor(options: WebGL2RendererOptions = {}) {
    super();
    this.options = {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      ...options,
    };
  }

  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;

    try {
      this.gl = canvas.getContext('webgl2', this.options) as WebGL2RenderingContext | null;

      if (!this.gl) {
        throw new Error('WebGL 2.0 not supported');
      }

      // Enable WebGL 2.0 features
      // Disable depth test for 2D rendering
      this.gl.disable(this.gl.DEPTH_TEST);
      // Disable face culling for 2D quad
      this.gl.disable(this.gl.CULL_FACE);

      // Enable blending for transparency
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      this.setupEventListeners();
      this.initializeDefaultMesh();
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

  private initializeDefaultMesh(): void {
    if (!this.gl) return;

    // Create VAO and set up default quad
    this.vertexArray = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vertexArray);

    // Setup simple quad vertices (interleaved position and texCoord)
    // With flipY: true in texture, use normal texture coordinates
    const vertices = new Float32Array([
      -1.0,
      -1.0,
      0.0,
      0.0,
      0.0, // Bottom-left: position(x,y,z), texCoord(u,v)
      1.0,
      -1.0,
      0.0,
      1.0,
      0.0, // Bottom-right
      -1.0,
      1.0,
      0.0,
      0.0,
      1.0, // Top-left
      1.0,
      1.0,
      0.0,
      1.0,
      1.0, // Top-right
    ]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Note: Attributes will be set up later when program is created

    // Unbind VAO
    this.gl.bindVertexArray(null);
  }

  setMesh(meshData: MeshData): void {
    if (!this.gl) return;

    this.meshData = meshData;

    // Create new VAO for custom mesh
    if (this.vertexArray) {
      this.gl.deleteVertexArray(this.vertexArray);
    }
    this.vertexArray = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vertexArray);

    // Upload vertex data
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
    }
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, meshData.vertices, this.gl.DYNAMIC_DRAW);

    // Upload index data
    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
    }
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, meshData.indices, this.gl.STATIC_DRAW);

    // Setup attributes based on current program
    if (this.program) {
      this.setupMeshAttributes();
    }

    this.gl.bindVertexArray(null);
  }

  private setupMeshAttributes(): void {
    if (!this.gl || !this.program || !this.meshData) return;

    const stride = 5 * 4; // 3 for position, 2 for texCoord

    // Position attribute
    const positionLoc = this.gl.getAttribLocation(this.program, 'aPosition');

    if (positionLoc >= 0) {
      this.gl.enableVertexAttribArray(positionLoc);
      this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, stride, 0);
    } else {
      Logger.getInstance()
        .createChild('WebGL2Renderer')
        .error('aPosition not found in shader', { method: 'setupMeshAttributes' });
    }

    // TexCoord attribute
    const texCoordLoc = this.gl.getAttribLocation(this.program, 'aTexCoord');

    if (texCoordLoc >= 0) {
      this.gl.enableVertexAttribArray(texCoordLoc);
      this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, stride, 3 * 4);
    } else {
      Logger.getInstance()
        .createChild('WebGL2Renderer')
        .error('aTexCoord not found in shader', { method: 'setupMeshAttributes' });
    }

    // Instance attributes if available
    if (this.meshData.instanceData) {
      const instanceBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, instanceBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.meshData.instanceData, this.gl.DYNAMIC_DRAW);

      // Each instance has 12 floats: 3 for position, 4 for rotation, 2 for scale, 3 for extra
      const stride = 12 * 4; // 12 floats * 4 bytes per float

      // Instance position (vec3)
      const positionLoc = this.gl.getAttribLocation(this.program, 'aInstancePosition');
      if (positionLoc >= 0) {
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, stride, 0);
        this.gl.vertexAttribDivisor(positionLoc, 1);
      }

      // Instance rotation (vec4 - quaternion)
      const rotationLoc = this.gl.getAttribLocation(this.program, 'aInstanceRotation');
      if (rotationLoc >= 0) {
        this.gl.enableVertexAttribArray(rotationLoc);
        this.gl.vertexAttribPointer(rotationLoc, 4, this.gl.FLOAT, false, stride, 3 * 4);
        this.gl.vertexAttribDivisor(rotationLoc, 1);
      }

      // Instance scale (vec2)
      const scaleLoc = this.gl.getAttribLocation(this.program, 'aInstanceScale');
      if (scaleLoc >= 0) {
        this.gl.enableVertexAttribArray(scaleLoc);
        this.gl.vertexAttribPointer(scaleLoc, 2, this.gl.FLOAT, false, stride, 7 * 4);
        this.gl.vertexAttribDivisor(scaleLoc, 1);
      }

      // Instance extra (vec3)
      const extraLoc = this.gl.getAttribLocation(this.program, 'aInstanceExtra');
      if (extraLoc >= 0) {
        this.gl.enableVertexAttribArray(extraLoc);
        this.gl.vertexAttribPointer(extraLoc, 3, this.gl.FLOAT, false, stride, 9 * 4);
        this.gl.vertexAttribDivisor(extraLoc, 1);
      }
    }
  }

  private setDefaultEffect(): void {
    const vertexShader = `#version 300 es
      in vec3 aPosition;
      in vec2 aTexCoord;
      
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      
      out vec2 vTexCoord;
      
      void main() {
        gl_Position = vec4(aPosition.xy, 0.0, 1.0);
        vTexCoord = aTexCoord;
      }
    `;

    const fragmentShader = `#version 300 es
      precision highp float;
      
      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform float uProgress;
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      
      in vec2 vTexCoord;
      out vec4 fragColor;
      
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
        
        vec4 color0 = texture(uTexture0, uv0);
        vec4 color1 = texture(uTexture1, uv1);
        
        fragColor = mix(color0, color1, uProgress);
      }
    `;

    this.setEffect({ vertexShader, fragmentShader });
  }

  setEffect(effect: {
    vertexShader: string;
    fragmentShader: string;
    transformFeedbackVaryings?: string[];
  }): void {
    if (!this.gl) return;

    try {
      // Convert WebGL 1.0 shaders to WebGL 2.0 if needed
      let vertexShader = effect.vertexShader;
      let fragmentShader = effect.fragmentShader;

      // Check if shaders are WebGL 1.0 style (no version directive)
      if (!vertexShader.includes('#version')) {
        vertexShader = this.convertVertexShaderToWebGL2(vertexShader);
      }
      if (!fragmentShader.includes('#version')) {
        fragmentShader = this.convertFragmentShaderToWebGL2(fragmentShader);
      }

      const program = effect.transformFeedbackVaryings
        ? this.createProgram(vertexShader, fragmentShader, effect.transformFeedbackVaryings)
        : super.createProgram(vertexShader, fragmentShader);
      if (program) {
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        this.program = program;
        super.cacheUniformsAndAttributes();

        // Clear meshData for simple effects (they should use drawArrays)
        // Only keep meshData if it was explicitly set via setMesh
        // This allows standard effects to use drawArrays
        if (!effect.transformFeedbackVaryings) {
          this.meshData = null;
        }

        // Setup attributes for VAO
        if (this.vertexArray) {
          this.gl.bindVertexArray(this.vertexArray);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

          if (this.meshData) {
            // Setup mesh attributes for custom mesh
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            this.setupMeshAttributes();
          } else {
            // Setup attributes for default quad
            const positionLoc = this.gl.getAttribLocation(this.program, 'aPosition');
            const texCoordLoc = this.gl.getAttribLocation(this.program, 'aTexCoord');

            if (positionLoc >= 0) {
              this.gl.enableVertexAttribArray(positionLoc);
              this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, 20, 0);
            }

            if (texCoordLoc >= 0) {
              this.gl.enableVertexAttribArray(texCoordLoc);
              this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 20, 12);
            }
          }

          this.gl.bindVertexArray(null);
        }
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  // Override to support transform feedback
  protected createProgram(
    vertexSource: string,
    fragmentSource: string,
    transformFeedbackVaryings?: string[],
  ): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = compileWebGLShader(this.gl, vertexSource, ShaderType.VERTEX);
    const fragmentShader = compileWebGLShader(this.gl, fragmentSource, ShaderType.FRAGMENT);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) this.gl.deleteShader(vertexShader);
      if (fragmentShader) this.gl.deleteShader(fragmentShader);
      return null;
    }

    const program = createWebGLProgram(
      this.gl,
      vertexShader,
      fragmentShader,
      transformFeedbackVaryings,
    );

    // Clean up shaders after linking
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  protected compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;
    return compileWebGLShader(this.gl, source, type as ShaderType);
  }

  protected cacheUniformsAndAttributes(): void {
    if (!this.gl || !this.program) return;

    this.uniforms.clear();
    this.attributes.clear();
    this.uniformBlockIndices.clear();

    // Get all active uniforms
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

    // Get all active attributes
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

    // Cache uniform block indices
    const numUniformBlocks = this.gl.getProgramParameter(
      this.program,
      this.gl.ACTIVE_UNIFORM_BLOCKS,
    );
    for (let i = 0; i < numUniformBlocks; i++) {
      const name = this.gl.getActiveUniformBlockName(this.program, i);
      if (name) {
        const index = this.gl.getUniformBlockIndex(this.program, name);
        this.uniformBlockIndices.set(name, index);
      }
    }
  }

  // Override to add WebGL2-specific texture features
  protected createTexture(image: HTMLImageElement): WebGLTexture | null {
    if (!this.gl) return null;

    // Use the helper function with WebGL2-specific options
    // Use simpler settings to match WebGL 1.0
    return createWebGLTexture(this.gl, image, {
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.LINEAR, // No mipmaps for now
      magFilter: this.gl.LINEAR,
      generateMipmap: false, // Disable mipmaps to match WebGL 1.0
      flipY: true, // Flip Y to match WebGL convention
      premultiplyAlpha: false,
      anisotropic: false, // Disable anisotropic filtering for now
    });
  }

  createComputeTexture(width: number, height: number, _data?: Float32Array): WebGLTexture | null {
    if (!this.gl) return null;

    // Use the helper function for compute textures
    return createRenderTexture(this.gl, width, height, {
      internalFormat: this.gl.RGBA32F,
      format: this.gl.RGBA,
      type: this.gl.FLOAT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
    });
  }

  setupTransformFeedback(buffers: WebGLBuffer[], _varyings: string[]): void {
    if (!this.gl) return;

    if (this.transformFeedback) {
      this.gl.deleteTransformFeedback(this.transformFeedback);
    }

    this.transformFeedback = this.gl.createTransformFeedback();
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);

    buffers.forEach((buffer, index) => {
      this.gl!.bindBufferBase(this.gl!.TRANSFORM_FEEDBACK_BUFFER, index, buffer);
    });

    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
  }

  render(
    currentTexture: WebGLTexture | null,
    nextTexture: WebGLTexture | null,
    progress: number,
    additionalUniforms?: Record<string, number | number[] | Float32Array>,
    currentImageSrc?: string,
    nextImageSrc?: string,
    instanceCount?: number,
  ): void {
    if (!this.gl || !this.program || !currentTexture || !this.vertexArray) {
      Logger.getInstance().createChild('WebGL2Renderer').error('Missing required resources', {
        gl: !!this.gl,
        program: !!this.program,
        currentTexture: !!currentTexture,
        vertexArray: !!this.vertexArray,
      });
      return;
    }

    this.gl.useProgram(this.program);

    // Bind VAO if it exists
    if (this.vertexArray) {
      this.gl.bindVertexArray(this.vertexArray);
    }

    // Set viewport
    this.gl.viewport(0, 0, this.canvas!.width, this.canvas!.height);

    // Clear
    this.gl.clearColor(0, 0, 0, 0); // Transparent background
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Bind textures
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
    if (nextTexture) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, nextTexture);
    }

    // Set uniforms
    const texture0Loc = this.uniforms.get('uTexture0');
    const texture1Loc = this.uniforms.get('uTexture1');
    const progressLoc = this.uniforms.get('uProgress');

    if (texture0Loc) this.gl!.uniform1i(texture0Loc, 0);
    if (texture1Loc) this.gl!.uniform1i(texture1Loc, 1);
    if (progressLoc) this.gl!.uniform1f(progressLoc, progress);

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
        const location = this.uniforms.get(name);
        if (location) {
          if (value instanceof Float32Array) {
            switch (value.length) {
              case 16:
                this.gl!.uniformMatrix4fv(location, false, value);
                break;
              case 9:
                this.gl!.uniformMatrix3fv(location, false, value);
                break;
              case 4:
                this.gl!.uniform4fv(location, value);
                break;
              case 3:
                this.gl!.uniform3fv(location, value);
                break;
              case 2:
                this.gl!.uniform2fv(location, value);
                break;
              default:
                this.gl!.uniform1fv(location, value);
            }
          } else if (Array.isArray(value)) {
            switch (value.length) {
              case 2:
                this.gl!.uniform2fv(location, value);
                break;
              case 3:
                this.gl!.uniform3fv(location, value);
                break;
              case 4:
                this.gl!.uniform4fv(location, value);
                break;
            }
          } else {
            this.gl!.uniform1f(location, value);
          }
        }
      });
    }

    // Draw

    try {
      // VAO already has vertex data and attributes set up, no need to re-set them

      if (this.meshData) {
        if (instanceCount && instanceCount > 1) {
          this.gl.drawElementsInstanced(
            this.gl.TRIANGLES,
            this.meshData.indices.length,
            this.gl.UNSIGNED_SHORT,
            0,
            instanceCount,
          );
        } else {
          this.gl.drawElements(
            this.gl.TRIANGLES,
            this.meshData.indices.length,
            this.gl.UNSIGNED_SHORT,
            0,
          );
        }
      } else {
        // VAO is properly bound and has attributes set up

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      }

      // Check for GL errors
      const error = this.gl.getError();
      if (error !== this.gl.NO_ERROR) {
        let errorString = 'Unknown error';
        switch (error) {
          case this.gl.INVALID_ENUM:
            errorString = 'INVALID_ENUM';
            break;
          case this.gl.INVALID_VALUE:
            errorString = 'INVALID_VALUE';
            break;
          case this.gl.INVALID_OPERATION:
            errorString = 'INVALID_OPERATION';
            break;
          case this.gl.INVALID_FRAMEBUFFER_OPERATION:
            errorString = 'INVALID_FRAMEBUFFER_OPERATION';
            break;
          case this.gl.OUT_OF_MEMORY:
            errorString = 'OUT_OF_MEMORY';
            break;
        }
        Logger.getInstance()
          .createChild('WebGL2Renderer')
          .error(`GL Error: ${error} (${errorString})`, { error, errorString });
      }
    } catch (error) {
      Logger.getInstance()
        .createChild('WebGL2Renderer')
        .error('Draw error', error as Error);
      throw error;
    }

    // Unbind VAO
    if (this.vertexArray) {
      this.gl.bindVertexArray(null);
    }
  }

  renderWithTransformFeedback(
    currentTexture: WebGLTexture | null,
    nextTexture: WebGLTexture | null,
    progress: number,
    additionalUniforms?: Record<string, number | number[] | Float32Array>,
  ): void {
    if (!this.gl || !this.program || !this.transformFeedback) return;

    this.gl.enable(this.gl.RASTERIZER_DISCARD);
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
    this.gl.beginTransformFeedback(this.gl.POINTS);

    this.render(currentTexture, nextTexture, progress, additionalUniforms);

    this.gl.endTransformFeedback();
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
    this.gl.disable(this.gl.RASTERIZER_DISCARD);
  }

  dispose(): void {
    if (!this.gl) return;

    // Delete WebGL 2.0 specific resources
    this.computeTextures.forEach((texture) => {
      this.gl!.deleteTexture(texture);
    });
    this.computeTextures.clear();

    // Delete buffers
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }

    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
      this.indexBuffer = null;
    }

    // Delete VAO
    if (this.vertexArray) {
      this.gl.deleteVertexArray(this.vertexArray);
      this.vertexArray = null;
    }

    // Delete transform feedback
    if (this.transformFeedback) {
      this.gl.deleteTransformFeedback(this.transformFeedback);
      this.transformFeedback = null;
    }

    // Call parent dispose
    super.disposeCommon();
  }

  isInitialized(): boolean {
    return super.isInitialized() && this.vertexArray !== null;
  }

  isWebGL2(): boolean {
    return true;
  }

  private convertVertexShaderToWebGL2(shader: string): string {
    let converted = shader;

    // Remove any existing precision declarations first
    converted = converted.replace(/precision\s+\w+\s+float\s*;/g, '');

    // Add version and precision at the beginning
    converted = '#version 300 es\nprecision highp float;\n' + converted;

    // Convert attribute to in
    converted = converted.replace(/\battribute\s+/g, 'in ');

    // Convert varying to out
    converted = converted.replace(/\bvarying\s+/g, 'out ');

    return converted;
  }

  private convertFragmentShaderToWebGL2(shader: string): string {
    let converted = shader;

    // Remove any existing precision declarations first
    converted = converted.replace(/precision\s+\w+\s+float\s*;/g, '');

    // Add version, precision, and output variable at the beginning
    converted = '#version 300 es\nprecision highp float;\nout vec4 fragColor;\n' + converted;

    // Convert varying to in
    converted = converted.replace(/\bvarying\s+/g, 'in ');

    // Replace gl_FragColor with fragColor
    converted = converted.replace(/\bgl_FragColor\b/g, 'fragColor');

    // Replace texture2D with texture
    converted = converted.replace(/\btexture2D\s*\(/g, 'texture(');

    return converted;
  }
}
