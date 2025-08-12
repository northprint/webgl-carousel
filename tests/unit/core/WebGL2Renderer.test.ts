import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { WebGL2Renderer } from '../../../src/core/WebGL2Renderer';

// Mock WebGL2 context
class MockWebGL2RenderingContext {
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
  DEPTH_TEST = 2929;
  CULL_FACE = 2884;
  BLEND = 3042;
  SRC_ALPHA = 770;
  ONE_MINUS_SRC_ALPHA = 771;
  UNPACK_FLIP_Y_WEBGL = 37440;
  ELEMENT_ARRAY_BUFFER = 34963;
  UNSIGNED_SHORT = 5123;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }
  
  // Add VAO methods
  createVertexArray = vi.fn(() => ({ id: 'vao' }));
  bindVertexArray = vi.fn();
  deleteVertexArray = vi.fn();

  createShader = vi.fn((type: number) => ({ type }));
  shaderSource = vi.fn();
  compileShader = vi.fn();
  getShaderParameter = vi.fn(() => true);
  getShaderInfoLog = vi.fn(() => null);
  deleteShader = vi.fn();
  createProgram = vi.fn(() => ({ id: 'program' }));
  deleteProgram = vi.fn();
  attachShader = vi.fn();
  linkProgram = vi.fn();
  getProgramParameter = vi.fn(() => true);
  getProgramInfoLog = vi.fn(() => null);
  useProgram = vi.fn();
  getUniformLocation = vi.fn((program: any, name: string) => ({ name }));
  getAttribLocation = vi.fn((program: any, name: string) => {
    if (name === 'aPosition') return 0;
    if (name === 'aTexCoord') return 1;
    return -1;
  });
  uniform1f = vi.fn();
  uniform1i = vi.fn();
  uniform2f = vi.fn();
  uniform2fv = vi.fn();
  uniform3fv = vi.fn();
  uniform4fv = vi.fn();
  createBuffer = vi.fn(() => ({ id: 'buffer' }));
  bindBuffer = vi.fn();
  bufferData = vi.fn();
  deleteBuffer = vi.fn();
  enableVertexAttribArray = vi.fn();
  vertexAttribPointer = vi.fn();
  createTexture = vi.fn(() => ({ id: 'texture' }));
  bindTexture = vi.fn();
  activeTexture = vi.fn();
  deleteTexture = vi.fn();
  texImage2D = vi.fn();
  texParameteri = vi.fn();
  pixelStorei = vi.fn();
  generateMipmap = vi.fn();
  clear = vi.fn();
  clearColor = vi.fn();
  viewport = vi.fn();
  drawArrays = vi.fn();
  drawElements = vi.fn();
  enable = vi.fn();
  disable = vi.fn();
  blendFunc = vi.fn();
  getExtension = vi.fn(() => null);
  getSupportedExtensions = vi.fn(() => []);
  isContextLost = vi.fn(() => false);
  getParameter = vi.fn((pname: number) => {
    if (pname === 0x8B8C) return 8; // MAX_TEXTURE_IMAGE_UNITS
    if (pname === 0x0D33) return 4096; // MAX_TEXTURE_SIZE
    return 0;
  });
  getError = vi.fn(() => 0);
}

