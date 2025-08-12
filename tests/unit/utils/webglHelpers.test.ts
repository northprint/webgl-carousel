import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  createShader,
  createProgram,
  createTexture,
  isPowerOfTwo,
  getWebGLContext,
  checkWebGLSupport,
  getMaxTextureSize,
  setupVertexAttributes,
  setUniforms,
  handleContextLoss,
  logWebGLInfo,
} from '../../../src/utils/webglHelpers';
import { MockWebGLRenderingContext } from '../../setup';

describe('webglHelpers', () => {
  let canvas: HTMLCanvasElement;
  let gl: any;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = new MockWebGLRenderingContext(canvas);
    
    // Add vi mock functions
    gl.createShader = vi.fn((type: number) => ({ type }));
    gl.shaderSource = vi.fn();
    gl.compileShader = vi.fn();
    gl.getShaderParameter = vi.fn(() => true);
    gl.getShaderInfoLog = vi.fn(() => null);
    gl.deleteShader = vi.fn();
    gl.createProgram = vi.fn(() => ({ id: 'program' }));
    gl.attachShader = vi.fn();
    gl.linkProgram = vi.fn();
    gl.getProgramParameter = vi.fn(() => true);
    gl.getProgramInfoLog = vi.fn(() => null);
    gl.deleteProgram = vi.fn();
    gl.createTexture = vi.fn(() => ({ id: 'texture' }));
    gl.bindTexture = vi.fn();
    gl.texImage2D = vi.fn();
    gl.texParameteri = vi.fn();
    gl.pixelStorei = vi.fn();
    gl.generateMipmap = vi.fn();
    gl.deleteTexture = vi.fn();
    gl.getParameter = vi.fn(() => 4096);
    gl.getExtension = vi.fn(() => null);
    gl.createBuffer = vi.fn(() => ({ id: 'buffer' }));
    gl.bindBuffer = vi.fn();
    gl.bufferData = vi.fn();
    gl.enableVertexAttribArray = vi.fn();
    gl.vertexAttribPointer = vi.fn();
    gl.getAttribLocation = vi.fn((prog, name) => {
      if (name === 'aPosition') return 0;
      if (name === 'aTexCoord') return 1;
      return -1;
    });
    gl.getUniformLocation = vi.fn((prog, name) => ({ name }));
    gl.uniform1f = vi.fn();
    gl.uniform1i = vi.fn();
    gl.uniform2fv = vi.fn();
    gl.uniform3fv = vi.fn();
    gl.uniform4fv = vi.fn();
    gl.getSupportedExtensions = vi.fn(() => ['OES_texture_float', 'WEBGL_depth_texture']);
    
    // Mock getContext
    canvas.getContext = vi.fn((contextType: string) => {
      if (contextType === 'webgl' || contextType === 'experimental-webgl') {
        return gl;
      }
      return null;
    });
  });

  describe('isPowerOfTwo', () => {
    it('should return true for powers of two', () => {
      expect(isPowerOfTwo(1)).toBe(true);
      expect(isPowerOfTwo(2)).toBe(true);
      expect(isPowerOfTwo(4)).toBe(true);
      expect(isPowerOfTwo(8)).toBe(true);
      expect(isPowerOfTwo(16)).toBe(true);
      expect(isPowerOfTwo(32)).toBe(true);
      expect(isPowerOfTwo(64)).toBe(true);
      expect(isPowerOfTwo(128)).toBe(true);
      expect(isPowerOfTwo(256)).toBe(true);
      expect(isPowerOfTwo(512)).toBe(true);
      expect(isPowerOfTwo(1024)).toBe(true);
    });

    it('should return false for non-powers of two', () => {
      expect(isPowerOfTwo(0)).toBe(false);
      expect(isPowerOfTwo(3)).toBe(false);
      expect(isPowerOfTwo(5)).toBe(false);
      expect(isPowerOfTwo(6)).toBe(false);
      expect(isPowerOfTwo(7)).toBe(false);
      expect(isPowerOfTwo(9)).toBe(false);
      expect(isPowerOfTwo(10)).toBe(false);
      expect(isPowerOfTwo(100)).toBe(false);
      expect(isPowerOfTwo(127)).toBe(false);
      expect(isPowerOfTwo(255)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPowerOfTwo(-1)).toBe(false);
      expect(isPowerOfTwo(-2)).toBe(false);
      expect(isPowerOfTwo(-4)).toBe(false);
    });
  });

  describe('getWebGLContext', () => {
    it('should get WebGL context', () => {
      const context = getWebGLContext(canvas);
      
      expect(context).toBe(gl);
      expect(canvas.getContext).toHaveBeenCalledWith('webgl', undefined);
    });

    it('should try experimental-webgl if webgl fails', () => {
      canvas.getContext = vi.fn((contextType: string) => {
        if (contextType === 'experimental-webgl') {
          return gl;
        }
        return null;
      });
      
      const context = getWebGLContext(canvas);
      
      expect(context).toBe(gl);
      expect(canvas.getContext).toHaveBeenCalledWith('webgl', undefined);
      expect(canvas.getContext).toHaveBeenCalledWith('experimental-webgl', undefined);
    });

    it('should pass options to getContext', () => {
      const options = {
        alpha: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      };
      
      getWebGLContext(canvas, options);
      
      expect(canvas.getContext).toHaveBeenCalledWith('webgl', options);
    });

    it('should return null if WebGL is not supported', () => {
      canvas.getContext = vi.fn(() => null);
      
      const context = getWebGLContext(canvas);
      
      expect(context).toBeNull();
    });
  });

  describe('checkWebGLSupport', () => {
    it('should return true if WebGL is supported', () => {
      const supported = checkWebGLSupport(canvas);
      
      expect(supported).toBe(true);
    });

    it('should return false if WebGL is not supported', () => {
      canvas.getContext = vi.fn(() => null);
      
      const supported = checkWebGLSupport(canvas);
      
      expect(supported).toBe(false);
    });
  });

  describe('createShader', () => {
    it('should create and compile vertex shader', () => {
      const shaderSource = 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }';
      
      const shader = createShader(gl, gl.VERTEX_SHADER, shaderSource);
      
      expect(shader).toBeDefined();
      expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
      expect(gl.shaderSource).toHaveBeenCalled();
      expect(gl.compileShader).toHaveBeenCalled();
    });

    it('should create and compile fragment shader', () => {
      const shaderSource = 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }';
      
      const shader = createShader(gl, gl.FRAGMENT_SHADER, shaderSource);
      
      expect(shader).toBeDefined();
      expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
    });

    it('should return null on compilation error', () => {
      gl.getShaderParameter = vi.fn(() => false);
      gl.getShaderInfoLog = vi.fn(() => 'Compilation error');
      
      const shaderSource = 'invalid shader';
      
      const shader = createShader(gl, gl.VERTEX_SHADER, shaderSource);
      
      expect(shader).toBeNull();
      expect(gl.deleteShader).toHaveBeenCalled();
    });

    it('should return null if shader creation fails', () => {
      gl.createShader = vi.fn(() => null);
      
      const shaderSource = 'valid shader';
      
      const shader = createShader(gl, gl.VERTEX_SHADER, shaderSource);
      
      expect(shader).toBeNull();
    });
  });

  describe('createProgram', () => {
    let vertexShader: WebGLShader;
    let fragmentShader: WebGLShader;

    beforeEach(() => {
      vertexShader = {} as WebGLShader;
      fragmentShader = {} as WebGLShader;
    });

    it('should create and link program', () => {
      const program = createProgram(gl, vertexShader, fragmentShader);
      
      expect(program).toBeDefined();
      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.attachShader).toHaveBeenCalledWith(expect.any(Object), vertexShader);
      expect(gl.attachShader).toHaveBeenCalledWith(expect.any(Object), fragmentShader);
      expect(gl.linkProgram).toHaveBeenCalled();
    });

    it('should return null on linking error', () => {
      gl.getProgramParameter = vi.fn(() => false);
      gl.getProgramInfoLog = vi.fn(() => 'Linking error');
      
      const program = createProgram(gl, vertexShader, fragmentShader);
      
      expect(program).toBeNull();
      expect(gl.deleteProgram).toHaveBeenCalled();
    });

    it('should return null if program creation fails', () => {
      gl.createProgram = vi.fn(() => null);
      
      const program = createProgram(gl, vertexShader, fragmentShader);
      
      expect(program).toBeNull();
    });
  });

  describe('createTexture', () => {
    it('should create texture from image', () => {
      const image = new Image();
      image.width = 256;
      image.height = 256;
      
      const texture = createTexture(gl, image);
      
      expect(texture).toBeDefined();
      expect(gl.createTexture).toHaveBeenCalled();
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, expect.any(Object));
      expect(gl.texImage2D).toHaveBeenCalled();
      expect(gl.texParameteri).toHaveBeenCalled();
    });

    it('should generate mipmaps for power of two textures', () => {
      const image = new Image();
      image.width = 256;
      image.height = 256;
      
      createTexture(gl, image);
      
      expect(gl.generateMipmap).toHaveBeenCalledWith(gl.TEXTURE_2D);
    });

    it('should not generate mipmaps for non-power of two textures', () => {
      const image = new Image();
      image.width = 100;
      image.height = 100;
      
      createTexture(gl, image);
      
      expect(gl.generateMipmap).not.toHaveBeenCalled();
    });

    it('should apply custom options', () => {
      const image = new Image();
      image.width = 256;
      image.height = 256;
      
      const options = {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        generateMipmap: false,
      };
      
      createTexture(gl, image, options);
      
      // With generateMipmaps: false and power of two size, no mipmaps generated
      expect(gl.generateMipmap).not.toHaveBeenCalled();
      
      // Check texture parameters were set
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    });

    it('should return null if texture creation fails', () => {
      gl.createTexture = vi.fn(() => null);
      
      const image = new Image();
      const texture = createTexture(gl, image);
      
      expect(texture).toBeNull();
    });
  });

  describe('getMaxTextureSize', () => {
    it('should return max texture size', () => {
      gl.getParameter = vi.fn((pname: number) => {
        if (pname === gl.MAX_TEXTURE_SIZE) {
          return 4096;
        }
        return 0;
      });
      
      const maxSize = getMaxTextureSize(gl);
      
      expect(maxSize).toBe(4096);
    });

    it('should return 0 if context is null', () => {
      const maxSize = getMaxTextureSize(null);
      
      expect(maxSize).toBe(0);
    });
  });

  describe('setupVertexAttributes', () => {
    it('should set up vertex attributes', () => {
      const program = {} as WebGLProgram;
      const attributes = {
        aPosition: {
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 0,
          offset: 0,
        },
        aTexCoord: {
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 0,
          offset: 0,
        },
      };
      
      gl.getAttribLocation = vi.fn((prog, name) => {
        if (name === 'aPosition') return 0;
        if (name === 'aTexCoord') return 1;
        return -1;
      });
      
      setupVertexAttributes(gl, program, attributes);
      
      expect(gl.getAttribLocation).toHaveBeenCalledWith(program, 'aPosition');
      expect(gl.getAttribLocation).toHaveBeenCalledWith(program, 'aTexCoord');
      expect(gl.enableVertexAttribArray).toHaveBeenCalledWith(0);
      expect(gl.enableVertexAttribArray).toHaveBeenCalledWith(1);
      expect(gl.vertexAttribPointer).toHaveBeenCalled();
    });

    it('should skip attributes with location -1', () => {
      const program = {} as WebGLProgram;
      const attributes = {
        aInvalid: {
          location: -1,
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 0,
          offset: 0,
        },
      };
      
      gl.getAttribLocation = vi.fn(() => -1);
      
      setupVertexAttributes(gl, program, attributes);
      
      expect(gl.enableVertexAttribArray).not.toHaveBeenCalled();
    });
  });

  describe('setUniforms', () => {
    it('should set various uniform types', () => {
      const program = {} as WebGLProgram;
      const uniforms = {
        uFloat: 1.5,
        uInt: 1,
        uVec2: [1.0, 2.0],
        uVec3: [1.0, 2.0, 3.0],
        uVec4: [1.0, 2.0, 3.0, 4.0],
        uBool: true,
      };
      
      gl.getUniformLocation = vi.fn((prog, name) => ({ name }));
      
      setUniforms(gl, program, uniforms);
      
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uFloat');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uInt');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uBool');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uVec2');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uVec3');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'uVec4');
      
      expect(gl.uniform1f).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalledTimes(2); // int and bool
      expect(gl.uniform2fv).toHaveBeenCalled();
      expect(gl.uniform3fv).toHaveBeenCalled();
      expect(gl.uniform4fv).toHaveBeenCalled();
    });

    it('should skip uniforms with null location', () => {
      const program = {} as WebGLProgram;
      const uniforms = {
        uMissing: 1.0,
      };
      
      gl.getUniformLocation = vi.fn(() => null);
      
      setUniforms(gl, program, uniforms);
      
      expect(gl.uniform1f).not.toHaveBeenCalled();
    });

    it('should handle typed arrays', () => {
      const program = {} as WebGLProgram;
      const uniforms = {
        uFloatArray: new Float32Array([1.0, 2.0]),
      };
      
      gl.getUniformLocation = vi.fn((prog, name) => ({ name }));
      
      setUniforms(gl, program, uniforms);
      
      expect(gl.uniform2fv).toHaveBeenCalled();
    });
  });

  describe('handleContextLoss', () => {
    it('should set up context loss handlers', () => {
      const onLost = vi.fn();
      const onRestored = vi.fn();
      
      const cleanup = handleContextLoss(canvas, onLost, onRestored);
      
      // Simulate context loss
      const lostEvent = new Event('webglcontextlost');
      canvas.dispatchEvent(lostEvent);
      
      expect(onLost).toHaveBeenCalled();
      
      // Simulate context restore
      const restoredEvent = new Event('webglcontextrestored');
      canvas.dispatchEvent(restoredEvent);
      
      expect(onRestored).toHaveBeenCalled();
      
      // Cleanup
      cleanup();
    });

    it('should prevent default on context lost', () => {
      const onLost = vi.fn();
      
      const cleanup = handleContextLoss(canvas, onLost);
      
      const lostEvent = new Event('webglcontextlost', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(lostEvent, 'preventDefault');
      
      canvas.dispatchEvent(lostEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      
      cleanup();
    });

    it('should remove event listeners on cleanup', () => {
      const onLost = vi.fn();
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
      
      const cleanup = handleContextLoss(canvas, onLost);
      cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
    });
  });

  describe('logWebGLInfo', () => {
    it('should log WebGL information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      gl.getParameter = vi.fn((pname: number) => {
        switch (pname) {
          case gl.VERSION:
            return 'WebGL 1.0';
          case gl.VENDOR:
            return 'Test Vendor';
          case gl.RENDERER:
            return 'Test Renderer';
          case gl.MAX_TEXTURE_SIZE:
            return 4096;
          default:
            return null;
        }
      });
      
      gl.getSupportedExtensions = vi.fn(() => ['OES_texture_float', 'WEBGL_depth_texture']);
      
      logWebGLInfo(gl);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WebGL'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Vendor'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Renderer'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Max Texture Size'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Extensions'));
      
      consoleSpy.mockRestore();
    });

    it('should handle null context', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logWebGLInfo(null);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});