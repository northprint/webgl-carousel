import { EventEmitter } from './EventEmitter';

export interface WebGL2RendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}

export interface WebGL2RendererEvents extends Record<string, unknown[]> {
  contextLost: [];
  contextRestored: [];
  error: [Error];
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

export class WebGL2Renderer extends EventEmitter<WebGL2RendererEvents> {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexArray: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private textures: Map<string, WebGLTexture> = new Map();
  private imageSizes: Map<string, { width: number; height: number }> = new Map();
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private attributes: Map<string, number> = new Map();
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
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.BACK);

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

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.emit('contextLost');
  };

  private handleContextRestored = (): void => {
    this.initialize(this.canvas!);
    this.emit('contextRestored');
  };

  private initializeDefaultMesh(): void {
    if (!this.gl) return;

    // Create VAO
    this.vertexArray = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vertexArray);

    // Default quad mesh
    const vertices = new Float32Array([
      -1.0,
      -1.0,
      0.0, // Position
      0.0,
      1.0, // TexCoord (flipped Y)
      1.0,
      -1.0,
      0.0, // Position
      1.0,
      1.0, // TexCoord
      -1.0,
      1.0,
      0.0, // Position
      0.0,
      0.0, // TexCoord
      1.0,
      1.0,
      0.0, // Position
      1.0,
      0.0, // TexCoord
    ]);

    const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

    this.meshData = {
      vertices,
      indices,
      texCoords: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
    };

    // Don't set up vertex attributes here - wait until shader is loaded
    // Attributes will be set up in setupMeshAttributes() after shader program is created

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
      console.error('[WebGL2Renderer.setupMeshAttributes] aPosition not found in shader!');
    }

    // TexCoord attribute
    const texCoordLoc = this.gl.getAttribLocation(this.program, 'aTexCoord');

    if (texCoordLoc >= 0) {
      this.gl.enableVertexAttribArray(texCoordLoc);
      this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, stride, 3 * 4);
    } else {
      console.error('[WebGL2Renderer.setupMeshAttributes] aTexCoord not found in shader!');
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
      
      in vec2 vTexCoord;
      out vec4 fragColor;
      
      void main() {
        vec4 color0 = texture(uTexture0, vTexCoord);
        vec4 color1 = texture(uTexture1, vTexCoord);
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

      const program = this.createProgram(
        vertexShader,
        fragmentShader,
        effect.transformFeedbackVaryings,
      );
      if (program) {
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        this.program = program;
        this.cacheUniformsAndAttributes();

        // Re-setup mesh attributes with new program
        if (this.vertexArray && this.meshData) {
          this.gl.bindVertexArray(this.vertexArray);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
          this.setupMeshAttributes();
          this.gl.bindVertexArray(null);
        }
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  private createProgram(
    vertexSource: string,
    fragmentSource: string,
    transformFeedbackVaryings?: string[],
  ): WebGLProgram | null {
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

    // Setup transform feedback if specified
    if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
      this.gl.transformFeedbackVaryings(
        program,
        transformFeedbackVaryings,
        this.gl.INTERLEAVED_ATTRIBS,
      );
    }

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
      console.error('[WebGL2Renderer] Shader compilation error:', error);
      console.error('[WebGL2Renderer] Shader source:', source);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${error}`);
    }

    return shader;
  }

  private cacheUniformsAndAttributes(): void {
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

  loadTexture(image: HTMLImageElement): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    try {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        image,
      );
    } catch (error) {
      console.error('[WebGL2Renderer.loadTexture] Failed to create texture:', error);
      this.gl.deleteTexture(texture);
      return null;
    }

    // Generate mipmaps
    this.gl.generateMipmap(this.gl.TEXTURE_2D);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR_MIPMAP_LINEAR,
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Enable anisotropic filtering if available
    const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) {
      const maxAnisotropy = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      this.gl.texParameterf(this.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
    }

    // Cache texture with image src as key
    this.textures.set(image.src, texture);

    // Cache image size
    this.imageSizes.set(image.src, {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    });

    return texture;
  }

  createComputeTexture(width: number, height: number, data?: Float32Array): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA32F,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
      data || null,
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    return texture;
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
      console.error('[WebGL2Renderer.render] Missing required resources:', {
        gl: !!this.gl,
        program: !!this.program,
        currentTexture: !!currentTexture,
        vertexArray: !!this.vertexArray,
      });
      return;
    }

    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vertexArray);

    // Clear
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

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
        console.error(`[WebGL2Renderer.render] GL Error: ${error} (${errorString})`);
      }
    } catch (error) {
      console.error('[WebGL2Renderer.render] Draw error:', error);
      throw error;
    }

    this.gl.bindVertexArray(null);
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

  getContext(): WebGL2RenderingContext | null {
    return this.gl;
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
