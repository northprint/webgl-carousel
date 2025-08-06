/**
 * WebGL-specific type definitions
 */

/**
 * WebGL shader type
 */
export enum ShaderType {
  VERTEX = 0x8b31, // gl.VERTEX_SHADER
  FRAGMENT = 0x8b30, // gl.FRAGMENT_SHADER
}

/**
 * WebGL buffer target
 */
export enum BufferTarget {
  ARRAY_BUFFER = 0x8892, // gl.ARRAY_BUFFER
  ELEMENT_ARRAY_BUFFER = 0x8893, // gl.ELEMENT_ARRAY_BUFFER
}

/**
 * WebGL usage hint
 */
export enum BufferUsage {
  STATIC_DRAW = 0x88e4, // gl.STATIC_DRAW
  DYNAMIC_DRAW = 0x88e8, // gl.DYNAMIC_DRAW
  STREAM_DRAW = 0x88e0, // gl.STREAM_DRAW
}

/**
 * WebGL texture target
 */
export enum TextureTarget {
  TEXTURE_2D = 0x0de1, // gl.TEXTURE_2D
  TEXTURE_CUBE_MAP = 0x8513, // gl.TEXTURE_CUBE_MAP
}

/**
 * WebGL texture parameter
 */
export enum TextureParameter {
  TEXTURE_MAG_FILTER = 0x2800, // gl.TEXTURE_MAG_FILTER
  TEXTURE_MIN_FILTER = 0x2801, // gl.TEXTURE_MIN_FILTER
  TEXTURE_WRAP_S = 0x2802, // gl.TEXTURE_WRAP_S
  TEXTURE_WRAP_T = 0x2803, // gl.TEXTURE_WRAP_T
}

/**
 * WebGL texture filter
 */
export enum TextureFilter {
  NEAREST = 0x2600, // gl.NEAREST
  LINEAR = 0x2601, // gl.LINEAR
  NEAREST_MIPMAP_NEAREST = 0x2700, // gl.NEAREST_MIPMAP_NEAREST
  LINEAR_MIPMAP_NEAREST = 0x2701, // gl.LINEAR_MIPMAP_NEAREST
  NEAREST_MIPMAP_LINEAR = 0x2702, // gl.NEAREST_MIPMAP_LINEAR
  LINEAR_MIPMAP_LINEAR = 0x2703, // gl.LINEAR_MIPMAP_LINEAR
}

/**
 * WebGL texture wrap mode
 */
export enum TextureWrap {
  REPEAT = 0x2901, // gl.REPEAT
  CLAMP_TO_EDGE = 0x812f, // gl.CLAMP_TO_EDGE
  MIRRORED_REPEAT = 0x8370, // gl.MIRRORED_REPEAT
}

/**
 * WebGL data type
 */
export enum DataType {
  BYTE = 0x1400, // gl.BYTE
  UNSIGNED_BYTE = 0x1401, // gl.UNSIGNED_BYTE
  SHORT = 0x1402, // gl.SHORT
  UNSIGNED_SHORT = 0x1403, // gl.UNSIGNED_SHORT
  INT = 0x1404, // gl.INT
  UNSIGNED_INT = 0x1405, // gl.UNSIGNED_INT
  FLOAT = 0x1406, // gl.FLOAT
}

/**
 * WebGL primitive type
 */
export enum PrimitiveType {
  POINTS = 0x0000, // gl.POINTS
  LINES = 0x0001, // gl.LINES
  LINE_LOOP = 0x0002, // gl.LINE_LOOP
  LINE_STRIP = 0x0003, // gl.LINE_STRIP
  TRIANGLES = 0x0004, // gl.TRIANGLES
  TRIANGLE_STRIP = 0x0005, // gl.TRIANGLE_STRIP
  TRIANGLE_FAN = 0x0006, // gl.TRIANGLE_FAN
}

/**
 * WebGL clear buffer mask
 */
export enum ClearMask {
  COLOR_BUFFER_BIT = 0x00004000, // gl.COLOR_BUFFER_BIT
  DEPTH_BUFFER_BIT = 0x00000100, // gl.DEPTH_BUFFER_BIT
  STENCIL_BUFFER_BIT = 0x00000400, // gl.STENCIL_BUFFER_BIT
}

/**
 * Shader source with metadata
 */
export interface ShaderSource {
  type: ShaderType;
  source: string;
  version?: '100' | '300 es';
}

/**
 * Compiled shader info
 */
export interface CompiledShader {
  shader: WebGLShader;
  type: ShaderType;
  source: string;
}

/**
 * Program info with cached locations
 */
export interface ProgramInfo {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
  attributes: Map<string, number>;
  vertexShader: CompiledShader;
  fragmentShader: CompiledShader;
}

/**
 * Texture info
 */
export interface TextureInfo {
  texture: WebGLTexture;
  width: number;
  height: number;
  target: TextureTarget;
  format: number;
  type: DataType;
}

/**
 * Buffer info
 */
