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
  createShader: jest.Mock;
  shaderSource: jest.Mock;
  compileShader: jest.Mock;
  getShaderParameter: jest.Mock;
  getShaderInfoLog: jest.Mock;
  deleteShader: jest.Mock;
  createProgram: jest.Mock;
  attachShader: jest.Mock;
  linkProgram: jest.Mock;
  getProgramParameter: jest.Mock;
  getProgramInfoLog: jest.Mock;
  deleteProgram: jest.Mock;
  useProgram: jest.Mock;
  createBuffer: jest.Mock;
  bindBuffer: jest.Mock;
  bufferData: jest.Mock;
  createTexture: jest.Mock;
  bindTexture: jest.Mock;
  texImage2D: jest.Mock;
  texParameteri: jest.Mock;
  generateMipmap: jest.Mock;
  getUniformLocation: jest.Mock;
  getAttribLocation: jest.Mock;
  uniform1f: jest.Mock;
  uniform2f: jest.Mock;
  uniform1i: jest.Mock;
  uniformMatrix4fv: jest.Mock;
  enableVertexAttribArray: jest.Mock;
  vertexAttribPointer: jest.Mock;
  activeTexture: jest.Mock;
  viewport: jest.Mock;
  clear: jest.Mock;
  clearColor: jest.Mock;
  drawArrays: jest.Mock;
  drawElements: jest.Mock;
  enable: jest.Mock;
  disable: jest.Mock;
  blendFunc: jest.Mock;
  getError: jest.Mock;
}

/**
 * Mock Canvas 2D context for testing
 */
export interface MockCanvas2DContext extends Partial<CanvasRenderingContext2D> {
  clearRect: jest.Mock;
  drawImage: jest.Mock;
  save: jest.Mock;
  restore: jest.Mock;
  globalAlpha: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect: jest.Mock;
  translate: jest.Mock;
  scale: jest.Mock;
  rotate: jest.Mock;
}

/**
 * Mock HTML canvas element for testing
 */
export interface MockHTMLCanvasElement extends Partial<HTMLCanvasElement> {
  width: number;
  height: number;
  getContext: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  getBoundingClientRect: jest.Mock;
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
    createShader: jest.fn(() => ({})),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(() => ''),
    deleteShader: jest.fn(),
    createProgram: jest.fn(() => ({})),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    getProgramInfoLog: jest.fn(() => ''),
    deleteProgram: jest.fn(),
    useProgram: jest.fn(),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    createTexture: jest.fn(() => ({})),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    getUniformLocation: jest.fn(() => ({})),
    getAttribLocation: jest.fn(() => 0),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform1i: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    activeTexture: jest.fn(),
    viewport: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    blendFunc: jest.fn(),
    getError: jest.fn(() => 0),
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
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    globalAlpha: 1,
    fillStyle: '#000000',
    fillRect: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
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
    getContext: jest.fn(() => mockContext),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
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