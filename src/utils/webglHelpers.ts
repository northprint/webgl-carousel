/**
 * WebGL helper utilities for common operations
 */

import { Logger } from './Logger';
import { BufferTarget, BufferUsage, ShaderType } from '../types/webgl';

import type { TextureFilter, TextureWrap } from '../types/webgl';

const logger = Logger.getInstance().createChild('WebGLHelpers');

/**
 * Create and configure a texture
 */
export function createTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData,
  options: {
    wrapS?: TextureWrap;
    wrapT?: TextureWrap;
    minFilter?: TextureFilter;
    magFilter?: TextureFilter;
    generateMipmap?: boolean;
    flipY?: boolean;
    premultiplyAlpha?: boolean;
    format?: number;
    type?: number;
    anisotropic?: boolean;
  } = {},
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    logger.error('Failed to create texture');
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set pixel storage parameters
  if (options.flipY !== undefined) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY);
  }
  if (options.premultiplyAlpha !== undefined) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha);
  }

  try {
    // Log image dimensions and source
    logger.debug(`Uploading texture: ${image.width}x${image.height}`, {
      src: (image as HTMLImageElement).src?.substring(0, 100),
      complete: (image as HTMLImageElement).complete,
      naturalWidth: (image as HTMLImageElement).naturalWidth,
      naturalHeight: (image as HTMLImageElement).naturalHeight,
    });

    // Upload texture data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      options.format ?? gl.RGBA,
      options.format ?? gl.RGBA,
      options.type ?? gl.UNSIGNED_BYTE,
      image,
    );
  } catch (error) {
    logger.error('Failed to upload texture data', error as Error);
    gl.deleteTexture(texture);
    return null;
  }

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS ?? gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT ?? gl.CLAMP_TO_EDGE);

  // Generate mipmaps if needed
  if (options.generateMipmap !== false && isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      options.minFilter ?? gl.LINEAR_MIPMAP_LINEAR,
    );
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter ?? gl.LINEAR);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter ?? gl.LINEAR);

  // Enable anisotropic filtering if available and requested
  if (options.anisotropic) {
    const ext =
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    if (ext) {
      const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
    }
  }

  return texture;
}

/**
 * Create an empty texture for rendering
 */
export function createRenderTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  options: {
    format?: number;
    internalFormat?: number;
    type?: number;
    wrapS?: TextureWrap;
    wrapT?: TextureWrap;
    minFilter?: TextureFilter;
    magFilter?: TextureFilter;
  } = {},
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    logger.error('Failed to create render texture');
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Allocate texture storage
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    options.internalFormat ?? gl.RGBA32F,
    width,
    height,
    0,
    options.format ?? gl.RGBA,
    options.type ?? gl.FLOAT,
    null,
  );

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS ?? gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT ?? gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter ?? gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter ?? gl.NEAREST);

  return texture;
}

/**
 * Create and compile a shader
 */
export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  source: string,
  type: ShaderType,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    logger.error('Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    logger.error(`Failed to compile shader: ${error}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create and link a shader program
 */
export function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
  transformFeedbackVaryings?: string[],
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    logger.error('Failed to create program');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Set transform feedback varyings for WebGL2
  if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
    const gl2 = gl as WebGL2RenderingContext;
    if (gl2.transformFeedbackVaryings) {
      gl2.transformFeedbackVaryings(program, transformFeedbackVaryings, gl2.INTERLEAVED_ATTRIBS);
    }
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    logger.error(`Failed to link program: ${error}`);
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * Create a buffer and upload data
 */
export function createBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  data: ArrayBuffer | ArrayBufferView,
  target: BufferTarget = BufferTarget.ARRAY_BUFFER,
  usage: BufferUsage = BufferUsage.STATIC_DRAW,
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) {
    logger.error('Failed to create buffer');
    return null;
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);

  return buffer;
}

/**
 * Set up vertex attributes
 */
export function setupVertexAttribute(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  location: number,
  size: number,
  type: number = gl.FLOAT,
  normalized: boolean = false,
  stride: number = 0,
  offset: number = 0,
): void {
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
}

/**
 * Create a framebuffer with attachments
 */
export function createFramebuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  width: number,
  height: number,
  options: {
    colorTexture?: WebGLTexture;
    depthBuffer?: boolean;
    stencilBuffer?: boolean;
  } = {},
): WebGLFramebuffer | null {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    logger.error('Failed to create framebuffer');
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // Attach color texture if provided
  if (options.colorTexture) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      options.colorTexture,
      0,
    );
  }

  // Create and attach depth buffer if requested
  if (options.depthBuffer) {
    const depthBuffer = gl.createRenderbuffer();
    if (depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    }
  }

  // Create and attach stencil buffer if requested
  if (options.stencilBuffer) {
    const stencilBuffer = gl.createRenderbuffer();
    if (stencilBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.STENCIL_ATTACHMENT,
        gl.RENDERBUFFER,
        stencilBuffer,
      );
    }
  }

  // Check framebuffer completeness
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    logger.error(`Framebuffer incomplete: ${status}`);
    gl.deleteFramebuffer(framebuffer);
    return null;
  }

  // Unbind framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return framebuffer;
}

/**
 * Check if a number is a power of two
 */
export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