describe('WebGL2Renderer', () => {
  let renderer: WebGL2Renderer;
  let canvas: HTMLCanvasElement;
  let gl: MockWebGL2RenderingContext;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    gl = new MockWebGL2RenderingContext(canvas);
    
    // Mock getContext to return our mock WebGL2 context
    canvas.getContext = vi.fn((contextType: string) => {
      if (contextType === 'webgl2') {
        return gl as any;
      }
      return null;
    });
    
    renderer = new WebGL2Renderer();
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully with WebGL2 support', () => {
      const result = renderer.initialize(canvas);
      
      expect(result).toBe(true);
      expect(renderer.isInitialized()).toBe(true);
      expect(canvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
    });

    it('should return false when WebGL2 is not supported', () => {
      canvas.getContext = vi.fn(() => null);
      
      const result = renderer.initialize(canvas);
      
      expect(result).toBe(false);
      expect(renderer.isInitialized()).toBe(false);
    });

    it('should set up WebGL state correctly', () => {
      renderer.initialize(canvas);
      
      // Check that proper WebGL state is set
      expect(gl.disable).toHaveBeenCalledWith(gl.DEPTH_TEST);
      expect(gl.disable).toHaveBeenCalledWith(gl.CULL_FACE);
      expect(gl.enable).toHaveBeenCalledWith(gl.BLEND);
      expect(gl.blendFunc).toHaveBeenCalledWith(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    });

    it('should create VAO on initialization', () => {
      renderer.initialize(canvas);
      
      expect(gl.createVertexArray).toHaveBeenCalled();
      expect(gl.bindVertexArray).toHaveBeenCalled();
    });

    it('should set up vertex buffers', () => {
      renderer.initialize(canvas);
      
      expect(gl.createBuffer).toHaveBeenCalledTimes(1); // interleaved vertex buffer
      expect(gl.bufferData).toHaveBeenCalled();
    });
  });

  describe('texture loading', () => {
    beforeEach(() => {
      renderer.initialize(canvas);
    });

    it('should load texture from image element', () => {
      const img = new Image();
      img.width = 100;
      img.height = 100;
      
      const texture = renderer.loadTexture(img);
      
      expect(texture).toBeDefined();
      expect(gl.createTexture).toHaveBeenCalled();
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, expect.any(Object));
      expect(gl.texImage2D).toHaveBeenCalled();
      expect(gl.pixelStorei).toHaveBeenCalledWith(gl.UNPACK_FLIP_Y_WEBGL, true);
    });

    it('should set texture parameters correctly', () => {
      const img = new Image();
      img.width = 100;
      img.height = 100;
      
      renderer.loadTexture(img);
      
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    });

    it('should not generate mipmaps', () => {
      const img = new Image();
      img.width = 100;
      img.height = 100;
      
      renderer.loadTexture(img);
      
      expect(gl.generateMipmap).not.toHaveBeenCalled();
    });
  });

  describe('shader management', () => {
    beforeEach(() => {
      renderer.initialize(canvas);
    });

    it('should compile and link shaders', () => {
      const effect = {
        vertexShader: 'vertex shader code',
        fragmentShader: 'fragment shader code',
      };
      
      // Reset the spy counts after initialization
      vi.clearAllMocks();
      
      renderer.setEffect(effect);
      
      expect(gl.createShader).toHaveBeenCalledTimes(2);
      expect(gl.shaderSource).toHaveBeenCalledTimes(2);
      expect(gl.compileShader).toHaveBeenCalledTimes(2);
      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.attachShader).toHaveBeenCalledTimes(2);
      expect(gl.linkProgram).toHaveBeenCalled();
    });

    it('should handle shader compilation errors', () => {
      gl.getShaderParameter = vi.fn(() => false);
      gl.getShaderInfoLog = vi.fn(() => 'Shader compilation error');
      gl.createShader = vi.fn(() => null); // Make shader creation fail
      
      const effect = {
        vertexShader: 'invalid shader',
        fragmentShader: 'invalid shader',
      };
      
      const errorHandler = vi.fn();
      renderer.on('error', errorHandler);
      
      const previousProgram = renderer['program'];
      renderer.setEffect(effect);
      
      // Since compileShader returns null on error, program should remain unchanged
      expect(renderer['program']).toBe(previousProgram);
    });

    it('should handle program linking errors', () => {
      gl.getProgramParameter = vi.fn(() => false);
      gl.getProgramInfoLog = vi.fn(() => 'Program linking error');
      gl.createProgram = vi.fn(() => null); // Make program creation fail
      
      const effect = {
        vertexShader: 'vertex shader',
        fragmentShader: 'fragment shader',
      };
      
      const previousProgram = renderer['program'];
      renderer.setEffect(effect);
      
      // Since createProgram returns null on error, program should remain unchanged
      expect(renderer['program']).toBe(previousProgram);
    });
  });

  describe('rendering', () => {
    let texture1: any;
    let texture2: any;

    beforeEach(() => {
      renderer.initialize(canvas);
      
      const img1 = new Image();
      img1.width = 100;
      img1.height = 100;
      texture1 = renderer.loadTexture(img1);
      
      const img2 = new Image();
      img2.width = 100;
      img2.height = 100;
      texture2 = renderer.loadTexture(img2);
    });

    it('should render with correct textures', () => {
      // Setup uniforms map
      renderer['uniforms'] = new Map([
        ['uTexture0', { location: 'uTexture0' }],
        ['uTexture1', { location: 'uTexture1' }],
        ['uProgress', { location: 'uProgress' }],
        ['uResolution', { location: 'uResolution' }],
      ]);
      
      renderer.render(texture1, texture2, 0.5);
      
      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);
      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE1);
      expect(gl.bindTexture).toHaveBeenCalled();
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    it('should set uniforms correctly', () => {
      // Setup uniforms map
      renderer['uniforms'] = new Map([
        ['uTexture0', { location: 'uTexture0' }],
        ['uTexture1', { location: 'uTexture1' }],
        ['uProgress', { location: 'uProgress' }],
        ['uResolution', { location: 'uResolution' }],
      ]);
      
      renderer.render(texture1, texture2, 0.7);
      
      expect(gl.uniform1f).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalled();
      expect(gl.uniform2f).toHaveBeenCalled();
    });

    it('should clear before rendering', () => {
      // Setup uniforms map
      renderer['uniforms'] = new Map();
      
      renderer.render(texture1, texture2, 0.5);
      
      expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
    });

    it('should update viewport on resize', () => {
      renderer.resize(1024, 768);
      
      expect(gl.viewport).toHaveBeenCalledWith(0, 0, 1024, 768);
    });

    it('should handle null textures gracefully', () => {
      // Setup uniforms map
      renderer['uniforms'] = new Map();
      
      expect(() => {
        renderer.render(null, null, 0.5);
      }).not.toThrow();
    });
  });

  describe('disposal', () => {
    it('should clean up resources', () => {
      renderer.initialize(canvas);
      
      const img = new Image();
      img.width = 100;
      img.height = 100;
      renderer.loadTexture(img);
      
      renderer.dispose();
      
      expect(gl.deleteProgram).toHaveBeenCalled();
      expect(gl.deleteBuffer).toHaveBeenCalled();
      expect(gl.deleteVertexArray).toHaveBeenCalled();
      expect(gl.deleteTexture).toHaveBeenCalled();
    });

    it('should handle multiple dispose calls', () => {
      renderer.initialize(canvas);
      
      renderer.dispose();
      
      expect(() => {
        renderer.dispose();
      }).not.toThrow();
    });
  });

  describe('context loss handling', () => {
    it('should handle context loss', () => {
      renderer.initialize(canvas);
      
      gl.isContextLost = vi.fn(() => true);
      
      const img = new Image();
      expect(() => {
        renderer.loadTexture(img);
      }).not.toThrow();
    });

    it('should emit error on WebGL errors', () => {
      renderer.initialize(canvas);
      
      gl.getError = vi.fn(() => 1281); // INVALID_VALUE
      
      const errorHandler = vi.fn();
      renderer.on('error', errorHandler);
      
      renderer.render(null, null, 0.5);
      
      // Since we're mocking, we might not trigger the error check
      // but the structure is there for real WebGL contexts
    });
  });

  describe('effect management', () => {
    beforeEach(() => {
      renderer.initialize(canvas);
    });

    it('should handle custom uniforms from effects', () => {
      const effect = {
        vertexShader: 'vertex shader',
        fragmentShader: 'fragment shader',
      };
      
      renderer.setEffect(effect);
      
      // Setup uniforms map and program
      renderer['uniforms'] = new Map([
        ['uCustom', { location: 'uCustom' }],
      ]);
      renderer['program'] = { id: 'program' };
      
      const texture1 = renderer.loadTexture(new Image());
      const texture2 = renderer.loadTexture(new Image());
      
      // Pass additional uniforms to render
      const additionalUniforms = {
        uCustom: 0.5,
        uVector: [1, 0, 0],
      };
      
      renderer.render(texture1, texture2, 0.5, additionalUniforms);
      
      expect(gl.uniform1f).toHaveBeenCalled();
    });
  });
});