// WebGL mock implementation for testing
export const createMockWebGLContext = () => {
  const mockTexture = {};
  const mockBuffer = {};
  const mockProgram = {};
  const mockShader = {};
  const mockUniformLocation = {};
  const mockFramebuffer = {};
  const mockRenderbuffer = {};

  const gl: any = {
    // Constants
    TEXTURE_2D: 0x0de1,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    CLAMP_TO_EDGE: 0x812f,
    LINEAR: 0x2601,
    NEAREST: 0x2600,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    DYNAMIC_DRAW: 0x88e8,
    FLOAT: 0x1406,
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
    TRIANGLE_STRIP: 0x0005,
    TRIANGLES: 0x0004,
    ACTIVE_UNIFORMS: 0x8b86,
    ACTIVE_ATTRIBUTES: 0x8b89,
    FRAMEBUFFER: 0x8d40,
    COLOR_ATTACHMENT0: 0x8ce0,
    RENDERBUFFER: 0x8d41,
    DEPTH_COMPONENT16: 0x81a5,
    DEPTH_ATTACHMENT: 0x8d00,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,

    // Methods
    createTexture: vi.fn(() => mockTexture),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    texParameterf: vi.fn(),
    pixelStorei: vi.fn(),
    generateMipmap: vi.fn(),
    getExtension: vi.fn(() => null),
    createBuffer: vi.fn(() => mockBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createProgram: vi.fn(() => mockProgram),
    createShader: vi.fn(() => mockShader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn((program: any, param: number) => {
      if (param === 0x8b86) return 5; // ACTIVE_UNIFORMS
      if (param === 0x8b89) return 2; // ACTIVE_ATTRIBUTES
      return true;
    }),
    getProgramInfoLog: vi.fn(() => ''),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn(() => mockUniformLocation),
    getAttribLocation: vi.fn((program: any, name: string) => {
      if (name === 'aPosition') return 0;
      if (name === 'aTexCoord') return 1;
      return -1;
    }),
    getActiveUniform: vi.fn((program: any, index: number) => {
      const uniforms = [
        { name: 'uTexture0', type: 0x8b5e, size: 1 },
        { name: 'uTexture1', type: 0x8b5e, size: 1 },
        { name: 'uProgress', type: 0x1406, size: 1 },
        { name: 'uResolution', type: 0x8b50, size: 1 },
        { name: 'uTime', type: 0x1406, size: 1 },
      ];
      return uniforms[index] || null;
    }),
    getActiveAttrib: vi.fn((program: any, index: number) => {
      const attribs = [
        { name: 'aPosition', type: 0x8b50, size: 1 },
        { name: 'aTexCoord', type: 0x8b50, size: 1 },
      ];
      return attribs[index] || null;
    }),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform2fv: vi.fn(),
    uniform3fv: vi.fn(),
    uniform4fv: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    deleteTexture: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    activeTexture: vi.fn(),
    createFramebuffer: vi.fn(() => mockFramebuffer),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    createRenderbuffer: vi.fn(() => mockRenderbuffer),
    bindRenderbuffer: vi.fn(),
    renderbufferStorage: vi.fn(),
    framebufferRenderbuffer: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 0x8cd5), // FRAMEBUFFER_COMPLETE
    readPixels: vi.fn(),
    getExtension: vi.fn(() => null),
    getParameter: vi.fn(() => 1024),
    isContextLost: vi.fn(() => false),
  };

  return gl;
};