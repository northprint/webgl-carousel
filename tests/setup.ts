// Mock WebGL context for testing
export class MockWebGLRenderingContext {
  canvas: HTMLCanvasElement;
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  COMPILE_STATUS = 35713;
  LINK_STATUS = 35714;
  TEXTURE_2D = 3553;
  TEXTURE0 = 33984;
  TEXTURE1 = 33985;
  RGBA = 6408;
  UNSIGNED_BYTE = 5121;
  TEXTURE_WRAP_S = 10242;
  TEXTURE_WRAP_T = 10243;
  TEXTURE_MIN_FILTER = 10241;
  TEXTURE_MAG_FILTER = 10240;
  CLAMP_TO_EDGE = 33071;
  LINEAR = 9729;
  COLOR_BUFFER_BIT = 16384;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  FLOAT = 5126;
  TRIANGLE_STRIP = 5;
  ACTIVE_UNIFORMS = 35718;
  ACTIVE_ATTRIBUTES = 35721;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  createShader(type: number): WebGLShader | null {
    return {} as WebGLShader;
  }

  shaderSource(shader: WebGLShader, source: string): void {
    // Mock implementation
  }

  compileShader(shader: WebGLShader): void {
    // Mock implementation
  }

  getShaderParameter(shader: WebGLShader, pname: number): boolean {
    return true;
  }

  getShaderInfoLog(shader: WebGLShader): string | null {
    return null;
  }

  deleteShader(shader: WebGLShader): void {
    // Mock implementation
  }

  createProgram(): WebGLProgram | null {
    return {} as WebGLProgram;
  }

  attachShader(program: WebGLProgram, shader: WebGLShader): void {
    // Mock implementation
  }

  linkProgram(program: WebGLProgram): void {
    // Mock implementation
  }

  getProgramParameter(program: WebGLProgram, pname: number): any {
    if (pname === this.ACTIVE_UNIFORMS) return 5;
    if (pname === this.ACTIVE_ATTRIBUTES) return 2;
    return true;
  }

  getActiveUniform(program: WebGLProgram, index: number): WebGLActiveInfo | null {
    const uniforms = [
      { name: 'uTexture0', type: 0x8b5e, size: 1 },
      { name: 'uTexture1', type: 0x8b5e, size: 1 },
      { name: 'uProgress', type: 0x1406, size: 1 },
      { name: 'uResolution', type: 0x8b50, size: 1 },
      { name: 'uTime', type: 0x1406, size: 1 },
    ];
    return uniforms[index] as any || null;
  }

  getActiveAttrib(program: WebGLProgram, index: number): WebGLActiveInfo | null {
    const attribs = [
      { name: 'aPosition', type: 0x8b50, size: 1 },
      { name: 'aTexCoord', type: 0x8b50, size: 1 },
    ];
    return attribs[index] as any || null;
  }

  getProgramInfoLog(program: WebGLProgram): string | null {
    return null;
  }

  deleteProgram(program: WebGLProgram): void {
    // Mock implementation
  }

  useProgram(program: WebGLProgram | null): void {
    // Mock implementation
  }

  getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null {
    return {} as WebGLUniformLocation;
  }

  getAttribLocation(program: WebGLProgram, name: string): number {
    return 0;
  }

  uniform1f(location: WebGLUniformLocation, x: number): void {
    // Mock implementation
  }

  uniform1i(location: WebGLUniformLocation, x: number): void {
    // Mock implementation
  }

  uniform2f(location: WebGLUniformLocation, x: number, y: number): void {
    // Mock implementation
  }

  uniform2fv(location: WebGLUniformLocation, v: Float32Array | number[]): void {
    // Mock implementation
  }

  uniform3fv(location: WebGLUniformLocation, v: Float32Array | number[]): void {
    // Mock implementation
  }

  uniform4fv(location: WebGLUniformLocation, v: Float32Array | number[]): void {
    // Mock implementation
  }

  createBuffer(): WebGLBuffer | null {
    return {} as WebGLBuffer;
  }

  bindBuffer(target: number, buffer: WebGLBuffer | null): void {
    // Mock implementation
  }

  bufferData(target: number, data: ArrayBuffer | ArrayBufferView, usage: number): void {
    // Mock implementation
  }

  deleteBuffer(buffer: WebGLBuffer): void {
    // Mock implementation
  }

  enableVertexAttribArray(index: number): void {
    // Mock implementation
  }

  vertexAttribPointer(
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number,
  ): void {
    // Mock implementation
  }

  createTexture(): WebGLTexture | null {
    return {} as WebGLTexture;
  }

  bindTexture(target: number, texture: WebGLTexture | null): void {
    // Mock implementation
  }

  activeTexture(texture: number): void {
    // Mock implementation
  }

  texImage2D(...args: any[]): void {
    // Mock implementation
  }

  texParameteri(target: number, pname: number, param: number): void {
    // Mock implementation
  }

  deleteTexture(texture: WebGLTexture): void {
    // Mock implementation
  }

  clear(mask: number): void {
    // Mock implementation
  }

  clearColor(red: number, green: number, blue: number, alpha: number): void {
    // Mock implementation
  }

  viewport(x: number, y: number, width: number, height: number): void {
    // Mock implementation
  }

  drawArrays(mode: number, first: number, count: number): void {
    // Mock implementation
  }
}

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(function(
  this: HTMLCanvasElement,
  contextType: string,
) {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return new MockWebGLRenderingContext(this);
  }
  if (contextType === '2d') {
    const ctx = {
      drawImage: jest.fn(),
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      globalAlpha: 1,
      imageSmoothingEnabled: undefined as boolean | undefined,
      imageSmoothingQuality: undefined as string | undefined,
    };
    return ctx;
  }
  return null;
});

// Mock Image loading
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  set(src: string) {
    setTimeout(() => {
      if (this.onload) {
        this.onload(new Event('load'));
      }
    }, 0);
  },
});

// Mock HTMLCanvasElement.toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mockdata');

// Import jest-dom matchers for React testing
import '@testing-library/jest-dom';

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn((...args) => {
    // Suppress specific warnings
    if (args[0]?.includes('Effect') && args[0]?.includes('already registered')) {
      return;
    }
    originalWarn(...args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
});