export interface BufferInfo {
  buffer: WebGLBuffer;
  target: BufferTarget;
  usage: BufferUsage;
  size: number;
}

/**
 * Vertex attribute info
 */
export interface AttributeInfo {
  location: number;
  size: number;
  type: DataType;
  normalized: boolean;
  stride: number;
  offset: number;
}

/**
 * Uniform value types
 */
export type UniformValue = number | number[] | Float32Array | Int32Array | WebGLTexture | null;

/**
 * Uniform setter function
 */
export type UniformSetter = (location: WebGLUniformLocation | null, value: UniformValue) => void;

/**
 * Type-safe uniform setters
 */
export interface UniformSetters {
  ['1f']: (location: WebGLUniformLocation | null, value: number) => void;
  ['2f']: (location: WebGLUniformLocation | null, v0: number, v1: number) => void;
  ['3f']: (location: WebGLUniformLocation | null, v0: number, v1: number, v2: number) => void;
  ['4f']: (
    location: WebGLUniformLocation | null,
    v0: number,
    v1: number,
    v2: number,
    v3: number,
  ) => void;
  ['1i']: (location: WebGLUniformLocation | null, value: number) => void;
  ['2i']: (location: WebGLUniformLocation | null, v0: number, v1: number) => void;
  ['3i']: (location: WebGLUniformLocation | null, v0: number, v1: number, v2: number) => void;
  ['4i']: (
    location: WebGLUniformLocation | null,
    v0: number,
    v1: number,
    v2: number,
    v3: number,
  ) => void;
  ['1fv']: (location: WebGLUniformLocation | null, value: Float32Array | number[]) => void;
  ['2fv']: (location: WebGLUniformLocation | null, value: Float32Array | number[]) => void;
  ['3fv']: (location: WebGLUniformLocation | null, value: Float32Array | number[]) => void;
  ['4fv']: (location: WebGLUniformLocation | null, value: Float32Array | number[]) => void;
  ['1iv']: (location: WebGLUniformLocation | null, value: Int32Array | number[]) => void;
  ['2iv']: (location: WebGLUniformLocation | null, value: Int32Array | number[]) => void;
  ['3iv']: (location: WebGLUniformLocation | null, value: Int32Array | number[]) => void;
  ['4iv']: (location: WebGLUniformLocation | null, value: Int32Array | number[]) => void;
  ['Matrix2fv']: (
    location: WebGLUniformLocation | null,
    transpose: boolean,
    value: Float32Array | number[],
  ) => void;
  ['Matrix3fv']: (
    location: WebGLUniformLocation | null,
    transpose: boolean,
    value: Float32Array | number[],
  ) => void;
  ['Matrix4fv']: (
    location: WebGLUniformLocation | null,
    transpose: boolean,
    value: Float32Array | number[],
  ) => void;
}

/**
 * WebGL capabilities
 */
export interface WebGLCapabilities {
  maxTextureSize: number;
  maxCubeMapTextureSize: number;
  maxViewportDims: Int32Array;
  maxTextureImageUnits: number;
  maxVertexTextureImageUnits: number;
  maxCombinedTextureImageUnits: number;
  maxVertexAttribs: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  maxRenderBufferSize: number;
  renderer: string;
  vendor: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
}

/**
 * Get WebGL capabilities
 */
export function getWebGLCapabilities(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): WebGLCapabilities {
  // Use constants directly to avoid runtime dependency on WebGLRenderingContext
  const GL_MAX_TEXTURE_SIZE = 0x0d33;
  const GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851c;
  const GL_MAX_VIEWPORT_DIMS = 0x0d3a;
  const GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
  const GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8b4c;
  const GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8b4d;
  const GL_MAX_VERTEX_ATTRIBS = 0x8869;
  const GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8dfb;
  const GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8dfd;
  const GL_MAX_VARYING_VECTORS = 0x8dfc;
  const GL_MAX_RENDERBUFFER_SIZE = 0x84e8;
  const GL_RENDERER = 0x1f01;
  const GL_VENDOR = 0x1f00;
  const GL_VERSION = 0x1f02;
  const GL_SHADING_LANGUAGE_VERSION = 0x8b8c;

  return {
    maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE) as number,
    maxCubeMapTextureSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE) as number,
    maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS) as Int32Array,
    maxTextureImageUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS) as number,
    maxVertexTextureImageUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number,
    maxCombinedTextureImageUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number,
    maxVertexAttribs: gl.getParameter(GL_MAX_VERTEX_ATTRIBS) as number,
    maxVertexUniformVectors: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS) as number,
    maxFragmentUniformVectors: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS) as number,
    maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS) as number,
    maxRenderBufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE) as number,
    renderer: gl.getParameter(GL_RENDERER) as string,
    vendor: gl.getParameter(GL_VENDOR) as string,
    version: gl.getParameter(GL_VERSION) as string,
    shadingLanguageVersion: gl.getParameter(GL_SHADING_LANGUAGE_VERSION) as string,
    extensions: gl.getSupportedExtensions() || [],
  };
}
