/**
 * Type definitions for testing
 */

import type { WebGLCarousel } from '../../src/WebGLCarousel';
import type { CarouselCore } from '../../src/core/CarouselCore';
import type { StateManager } from '../../src/core/StateManager';

/**
 * Interface for accessing private WebGLCarousel properties in tests
 */
export interface WebGLCarouselTestable extends WebGLCarousel {
  readonly options: any;
  readonly core: CarouselCore;
  isInitialized: boolean;
}

/**
 * Interface for accessing private CarouselCore properties in tests
 */
export interface CarouselCoreTestable extends CarouselCore {
  readonly stateManager: StateManager;
}

/**
 * Mock WebGL context for testing
 */
export interface MockWebGLContext extends Partial<WebGLRenderingContext> {
  // Add commonly used methods
  createShader: vi.Mock;
  shaderSource: vi.Mock;
  compileShader: vi.Mock;
  getShaderParameter: vi.Mock;
  getShaderInfoLog: vi.Mock;
  deleteShader: vi.Mock;
  createProgram: vi.Mock;
  attachShader: vi.Mock;
  linkProgram: vi.Mock;
  getProgramParameter: vi.Mock;
  getProgramInfoLog: vi.Mock;
  deleteProgram: vi.Mock;
  useProgram: vi.Mock;
  createBuffer: vi.Mock;
  bindBuffer: vi.Mock;
  bufferData: vi.Mock;
  createTexture: vi.Mock;
  bindTexture: vi.Mock;
  texImage2D: vi.Mock;
  texParameteri: vi.Mock;
  generateMipmap: vi.Mock;
  getUniformLocation: vi.Mock;
  getAttribLocation: vi.Mock;
  uniform1f: vi.Mock;
  uniform2f: vi.Mock;
  uniform1i: vi.Mock;
  uniformMatrix4fv: vi.Mock;
  enableVertexAttribArray: vi.Mock;
  vertexAttribPointer: vi.Mock;
  activeTexture: vi.Mock;
  viewport: vi.Mock;
  clear: vi.Mock;
  clearColor: vi.Mock;
  drawArrays: vi.Mock;
  drawElements: vi.Mock;
  enable: vi.Mock;
  disable: vi.Mock;
  blendFunc: vi.Mock;
  getError: vi.Mock;
}

/**
 * Mock Canvas 2D context for testing
 */
export interface MockCanvas2DContext extends Partial<CanvasRenderingContext2D> {
  clearRect: vi.Mock;
  drawImage: vi.Mock;
  save: vi.Mock;
  restore: vi.Mock;
  globalAlpha: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect: vi.Mock;
  translate: vi.Mock;
  scale: vi.Mock;
  rotate: vi.Mock;
}

/**
 * Mock HTML canvas element for testing
 */
export interface MockHTMLCanvasElement extends Partial<HTMLCanvasElement> {
  width: number;
  height: number;
  getContext: vi.Mock;
  addEventListener: vi.Mock;
  removeEventListener: vi.Mock;
  getBoundingClientRect: vi.Mock;
}

/**
 * Mock HTML image element for testing
 */
export interface MockHTMLImageElement extends Partial<HTMLImageElement> {
  src: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  complete: boolean;
  onload: ((this: HTMLImageElement, ev: Event) => any) | null;
  onerror: ((this: HTMLImageElement, ev: Event) => any) | null;
  crossOrigin: string | null;
}

/**
 * Create type-safe mock WebGL context
 */
export function createMockWebGLContext(overrides?: Partial<MockWebGLContext>): MockWebGLContext {
  return {
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    generateMipmap: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),
    getAttribLocation: vi.fn(() => 0),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform1i: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    activeTexture: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    getError: vi.fn(() => 0),
    ...overrides,
  };
}

/**
 * Create type-safe mock Canvas 2D context
 */
export function createMockCanvas2DContext(
  overrides?: Partial<MockCanvas2DContext>,
): MockCanvas2DContext {
  return {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    globalAlpha: 1,
    fillStyle: '#000000',
    fillRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    ...overrides,
  };
}

/**
 * Create type-safe mock canvas element
 */
export function createMockCanvas(overrides?: Partial<MockHTMLCanvasElement>): MockHTMLCanvasElement {
  const mockContext = createMockCanvas2DContext();
  return {
    width: 800,
    height: 600,
    getContext: vi.fn(() => mockContext),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
    ...overrides,
  };
}

/**
 * Create type-safe mock image element
 */
export function createMockImage(overrides?: Partial<MockHTMLImageElement>): MockHTMLImageElement {
  return {
    src: '',
    width: 100,
    height: 100,
    naturalWidth: 100,
    naturalHeight: 100,
    complete: false,
    onload: null,
    onerror: null,
    crossOrigin: null,
    ...overrides,
  };
}