/**
 * Get the next power of two
 */
export function nextPowerOfTwo(value: number): number {
  if (isPowerOfTwo(value)) {
    return value;
  }
  let power = 1;
  while (power < value) {
    power *= 2;
  }
  return power;
}

/**
 * Resize canvas to match display size
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  multiplier: number = 1,
): boolean {
  const width = (canvas.clientWidth * multiplier) | 0;
  const height = (canvas.clientHeight * multiplier) | 0;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;
}

/**
 * Set viewport to match canvas size
 */
export function setViewport(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  width?: number,
  height?: number,
): void {
  const canvas = gl.canvas as HTMLCanvasElement;
  gl.viewport(0, 0, width ?? canvas.width, height ?? canvas.height);
}

/**
 * Clear the canvas
 */
export function clearCanvas(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  color: [number, number, number, number] = [0, 0, 0, 0],
  clearDepth: boolean = false,
  clearStencil: boolean = false,
): void {
  gl.clearColor(...color);

  let mask = gl.COLOR_BUFFER_BIT;
  if (clearDepth) {
    mask |= gl.DEPTH_BUFFER_BIT;
    gl.clearDepth(1);
  }
  if (clearStencil) {
    mask |= gl.STENCIL_BUFFER_BIT;
    gl.clearStencil(0);
  }

  gl.clear(mask);
}

/**
 * Create a shader (alias for compileShader for backward compatibility)
 */
export function createShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  return compileShader(gl, source, type);
}

/**
 * Get WebGL context with fallback options
 */
export function getWebGLContext(
  canvas: HTMLCanvasElement,
  options?: WebGLContextAttributes,
): WebGLRenderingContext | null {
  const contextNames = ['webgl', 'experimental-webgl'];
  for (const name of contextNames) {
    try {
      const context = canvas.getContext(name, options) as WebGLRenderingContext | null;
      if (context) {
        return context;
      }
    } catch {
      // Continue to next context name
    }
  }
  return null;
}

/**
 * Check if WebGL is supported
 */
export function checkWebGLSupport(canvas: HTMLCanvasElement): boolean {
  return getWebGLContext(canvas) !== null;
}

/**
 * Get maximum texture size
 */
export function getMaxTextureSize(gl: WebGLRenderingContext | null): number {
  if (!gl) return 0;
  return gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
}

/**
 * Set up multiple vertex attributes
 */
export function setupVertexAttributes(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attributes: Record<
    string,
    {
      location?: number;
      size: number;
      type: number;
      normalized: boolean;
      stride: number;
      offset: number;
    }
  >,
): void {
  for (const [name, attr] of Object.entries(attributes)) {
    const location = attr.location ?? gl.getAttribLocation(program, name);
    if (location >= 0) {
      setupVertexAttribute(
        gl,
        location,
        attr.size,
        attr.type,
        attr.normalized,
        attr.stride,
        attr.offset,
      );
    }
  }
}

/**
 * Set uniform values
 */
export function setUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  uniforms: Record<string, any>,
): void {
  for (const [name, value] of Object.entries(uniforms)) {
    const location = gl.getUniformLocation(program, name);
    if (!location) continue;

    if (typeof value === 'number') {
      // Check if it's an integer or float
      if (Number.isInteger(value)) {
        gl.uniform1i(location, value);
      } else {
        gl.uniform1f(location, value);
      }
    } else if (typeof value === 'boolean') {
      gl.uniform1i(location, value ? 1 : 0);
    } else if (Array.isArray(value) || value instanceof Float32Array) {
      const length = value.length;
      if (length === 2) {
        gl.uniform2fv(location, value);
      } else if (length === 3) {
        gl.uniform3fv(location, value);
      } else if (length === 4) {
        gl.uniform4fv(location, value);
      }
    }
  }
}

/**
 * Handle WebGL context loss
 */
export function handleContextLoss(
  canvas: HTMLCanvasElement,
  onLost?: (event: Event) => void,
  onRestored?: (event: Event) => void,
): () => void {
  const handleLost = (event: Event) => {
    event.preventDefault();
    onLost?.(event);
  };

  const handleRestored = (event: Event) => {
    onRestored?.(event);
  };

  canvas.addEventListener('webglcontextlost', handleLost);
  canvas.addEventListener('webglcontextrestored', handleRestored);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost);
    canvas.removeEventListener('webglcontextrestored', handleRestored);
  };
}

/**
 * Log WebGL information
 */
export function logWebGLInfo(gl: WebGLRenderingContext | null): void {
  if (!gl) return;

  // eslint-disable-next-line no-console
  console.log('WebGL Info:');
  // eslint-disable-next-line no-console
  console.log(`  Version: ${gl.getParameter(gl.VERSION)}`);
  // eslint-disable-next-line no-console
  console.log(`  Vendor: ${gl.getParameter(gl.VENDOR)}`);
  // eslint-disable-next-line no-console
  console.log(`  Renderer: ${gl.getParameter(gl.RENDERER)}`);
  // eslint-disable-next-line no-console
  console.log(`  Max Texture Size: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);

  const extensions = gl.getSupportedExtensions();
  if (extensions) {
    // eslint-disable-next-line no-console
    console.log(`  Extensions: ${extensions.join(', ')}`);
  }
}
