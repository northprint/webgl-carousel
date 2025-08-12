import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { WebGLRenderer } from '../../../src/core/WebGLRenderer';
import { MockWebGLRenderingContext } from '../../setup';

describe('WebGLRenderer', () => {
  let renderer: WebGLRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    renderer = new WebGLRenderer();
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully with WebGL support', () => {
      const result = renderer.initialize(canvas);
      expect(result).toBe(true);
      expect(renderer.isInitialized()).toBe(true);
    });

    it('should return false when WebGL is not supported', () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

      const errorHandler = vi.fn();
      renderer.on('error', errorHandler);

      const result = renderer.initialize(canvas);
      expect(result).toBe(false);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should setup context loss event listeners', () => {
      const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');
      renderer.initialize(canvas);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
      );
    });
  });

  describe('texture loading', () => {
    it('should load texture from image', () => {
      renderer.initialize(canvas);

      const image = new Image();
      image.width = 100;
      image.height = 100;
      image.src = 'test.jpg';

      const texture = renderer.loadTexture(image);
      expect(texture).toBeTruthy();
    });

    it('should return null if not initialized', () => {
      const image = new Image();
      const texture = renderer.loadTexture(image);
      expect(texture).toBeNull();
    });
  });

  describe('effects', () => {
    it('should set custom effect', () => {
      renderer.initialize(canvas);

      const customEffect = {
        vertexShader: `
          attribute vec2 aPosition;
          void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `,
      };

      const errorHandler = vi.fn();
      renderer.on('error', errorHandler);

      renderer.setEffect(customEffect);
      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should handle shader compilation errors', () => {
      renderer.initialize(canvas);

      // Mock shader compilation failure
      const gl = renderer.getContext() as any;
      if (gl) {
        gl.getShaderParameter = vi.fn().mockReturnValue(false);
        gl.getShaderInfoLog = vi.fn().mockReturnValue('Shader compilation error');
      }

      const invalidEffect = {
        vertexShader: 'invalid shader code',
        fragmentShader: 'invalid shader code',
      };

      const errorHandler = vi.fn();
      renderer.on('error', errorHandler);

      renderer.setEffect(invalidEffect);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('rendering', () => {
    it('should render without errors', () => {
      renderer.initialize(canvas);

      const image = new Image();
      image.width = 100;
      image.height = 100;
      const texture = renderer.loadTexture(image);

      expect(() => {
        renderer.render(texture, null, 0.5);
      }).not.toThrow();
    });

    it('should not render if not initialized', () => {
      const mockTexture = {} as WebGLTexture;
      expect(() => {
        renderer.render(mockTexture, null, 0.5);
      }).not.toThrow();
    });

    it('should apply additional uniforms', () => {
      renderer.initialize(canvas);

      const image = new Image();
      const texture = renderer.loadTexture(image);

      const additionalUniforms = {
        uCustomFloat: 0.5,
        uCustomVec2: [1.0, 2.0],
        uCustomVec3: [1.0, 2.0, 3.0],
        uCustomVec4: [1.0, 2.0, 3.0, 4.0],
      };

      expect(() => {
        renderer.render(texture, null, 0.5, additionalUniforms);
      }).not.toThrow();
    });
  });

  describe('resize', () => {
    it('should resize canvas and viewport', () => {
      renderer.initialize(canvas);

      renderer.resize(1024, 768);

      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('should not throw if not initialized', () => {
      expect(() => {
        renderer.resize(1024, 768);
      }).not.toThrow();
    });
  });

  describe('context loss handling', () => {
    it('should emit contextLost event', () => {
      renderer.initialize(canvas);

      const contextLostHandler = vi.fn();
      renderer.on('contextLost', contextLostHandler);

      const event = new Event('webglcontextlost');
      canvas.dispatchEvent(event);

      expect(contextLostHandler).toHaveBeenCalled();
    });

    it('should emit contextRestored event and reinitialize', () => {
      renderer.initialize(canvas);

      const contextRestoredHandler = vi.fn();
      renderer.on('contextRestored', contextRestoredHandler);

      const event = new Event('webglcontextrestored');
      canvas.dispatchEvent(event);

      expect(contextRestoredHandler).toHaveBeenCalled();
      expect(renderer.isInitialized()).toBe(true);
    });
  });

  describe('disposal', () => {
    it('should clean up resources', () => {
      renderer.initialize(canvas);

      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');

      renderer.dispose();

      expect(renderer.isInitialized()).toBe(false);
      expect(renderer.getContext()).toBeNull();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
      );
    });

    it('should be safe to call dispose multiple times', () => {
      renderer.initialize(canvas);

      expect(() => {
        renderer.dispose();
        renderer.dispose();
      }).not.toThrow();
    });
  });
});