import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { defineComponent, ref, watch, onMounted, onUnmounted, h } from 'vue';

class EventEmitter {
    constructor() {
        this.events = new Map();
    }
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(handler);
        return this;
    }
    off(event, handler) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.events.delete(event);
            }
        }
        return this;
    }
    emit(event, ...args) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(...args);
                }
                catch (error) {
                    console.error(`Error in event handler for "${String(event)}":`, error);
                }
            });
        }
        return this;
    }
    once(event, handler) {
        const onceHandler = (...args) => {
            this.off(event, onceHandler);
            handler(...args);
        };
        return this.on(event, onceHandler);
    }
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
        return this;
    }
    listenerCount(event) {
        const handlers = this.events.get(event);
        return handlers ? handlers.size : 0;
    }
}

class StateManager extends EventEmitter {
    constructor(initialState = {}) {
        super();
        this.state = {
            currentIndex: 0,
            images: [],
            isPlaying: false,
            isTransitioning: false,
            effect: 'fade',
            transitionDuration: 1000,
            autoplayInterval: 3000,
            loop: true,
            ...initialState,
        };
    }
    getState() {
        return { ...this.state };
    }
    get(key) {
        return this.state[key];
    }
    set(key, value) {
        const oldValue = this.state[key];
        if (oldValue !== value) {
            this.state[key] = value;
            this.emit('stateChange', key, oldValue, value);
            // Emit specific events for certain state changes
            if (key === 'currentIndex') {
                this.emit('indexChange', oldValue, value);
            }
            else if (key === 'isPlaying') {
                this.emit('playStateChange', value);
            }
        }
    }
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }
    canGoNext() {
        const { currentIndex, images, loop } = this.state;
        return loop || currentIndex < images.length - 1;
    }
    canGoPrevious() {
        const { currentIndex, loop } = this.state;
        return loop || currentIndex > 0;
    }
    getNextIndex() {
        const { currentIndex, images, loop } = this.state;
        if (currentIndex === images.length - 1) {
            return loop ? 0 : currentIndex;
        }
        return currentIndex + 1;
    }
    getPreviousIndex() {
        const { currentIndex, images, loop } = this.state;
        if (currentIndex === 0) {
            return loop ? images.length - 1 : currentIndex;
        }
        return currentIndex - 1;
    }
    startTransition(toIndex) {
        if (!this.state.isTransitioning) {
            const fromIndex = this.state.currentIndex;
            this.set('isTransitioning', true);
            this.emit('transitionStart', fromIndex, toIndex);
        }
    }
    endTransition(newIndex) {
        if (this.state.isTransitioning) {
            this.set('isTransitioning', false);
            this.set('currentIndex', newIndex);
            this.emit('transitionEnd', newIndex);
        }
    }
    reset() {
        this.update({
            currentIndex: 0,
            isPlaying: false,
            isTransitioning: false,
        });
    }
}

class ImageLoader {
    constructor(options = {}) {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.options = {
            crossOrigin: 'anonymous',
            timeout: 30000,
            ...options,
        };
    }
    async load(url) {
        // Check cache first
        const cached = this.cache.get(url);
        if (cached) {
            return cached;
        }
        // Check if already loading
        const loading = this.loadingPromises.get(url);
        if (loading) {
            return loading;
        }
        // Start new loading process
        const loadPromise = this.loadImage(url);
        this.loadingPromises.set(url, loadPromise);
        try {
            const loadedImage = await loadPromise;
            this.cache.set(url, loadedImage);
            this.loadingPromises.delete(url);
            return loadedImage;
        }
        catch (error) {
            this.loadingPromises.delete(url);
            throw error;
        }
    }
    async preload(urls) {
        return Promise.all(urls.map((url) => this.load(url)));
    }
    async preloadWithProgress(urls, onProgress) {
        const total = urls.length;
        let loaded = 0;
        const results = [];
        for (const url of urls) {
            try {
                const image = await this.load(url);
                results.push(image);
                loaded++;
                onProgress?.(loaded, total);
            }
            catch (error) {
                // Create a placeholder image for failed loads
                console.warn(`Failed to load image: ${url}`, error);
                // Create a 1x1 transparent image as placeholder
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    ctx.fillRect(0, 0, 1, 1);
                }
                // Convert canvas to image element
                const img = new Image();
                img.src = canvas.toDataURL();
                const placeholderImage = {
                    url: url,
                    element: img,
                    width: 1,
                    height: 1,
                    aspectRatio: 1,
                };
                results.push(placeholderImage);
                loaded++;
                onProgress?.(loaded, total);
            }
        }
        return results;
    }
    getFromCache(url) {
        return this.cache.get(url) || null;
    }
    clearCache(url) {
        if (url) {
            this.cache.delete(url);
            this.loadingPromises.delete(url);
        }
        else {
            this.cache.clear();
            this.loadingPromises.clear();
        }
    }
    getCacheSize() {
        return this.cache.size;
    }
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let timeoutId = null;
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                img.onload = null;
                img.onerror = null;
            };
            const handleLoad = () => {
                cleanup();
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                resolve({
                    url,
                    element: img,
                    width,
                    height,
                    aspectRatio: width / height,
                });
            };
            const handleError = (error) => {
                cleanup();
                reject(new Error(`Failed to load image: ${url}. ${error || ''}`));
            };
            // Set timeout
            if (this.options.timeout && this.options.timeout > 0) {
                timeoutId = setTimeout(() => {
                    handleError('Timeout');
                }, this.options.timeout);
            }
            // Configure image
            // Set crossOrigin before src to ensure CORS headers are requested
            if (this.options.crossOrigin) {
                img.crossOrigin = this.options.crossOrigin;
            }
            img.onload = handleLoad;
            img.onerror = handleError;
            img.src = url;
        });
    }
}

class BaseWebGLRenderer extends EventEmitter {
    constructor() {
        super(...arguments);
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.textures = new Map();
        this.imageSizes = new Map();
        this.uniforms = new Map();
        this.attributes = new Map();
        // Common context lost/restored handlers
        this.handleContextLost = (event) => {
            event.preventDefault();
            this.emit('contextLost');
        };
        this.handleContextRestored = () => {
            this.initialize(this.canvas);
            this.emit('contextRestored');
        };
    }
    // Common texture loading logic
    loadTexture(image) {
        if (!this.gl)
            return null;
        image.src.substring(0, 50) + '...';
        // Cache image size first (before checking for existing texture)
        if (!this.imageSizes.has(image.src)) {
            const imageSize = {
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
            };
            this.imageSizes.set(image.src, imageSize);
        }
        else {
            this.imageSizes.get(image.src);
        }
        // Check if texture already exists
        const existingTexture = this.textures.get(image.src);
        if (existingTexture) {
            return existingTexture;
        }
        const texture = this.createTexture(image);
        if (texture) {
            // Cache texture with image src as key
            this.textures.set(image.src, texture);
        }
        return texture;
    }
    // Template method for texture creation - can be overridden by subclasses
    createTexture(image) {
        if (!this.gl)
            return null;
        const texture = this.gl.createTexture();
        if (!texture)
            return null;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        return texture;
    }
    // Common shader compilation logic
    compileShader(source, type) {
        if (!this.gl)
            return null;
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error('Failed to create shader');
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Failed to compile shader: ${error}`);
        }
        return shader;
    }
    // Common program creation logic
    createProgram(vertexSource, fragmentSource) {
        if (!this.gl)
            return null;
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader)
            return null;
        const program = this.gl.createProgram();
        if (!program) {
            throw new Error('Failed to create shader program');
        }
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
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
    // Common uniform and attribute caching logic
    cacheUniformsAndAttributes() {
        if (!this.gl || !this.program)
            return;
        this.uniforms.clear();
        this.attributes.clear();
        // Get all active uniforms dynamically from the shader program
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
        // Get all active attributes dynamically from the shader program
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
    }
    // Common resize logic
    resize(width, height) {
        if (!this.gl || !this.canvas)
            return;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
    // Common image size uniform setting logic
    setImageSizeUniforms(currentImageSrc, nextImageSrc) {
        if (!this.gl || !this.canvas)
            return;
        const imageSize0Loc = this.uniforms.get('uImageSize0');
        const imageSize1Loc = this.uniforms.get('uImageSize1');
        if (imageSize0Loc) {
            const size = currentImageSrc ? this.imageSizes.get(currentImageSrc) : null;
            if (size && size.width > 0 && size.height > 0) {
                this.gl.uniform2f(imageSize0Loc, size.width, size.height);
            }
            else {
                // Default to a square aspect ratio instead of canvas size
                const defaultSize = Math.min(this.canvas.width, this.canvas.height);
                this.gl.uniform2f(imageSize0Loc, defaultSize, defaultSize);
            }
        }
        if (imageSize1Loc) {
            let size = null;
            if (nextImageSrc) {
                size = this.imageSizes.get(nextImageSrc);
            }
            else if (currentImageSrc) {
                // For initial render, use the same image size for both textures
                size = this.imageSizes.get(currentImageSrc);
            }
            if (size && size.width > 0 && size.height > 0) {
                this.gl.uniform2f(imageSize1Loc, size.width, size.height);
            }
            else {
                // Default to a square aspect ratio instead of canvas size
                const defaultSize = Math.min(this.canvas.width, this.canvas.height);
                this.gl.uniform2f(imageSize1Loc, defaultSize, defaultSize);
            }
        }
    }
    // Common cleanup logic
    disposeCommon() {
        if (!this.gl)
            return;
        // Delete textures
        this.textures.forEach((texture) => {
            this.gl.deleteTexture(texture);
        });
        this.textures.clear();
        this.imageSizes.clear();
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
    isInitialized() {
        return this.gl !== null && this.program !== null;
    }
    getContext() {
        return this.gl;
    }
}

class WebGLRenderer extends BaseWebGLRenderer {
    constructor(options = {}) {
        super();
        this.vertexBuffer = null;
        this.options = {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            ...options,
        };
    }
    initialize(canvas) {
        this.canvas = canvas;
        try {
            this.gl =
                canvas.getContext('webgl', this.options) ||
                    canvas.getContext('experimental-webgl', this.options);
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            this.setupEventListeners();
            this.initializeVertexBuffer();
            this.setDefaultEffect();
            return true;
        }
        catch (error) {
            this.emit('error', error);
            return false;
        }
    }
    setupEventListeners() {
        if (!this.canvas)
            return;
        this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    }
    initializeVertexBuffer() {
        if (!this.gl)
            return;
        // Y texture coordinates are flipped to correct for WebGL's coordinate system
        const vertices = new Float32Array([
            -1,
            -1,
            0.0,
            1.0, // Bottom-left
            1.0,
            -1,
            1.0,
            1.0, // Bottom-right
            -1,
            1.0,
            0.0,
            0.0, // Top-left
            1.0,
            1.0,
            1.0,
            0.0, // Top-right
        ]);
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }
    setDefaultEffect() {
        const vertexShader = `
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      varying vec2 vTexCoord;
      
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        vTexCoord = aTexCoord;
      }
    `;
        const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform float uProgress;
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      
      varying vec2 vTexCoord;
      
      // getCoverUV function for proper aspect ratio handling
      vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
        float imageAspect = imageSize.x / imageSize.y;
        float screenAspect = resolution.x / resolution.y;
        vec2 scale;
        
        if (screenAspect > imageAspect) {
          scale = vec2(1.0, imageAspect / screenAspect);
        } else {
          scale = vec2(screenAspect / imageAspect, 1.0);
        }
        
        return (uv - 0.5) / scale + 0.5;
      }
      
      void main() {
        vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
        vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
        
        vec4 color0 = texture2D(uTexture0, uv0);
        vec4 color1 = texture2D(uTexture1, uv1);
        gl_FragColor = mix(color0, color1, uProgress);
      }
    `;
        this.setEffect({ vertexShader, fragmentShader });
    }
    setEffect(effect) {
        if (!this.gl)
            return;
        try {
            const program = super.createProgram(effect.vertexShader, effect.fragmentShader);
            if (program) {
                if (this.program) {
                    this.gl.deleteProgram(this.program);
                }
                this.program = program;
                super.cacheUniformsAndAttributes();
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    render(currentTexture, nextTexture, progress, additionalUniforms, currentImageSrc, nextImageSrc) {
        if (!this.gl || !this.program || !currentTexture)
            return;
        this.gl.useProgram(this.program);
        // Clear
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        // Set attributes
        const positionLoc = this.attributes.get('aPosition');
        const texCoordLoc = this.attributes.get('aTexCoord');
        if (positionLoc !== undefined) {
            this.gl.enableVertexAttribArray(positionLoc);
            this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 4 * 4, 0);
        }
        if (texCoordLoc !== undefined) {
            this.gl.enableVertexAttribArray(texCoordLoc);
            this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 4 * 4, 2 * 4);
        }
        // Bind textures
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
        // Bind texture1 - nextTexture if available, otherwise bind current texture
        this.gl.activeTexture(this.gl.TEXTURE1);
        if (nextTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, nextTexture);
        }
        else {
            // For single texture rendering, bind currentTexture to both slots
            this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
        }
        // Set uniforms
        const texture0Loc = this.uniforms.get('uTexture0');
        const texture1Loc = this.uniforms.get('uTexture1');
        const progressLoc = this.uniforms.get('uProgress');
        if (texture0Loc)
            this.gl.uniform1i(texture0Loc, 0);
        if (texture1Loc)
            this.gl.uniform1i(texture1Loc, 1);
        if (progressLoc)
            this.gl.uniform1f(progressLoc, progress);
        // Set resolution uniform if available
        const resolutionLoc = this.uniforms.get('uResolution');
        if (resolutionLoc && this.canvas) {
            this.gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
        }
        // Set image size uniforms
        super.setImageSizeUniforms(currentImageSrc, nextImageSrc);
        // Set additional uniforms
        if (additionalUniforms) {
            Object.entries(additionalUniforms).forEach(([name, value]) => {
                const location = this.gl.getUniformLocation(this.program, name);
                if (location) {
                    if (Array.isArray(value) || value instanceof Float32Array) {
                        const len = value.length;
                        switch (len) {
                            case 2:
                                this.gl.uniform2fv(location, value);
                                break;
                            case 3:
                                this.gl.uniform3fv(location, value);
                                break;
                            case 4:
                                this.gl.uniform4fv(location, value);
                                break;
                            default:
                                if (len === 1) {
                                    this.gl.uniform1f(location, value[0] ?? 0);
                                }
                                break;
                        }
                    }
                    else if (typeof value === 'number') {
                        this.gl.uniform1f(location, value);
                    }
                }
            });
        }
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    dispose() {
        if (!this.gl)
            return;
        // Delete vertex buffer
        if (this.vertexBuffer) {
            this.gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }
        // Call parent dispose
        super.disposeCommon();
    }
}

class WebGL2Renderer extends BaseWebGLRenderer {
    constructor(options = {}) {
        super();
        this.vertexArray = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.uniformBlockIndices = new Map();
        this.meshData = null;
        this.transformFeedback = null;
        this.computeTextures = new Map();
        this.options = {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            ...options,
        };
    }
    initialize(canvas) {
        this.canvas = canvas;
        try {
            this.gl = canvas.getContext('webgl2', this.options);
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
        }
        catch (error) {
            this.emit('error', error);
            return false;
        }
    }
    setupEventListeners() {
        if (!this.canvas)
            return;
        this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    }
    initializeDefaultMesh() {
        if (!this.gl)
            return;
        // Create VAO
        this.vertexArray = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vertexArray);
        // Default quad mesh
        const vertices = new Float32Array([
            -1,
            -1,
            0.0, // Position
            0.0,
            1.0, // TexCoord (flipped Y)
            1.0,
            -1,
            0.0, // Position
            1.0,
            1.0, // TexCoord
            -1,
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
    setMesh(meshData) {
        if (!this.gl)
            return;
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
    setupMeshAttributes() {
        if (!this.gl || !this.program || !this.meshData)
            return;
        const stride = 5 * 4; // 3 for position, 2 for texCoord
        // Position attribute
        const positionLoc = this.gl.getAttribLocation(this.program, 'aPosition');
        if (positionLoc >= 0) {
            this.gl.enableVertexAttribArray(positionLoc);
            this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, stride, 0);
        }
        else {
            console.error('[WebGL2Renderer.setupMeshAttributes] aPosition not found in shader!');
        }
        // TexCoord attribute
        const texCoordLoc = this.gl.getAttribLocation(this.program, 'aTexCoord');
        if (texCoordLoc >= 0) {
            this.gl.enableVertexAttribArray(texCoordLoc);
            this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, stride, 3 * 4);
        }
        else {
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
    setDefaultEffect() {
        const vertexShader = `#version 300 es
      in vec3 aPosition;
      in vec2 aTexCoord;
      
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
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
      uniform vec2 uResolution;
      uniform vec2 uImageSize0;
      uniform vec2 uImageSize1;
      
      in vec2 vTexCoord;
      out vec4 fragColor;
      
      // getCoverUV function for proper aspect ratio handling
      vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
        float imageAspect = imageSize.x / imageSize.y;
        float screenAspect = resolution.x / resolution.y;
        vec2 scale;
        
        if (screenAspect > imageAspect) {
          scale = vec2(1.0, imageAspect / screenAspect);
        } else {
          scale = vec2(screenAspect / imageAspect, 1.0);
        }
        
        return (uv - 0.5) / scale + 0.5;
      }
      
      void main() {
        vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
        vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
        
        vec4 color0 = texture(uTexture0, uv0);
        vec4 color1 = texture(uTexture1, uv1);
        fragColor = mix(color0, color1, uProgress);
      }
    `;
        this.setEffect({ vertexShader, fragmentShader });
    }
    setEffect(effect) {
        if (!this.gl)
            return;
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
            const program = effect.transformFeedbackVaryings
                ? this.createProgram(vertexShader, fragmentShader, effect.transformFeedbackVaryings)
                : super.createProgram(vertexShader, fragmentShader);
            if (program) {
                if (this.program) {
                    this.gl.deleteProgram(this.program);
                }
                this.program = program;
                super.cacheUniformsAndAttributes();
                // Re-setup mesh attributes with new program
                if (this.vertexArray && this.meshData) {
                    this.gl.bindVertexArray(this.vertexArray);
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                    this.setupMeshAttributes();
                    this.gl.bindVertexArray(null);
                }
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    // Override to support transform feedback
    createProgram(vertexSource, fragmentSource, transformFeedbackVaryings) {
        if (!this.gl)
            return null;
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader)
            return null;
        const program = this.gl.createProgram();
        if (!program) {
            throw new Error('Failed to create shader program');
        }
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        // Setup transform feedback if specified
        if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
            this.gl.transformFeedbackVaryings(program, transformFeedbackVaryings, this.gl.INTERLEAVED_ATTRIBS);
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
    compileShader(source, type) {
        if (!this.gl)
            return null;
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error('Failed to create shader');
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error('[WebGL2Renderer] Shader compilation error:', error);
            this.gl.deleteShader(shader);
            throw new Error(`Failed to compile shader: ${error}`);
        }
        return shader;
    }
    cacheUniformsAndAttributes() {
        if (!this.gl || !this.program)
            return;
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
        const numUniformBlocks = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORM_BLOCKS);
        for (let i = 0; i < numUniformBlocks; i++) {
            const name = this.gl.getActiveUniformBlockName(this.program, i);
            if (name) {
                const index = this.gl.getUniformBlockIndex(this.program, name);
                this.uniformBlockIndices.set(name, index);
            }
        }
    }
    // Override to add WebGL2-specific texture features
    createTexture(image) {
        if (!this.gl)
            return null;
        const texture = this.gl.createTexture();
        if (!texture)
            return null;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        try {
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        }
        catch (error) {
            console.error('[WebGL2Renderer.createTexture] Failed to create texture:', error);
            this.gl.deleteTexture(texture);
            return null;
        }
        // Generate mipmaps
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        // Enable anisotropic filtering if available
        const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            const maxAnisotropy = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
        }
        return texture;
    }
    createComputeTexture(width, height, data) {
        if (!this.gl)
            return null;
        const texture = this.gl.createTexture();
        if (!texture)
            return null;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, width, height, 0, this.gl.RGBA, this.gl.FLOAT, data || null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        return texture;
    }
    setupTransformFeedback(buffers, _varyings) {
        if (!this.gl)
            return;
        if (this.transformFeedback) {
            this.gl.deleteTransformFeedback(this.transformFeedback);
        }
        this.transformFeedback = this.gl.createTransformFeedback();
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
        buffers.forEach((buffer, index) => {
            this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, index, buffer);
        });
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
    }
    render(currentTexture, nextTexture, progress, additionalUniforms, currentImageSrc, nextImageSrc, instanceCount) {
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
        if (texture0Loc)
            this.gl.uniform1i(texture0Loc, 0);
        if (texture1Loc)
            this.gl.uniform1i(texture1Loc, 1);
        if (progressLoc)
            this.gl.uniform1f(progressLoc, progress);
        // Set resolution uniform if available
        const resolutionLoc = this.uniforms.get('uResolution');
        if (resolutionLoc && this.canvas) {
            this.gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
        }
        // Set image size uniforms
        super.setImageSizeUniforms(currentImageSrc, nextImageSrc);
        // Set additional uniforms
        if (additionalUniforms) {
            Object.entries(additionalUniforms).forEach(([name, value]) => {
                const location = this.uniforms.get(name);
                if (location) {
                    if (value instanceof Float32Array) {
                        switch (value.length) {
                            case 16:
                                this.gl.uniformMatrix4fv(location, false, value);
                                break;
                            case 9:
                                this.gl.uniformMatrix3fv(location, false, value);
                                break;
                            case 4:
                                this.gl.uniform4fv(location, value);
                                break;
                            case 3:
                                this.gl.uniform3fv(location, value);
                                break;
                            case 2:
                                this.gl.uniform2fv(location, value);
                                break;
                            default:
                                this.gl.uniform1fv(location, value);
                        }
                    }
                    else if (Array.isArray(value)) {
                        switch (value.length) {
                            case 2:
                                this.gl.uniform2fv(location, value);
                                break;
                            case 3:
                                this.gl.uniform3fv(location, value);
                                break;
                            case 4:
                                this.gl.uniform4fv(location, value);
                                break;
                        }
                    }
                    else {
                        this.gl.uniform1f(location, value);
                    }
                }
            });
        }
        // Draw
        try {
            if (this.meshData) {
                if (instanceCount && instanceCount > 1) {
                    this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0, instanceCount);
                }
                else {
                    this.gl.drawElements(this.gl.TRIANGLES, this.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
                }
            }
            else {
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
        }
        catch (error) {
            console.error('[WebGL2Renderer.render] Draw error:', error);
            throw error;
        }
        this.gl.bindVertexArray(null);
    }
    renderWithTransformFeedback(currentTexture, nextTexture, progress, additionalUniforms) {
        if (!this.gl || !this.program || !this.transformFeedback)
            return;
        this.gl.enable(this.gl.RASTERIZER_DISCARD);
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
        this.gl.beginTransformFeedback(this.gl.POINTS);
        this.render(currentTexture, nextTexture, progress, additionalUniforms);
        this.gl.endTransformFeedback();
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
        this.gl.disable(this.gl.RASTERIZER_DISCARD);
    }
    dispose() {
        if (!this.gl)
            return;
        // Delete WebGL 2.0 specific resources
        this.computeTextures.forEach((texture) => {
            this.gl.deleteTexture(texture);
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
        // Call parent dispose
        super.disposeCommon();
    }
    isInitialized() {
        return super.isInitialized() && this.vertexArray !== null;
    }
    isWebGL2() {
        return true;
    }
    convertVertexShaderToWebGL2(shader) {
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
    convertFragmentShaderToWebGL2(shader) {
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

class Canvas2DFallback {
    constructor(options = {}) {
        this.canvas = null;
        this.ctx = null;
        this.currentImage = null;
        this.nextImage = null;
        this.options = {
            transitionDuration: 1000,
            ...options,
        };
    }
    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) {
            return false;
        }
        // Set image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        return true;
    }
    setImages(current, next) {
        this.currentImage = current;
        this.nextImage = next;
    }
    render(progress) {
        if (!this.ctx || !this.canvas)
            return;
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Calculate dimensions to maintain aspect ratio
        const canvasRatio = this.canvas.width / this.canvas.height;
        if (this.currentImage && progress < 1) {
            const imageRatio = this.currentImage.width / this.currentImage.height;
            const { width, height, x, y } = this.calculateDimensions(this.canvas.width, this.canvas.height, imageRatio, canvasRatio);
            // Draw current image with fade out effect
            this.ctx.save();
            this.ctx.globalAlpha = 1 - progress;
            this.ctx.drawImage(this.currentImage, x, y, width, height);
            this.ctx.restore();
        }
        if (this.nextImage && progress > 0) {
            const imageRatio = this.nextImage.width / this.nextImage.height;
            const { width, height, x, y } = this.calculateDimensions(this.canvas.width, this.canvas.height, imageRatio, canvasRatio);
            // Draw next image with fade in effect
            this.ctx.save();
            this.ctx.globalAlpha = progress;
            this.ctx.drawImage(this.nextImage, x, y, width, height);
            this.ctx.restore();
        }
    }
    calculateDimensions(canvasWidth, canvasHeight, imageRatio, canvasRatio) {
        let width;
        let height;
        let x = 0;
        let y = 0;
        if (imageRatio > canvasRatio) {
            // Image is wider than canvas
            width = canvasWidth;
            height = canvasWidth / imageRatio;
            y = (canvasHeight - height) / 2;
        }
        else {
            // Image is taller than canvas
            height = canvasHeight;
            width = canvasHeight * imageRatio;
            x = (canvasWidth - width) / 2;
        }
        return { width, height, x, y };
    }
    resize(width, height) {
        if (!this.canvas)
            return;
        this.canvas.width = width;
        this.canvas.height = height;
        // Redraw after resize
        this.render(0);
    }
    dispose() {
        this.canvas = null;
        this.ctx = null;
        this.currentImage = null;
        this.nextImage = null;
    }
    isInitialized() {
        return this.ctx !== null;
    }
    getContext() {
        return this.ctx;
    }
}

class EffectManager {
    constructor() {
        this.effects = new Map();
        this.defaultEffectName = 'fade';
    }
    register(effect) {
        if (!effect.name) {
            throw new Error('Effect must have a name');
        }
        if (this.effects.has(effect.name)) {
            console.warn(`Effect "${effect.name}" is already registered. Overwriting...`);
        }
        this.effects.set(effect.name, effect);
    }
    unregister(name) {
        return this.effects.delete(name);
    }
    get(name) {
        return this.effects.get(name) || null;
    }
    has(name) {
        return this.effects.has(name);
    }
    list() {
        return Array.from(this.effects.keys());
    }
    clear() {
        this.effects.clear();
    }
    size() {
        return this.effects.size;
    }
    setDefault(name) {
        if (!this.effects.has(name)) {
            throw new Error(`Effect "${name}" is not registered`);
        }
        this.defaultEffectName = name;
    }
    getDefault() {
        return this.get(this.defaultEffectName);
    }
    getDefaultName() {
        return this.defaultEffectName;
    }
}
// Factory function for creating effect managers with pre-registered effects
function createEffectManager(effects) {
    const manager = new EffectManager();
    if (effects) {
        effects.forEach((effect) => manager.register(effect));
    }
    return manager;
}

class BaseEffect {
    constructor() {
        // Default vertex shader that can be overridden
        this.vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;
    }
    // WebGL 2.0 support
    get requiresWebGL2() {
        return false;
    }
    // Custom mesh support
    get requiresCustomMesh() {
        return false;
    }
    getMesh() {
        throw new Error('getMesh() must be implemented for effects that require custom meshes');
    }
    // Instance data for instanced rendering
    getInstanceData() {
        return {
            positions: new Float32Array(0),
            offsets: new Float32Array(0),
            scales: new Float32Array(0),
        };
    }
    // Transform feedback varyings for WebGL 2.0
    getTransformFeedbackVaryings() {
        return [];
    }
}

// Common shader functions and utilities
const commonShaderFunctions = `
  // Custom smooth step function for transitions
  float customSmoothstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  
  // Cubic easing function
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  
  // Linear interpolation
  vec4 mix4(vec4 a, vec4 b, float t) {
    return a * (1.0 - t) + b * t;
  }
  
  // 2D rotation matrix
  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
  
  // Convert normalized coordinates to aspect-corrected coordinates
  vec2 aspectCorrect(vec2 uv, vec2 resolution) {
    float aspect = resolution.x / resolution.y;
    return vec2(uv.x * aspect, uv.y);
  }
`;
const createFragmentShader = (effectCode, includeCommon = true) => {
    const common = includeCommon ? commonShaderFunctions : '';
    return `
    precision mediump float;
    
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform vec2 uImageSize0;
    uniform vec2 uImageSize1;
    
    varying vec2 vTexCoord;
    
    // Calculate UV coordinates for cover fit
    vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
      // Ensure we have valid sizes
      if (imageSize.x <= 0.0 || imageSize.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
        return uv;
      }
      
      float imageAspect = imageSize.x / imageSize.y;
      float canvasAspect = resolution.x / resolution.y;
      
      vec2 scale = vec2(1.0);
      if (imageAspect > canvasAspect) {
        // Image is wider, scale by height
        scale.x = imageAspect / canvasAspect;
      } else {
        // Image is taller, scale by width
        scale.y = canvasAspect / imageAspect;
      }
      
      // Center the UV coordinates
      vec2 scaledUV = (uv - 0.5) / scale + 0.5;
      
      return scaledUV;
    }
    
    ${common}
    
    ${effectCode}
  `;
};

class FadeEffect extends BaseEffect {
    constructor() {
        super(...arguments);
        this.name = 'fade';
        this.fragmentShader = createFragmentShader(`
    void main() {
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Simple linear fade
      gl_FragColor = mix(color0, color1, uProgress);
    }
  `);
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
        };
    }
}

class SlideEffect extends BaseEffect {
    constructor(direction = 'left') {
        super();
        this.fragmentShader = createFragmentShader(`
    uniform vec2 uDirection;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Calculate offset based on progress
      vec2 offset = uDirection * uProgress;
      
      // Calculate UVs for both images with proper aspect ratio
      vec2 uv0 = getCoverUV(uv + offset, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(uv + offset - uDirection, uImageSize1, uResolution);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Calculate transition boundary
      vec2 transitionUV = uv + offset - uDirection;
      
      // Create mask based on direction
      float mask;
      if (abs(uDirection.x) > 0.5) {
        // Horizontal slide
        mask = step(0.0, transitionUV.x) * step(transitionUV.x, 1.0);
      } else {
        // Vertical slide
        mask = step(0.0, transitionUV.y) * step(transitionUV.y, 1.0);
      }
      
      gl_FragColor = mix(color0, color1, mask);
    }
  `);
        this.direction = direction;
        this.name = `slide${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    }
    getUniforms(progress) {
        let direction = [0, 0];
        switch (this.direction) {
            case 'left':
                direction = [-1, 0];
                break;
            case 'right':
                direction = [1, 0];
                break;
            case 'up':
                direction = [0, 1];
                break;
            case 'down':
                direction = [0, -1];
                break;
        }
        return {
            uProgress: progress,
            uDirection: direction,
        };
    }
}

class FlipEffect extends BaseEffect {
    constructor(axis = 'horizontal') {
        super();
        // カスタム頂点シェーダー - 画像を変形
        this.vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform float uAxis;
    
    varying vec2 vTexCoord;
    
    void main() {
      vTexCoord = aTexCoord;
      
      // 回転角度
      float angle = uProgress * 3.14159;
      float scale = abs(cos(angle));
      
      vec2 position = aPosition;
      
      if (uAxis < 0.5) {
        // Horizontal flip - X方向のみ縮小
        position.x *= scale;
      } else {
        // Vertical flip - Y方向のみ縮小  
        position.y *= scale;
      }
      
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
        this.fragmentShader = createFragmentShader(`
    uniform float uAxis;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // 回転角度
      float angle = uProgress * 3.14159;
      float cosAngle = cos(angle);
      
      // スケール計算（0で完全に消える）
      float scale = abs(cosAngle);
      
      // 表裏の判定
      bool isBackface = cosAngle < 0.0;
      
      vec4 finalColor;
      
      if (!isBackface) {
        // 表面：1枚目の画像
        vec2 uv0 = getCoverUV(uv, uImageSize0, uResolution);
        finalColor = texture2D(uTexture0, uv0);
      } else {
        // 裏面：2枚目の画像
        vec2 uv1 = getCoverUV(uv, uImageSize1, uResolution);
        finalColor = texture2D(uTexture1, uv1);
      }
      
      // 軽いシェーディング効果
      float shading = 0.7 + 0.3 * scale;
      finalColor.rgb *= shading;
      
      gl_FragColor = finalColor;
    }
  `);
        this.axis = axis;
        this.name = `flip${axis.charAt(0).toUpperCase() + axis.slice(1)}`;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uAxis: this.axis === 'vertical' ? 1 : 0,
        };
    }
}

class WaveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'wave';
        this.fragmentShader = createFragmentShader(`
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform float uTime;
    
    void main() {
      vec2 uv = vTexCoord;
      
      // Create wave displacement
      float wave = sin(uv.y * uFrequency + uTime * uSpeed) * uAmplitude;
      
      // Apply wave based on progress
      float displacement = wave * (1.0 - abs(uProgress - 0.5) * 2.0);
      
      // Apply wave displacement then aspect ratio correction
      vec2 displacedUV0 = vec2(uv.x + displacement * (1.0 - uProgress), uv.y);
      vec2 displacedUV1 = vec2(uv.x + displacement * uProgress, uv.y);
      
      vec2 uv0 = getCoverUV(displacedUV0, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(displacedUV1, uImageSize1, uResolution);
      
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix with wave-influenced progress
      float mixFactor = smoothstep(0.0, 1.0, uProgress + wave * 0.5);
      
      gl_FragColor = mix(color0, color1, mixFactor);
    }
  `);
        this.startTime = Date.now();
        this.amplitude = options.amplitude ?? 0.1;
        this.frequency = options.frequency ?? 10.0;
        this.speed = options.speed ?? 1.0;
    }
    getUniforms(progress) {
        const time = (Date.now() - this.startTime) / 1000; // Convert to seconds
        return {
            uProgress: progress,
            uAmplitude: this.amplitude,
            uFrequency: this.frequency,
            uSpeed: this.speed,
            uTime: time,
        };
    }
    onBeforeRender(_gl) {
        // Reset time on each transition start
        if (this.lastProgress === 0 && this.lastProgress !== undefined) {
            this.startTime = Date.now();
        }
        this.lastProgress = this.lastProgress ?? 0;
    }
}

class DistortionEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'distortion';
        this.fragmentShader = createFragmentShader(`
    uniform float uIntensity;
    uniform float uRadius;
    uniform float uSpiral;
    
    vec2 distort(vec2 uv, float progress) {
      // Center the coordinates
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = uv - center;
      float dist = length(dir);
      
      // Create distortion effect
      float distortionAmount = 0.0;
      
      if (dist < uRadius) {
        // Smooth the edge of distortion
        float edge = smoothstep(0.0, uRadius, dist);
        
        // Calculate rotation based on distance and progress
        float angle = progress * uSpiral * (1.0 - edge);
        
        // Apply rotation
        float s = sin(angle);
        float c = cos(angle);
        dir = vec2(
          dir.x * c - dir.y * s,
          dir.x * s + dir.y * c
        );
        
        // Add radial distortion
        float radialDistort = (1.0 - edge) * progress * uIntensity;
        dir *= 1.0 + radialDistort;
      }
      
      return center + dir;
    }
    
    void main() {
      // Create two different distortion phases
      float phase1 = smoothstep(0.0, 0.5, uProgress);
      float phase2 = smoothstep(0.5, 1.0, uProgress);
      
      // Distort UV coordinates
      vec2 distortedUV0 = distort(vTexCoord, phase1);
      vec2 distortedUV1 = distort(vTexCoord, 1.0 - phase2);
      
      // Apply aspect ratio correction after distortion
      vec2 uv0 = getCoverUV(distortedUV0, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(distortedUV1, uImageSize1, uResolution);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix based on progress
      float mixFactor = smoothstep(0.4, 0.6, uProgress);
      
      gl_FragColor = mix(color0, color1, mixFactor);
      
      // Add vignette effect during transition
      float vignette = 1.0 - length(vTexCoord - 0.5) * 0.5 * sin(uProgress * 3.14159);
      gl_FragColor.rgb *= vignette;
    }
  `);
        this.intensity = options.intensity ?? 0.5;
        this.radius = options.radius ?? 0.8;
        this.spiral = options.spiral ?? 2.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uIntensity: this.intensity,
            uRadius: this.radius,
            uSpiral: this.spiral,
        };
    }
}

class DissolveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'dissolve';
        this.fragmentShader = createFragmentShader(`
    uniform float uScale;
    uniform float uThreshold;
    uniform float uFadeWidth;
    
    // Simple pseudo-random function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Noise function
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Generate noise for dissolve effect
      float n = noise(vTexCoord * uScale);
      
      // Add some variation with multiple octaves
      n += noise(vTexCoord * uScale * 2.0) * 0.5;
      n += noise(vTexCoord * uScale * 4.0) * 0.25;
      n = n / 1.75; // Normalize
      
      // Calculate dissolve threshold
      float threshold = uProgress * (1.0 + uFadeWidth * 2.0) - uFadeWidth;
      
      // Create smooth transition
      float alpha = smoothstep(threshold - uFadeWidth, threshold + uFadeWidth, n);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix colors based on dissolve
      gl_FragColor = mix(color1, color0, alpha);
    }
  `);
        this.scale = options.scale ?? 10.0;
        this.threshold = options.threshold ?? 0.5;
        this.fadeWidth = options.fadeWidth ?? 0.1;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uScale: this.scale,
            uThreshold: this.threshold,
            uFadeWidth: this.fadeWidth,
        };
    }
}

class CircleEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'circle';
        this.fragmentShader = createFragmentShader(`
    uniform vec2 uCenter;
    uniform float uFeather;
    uniform float uScale;
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Calculate distance from center
      vec2 center = uCenter;
      vec2 pos = vTexCoord - center;
      
      // Correct for aspect ratio
      float aspect = uResolution.x / uResolution.y;
      pos.x *= aspect;
      
      float dist = length(pos);
      
      // Calculate circle radius based on progress
      float radius = uProgress * uScale * sqrt(2.0); // sqrt(2) to cover corners
      
      // Create smooth edge
      float alpha = smoothstep(radius - uFeather, radius + uFeather, dist);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix based on circle mask
      gl_FragColor = mix(color1, color0, alpha);
    }
  `);
        this.centerX = options.centerX ?? 0.5;
        this.centerY = options.centerY ?? 0.5;
        this.feather = options.feather ?? 0.1;
        this.scale = options.scale ?? 1.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uCenter: [this.centerX, this.centerY],
            uFeather: this.feather,
            uScale: this.scale,
        };
    }
}

class PixelDissolveEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'pixelDissolve';
        this.fragmentShader = createFragmentShader(`
    uniform float uPixelSize;
    uniform float uStagger;
    
    // Simple pseudo-random function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Apply aspect ratio correction
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // Calculate pixel grid coordinates
      vec2 pixelCoord = floor(vTexCoord * uResolution / uPixelSize);
      
      // Generate random value per pixel
      float pixelRandom = random(pixelCoord);
      
      // Add some variation based on position
      float positionBias = (pixelCoord.x + pixelCoord.y) / (uResolution.x / uPixelSize + uResolution.y / uPixelSize);
      pixelRandom = mix(pixelRandom, positionBias, uStagger);
      
      // Calculate transition threshold
      float threshold = uProgress;
      
      // Determine pixel visibility with hard edge
      float alpha = step(pixelRandom, threshold);
      
      // Sample textures
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // Mix colors based on pixel visibility
      gl_FragColor = mix(color0, color1, alpha);
    }
  `);
        this.pixelSize = options.pixelSize ?? 20.0;
        this.stagger = options.stagger ?? 0.3;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uPixelSize: this.pixelSize,
            uStagger: this.stagger,
        };
    }
}

class MorphEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'morph';
        // カスタム頂点シェーダー - 頂点を動的に変形
        this.vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    uniform float uProgress;
    uniform float uMorphIntensity;
    uniform float uTwistAmount;
    uniform float uWaveFrequency;
    uniform vec2 uResolution;
    
    varying vec2 vTexCoord;
    varying float vMorphAmount;
    
    void main() {
      vTexCoord = aTexCoord;
      
      // 中心からの距離を計算
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = aTexCoord - center;
      float dist = length(toCenter);
      
      // プログレスに基づくモーフ量を計算
      float morphProgress = smoothstep(0.0, 1.0, uProgress);
      float morphAmount = sin(morphProgress * 3.14159);
      vMorphAmount = morphAmount;
      
      // 頂点の変位を計算
      vec2 position = aPosition;
      
      // ツイスト効果
      float angle = atan(toCenter.y, toCenter.x);
      float twist = sin(angle * uWaveFrequency + morphProgress * uTwistAmount) * morphAmount;
      position.x += twist * toCenter.y * uMorphIntensity;
      position.y -= twist * toCenter.x * uMorphIntensity;
      
      // 波形効果
      float wave = sin(dist * 10.0 - morphProgress * 5.0) * morphAmount;
      position += normalize(toCenter) * wave * uMorphIntensity * 0.5;
      
      // Z軸の変位（3D効果）
      float z = sin(dist * 8.0 + morphProgress * 4.0) * morphAmount * 0.3;
      
      gl_Position = vec4(position, z, 1.0);
    }
  `;
        this.fragmentShader = createFragmentShader(`
    uniform float uGridSize;
    varying float vMorphAmount;
    
    void main() {
      vec2 uv0 = getCoverUV(vTexCoord, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(vTexCoord, uImageSize1, uResolution);
      
      // グリッドベースの歪み
      vec2 gridUV = vTexCoord * uGridSize;
      vec2 gridPos = floor(gridUV);
      vec2 gridFract = fract(gridUV);
      
      // モーフ量に基づく歪み
      vec2 distortion = sin(gridPos * 0.1 + vMorphAmount * 3.14159) * 0.02 * vMorphAmount;
      
      vec2 distortedUV0 = uv0 + distortion;
      vec2 distortedUV1 = uv1 - distortion;
      
      vec4 color0 = texture2D(uTexture0, distortedUV0);
      vec4 color1 = texture2D(uTexture1, distortedUV1);
      
      // エッジ効果
      float edge = 1.0 - smoothstep(0.4, 0.5, abs(gridFract.x - 0.5)) * 
                         smoothstep(0.4, 0.5, abs(gridFract.y - 0.5));
      edge *= vMorphAmount;
      
      // カラーミックス
      float mixFactor = smoothstep(0.3, 0.7, uProgress);
      vec4 finalColor = mix(color0, color1, mixFactor);
      
      // エッジハイライト
      finalColor.rgb += vec3(edge * 0.2);
      
      // 色収差効果
      vec2 aberration = distortion * 2.0;
      finalColor.r = mix(
        texture2D(uTexture0, distortedUV0 + aberration).r,
        texture2D(uTexture1, distortedUV1 + aberration).r,
        mixFactor
      );
      finalColor.b = mix(
        texture2D(uTexture0, distortedUV0 - aberration).b,
        texture2D(uTexture1, distortedUV1 - aberration).b,
        mixFactor
      );
      
      gl_FragColor = finalColor;
    }
  `);
        this.gridSize = options.gridSize ?? 50.0;
        this.morphIntensity = options.morphIntensity ?? 0.3;
        this.twistAmount = options.twistAmount ?? 2.0;
        this.waveFrequency = options.waveFrequency ?? 3.0;
    }
    getUniforms(progress) {
        return {
            uProgress: progress,
            uGridSize: this.gridSize,
            uMorphIntensity: this.morphIntensity,
            uTwistAmount: this.twistAmount,
            uWaveFrequency: this.waveFrequency,
        };
    }
}

class GlitchEffect extends BaseEffect {
    constructor(options = {}) {
        super();
        this.name = 'glitch';
        this.fragmentShader = createFragmentShader(`
    uniform float uIntensity;
    uniform float uSliceCount;
    uniform float uColorShift;
    uniform float uNoiseAmount;
    uniform float uTime;
    
    // 擬似乱数生成
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // ノイズ関数
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 uv = vTexCoord;
      
      // グリッチ強度の計算（時間ベース）
      float glitchStrength = step(0.5, sin(uTime * 20.0)) * uIntensity;
      glitchStrength *= step(0.8, random(vec2(uTime * 10.0, 0.0)));
      
      // プログレスに基づくグリッチの増減
      float progressGlitch = sin(uProgress * 3.14159);
      glitchStrength *= progressGlitch;
      
      // 水平スライスの計算
      float slice = floor(uv.y * uSliceCount);
      float sliceOffset = random(vec2(slice, uTime)) * 2.0 - 1.0;
      sliceOffset *= step(0.7, random(vec2(slice * 2.0, uTime * 10.0))) * glitchStrength;
      
      // UV座標の歪み
      vec2 distortedUV = uv;
      distortedUV.x += sliceOffset * 0.1;
      
      // ブロックノイズ
      vec2 blockSize = vec2(0.05, 0.03);
      vec2 blockCoord = floor(uv / blockSize) * blockSize;
      float blockNoise = step(0.9, random(blockCoord + vec2(uTime * 5.0))) * glitchStrength;
      distortedUV += blockNoise * (random(blockCoord * 2.0) - 0.5) * uNoiseAmount;
      
      // アスペクト比補正を適用
      vec2 uv0 = getCoverUV(distortedUV, uImageSize0, uResolution);
      vec2 uv1 = getCoverUV(distortedUV, uImageSize1, uResolution);
      
      // テクスチャサンプリング
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      // RGB分離（グリッチ効果）
      vec4 color0Shift = vec4(
        texture2D(uTexture0, getCoverUV(distortedUV + vec2(uColorShift * glitchStrength, 0.0), uImageSize0, uResolution)).r,
        color0.g,
        texture2D(uTexture0, getCoverUV(distortedUV - vec2(uColorShift * glitchStrength, 0.0), uImageSize0, uResolution)).b,
        color0.a
      );
      
      vec4 color1Shift = vec4(
        texture2D(uTexture1, getCoverUV(distortedUV + vec2(uColorShift * glitchStrength, 0.0), uImageSize1, uResolution)).r,
        color1.g,
        texture2D(uTexture1, getCoverUV(distortedUV - vec2(uColorShift * glitchStrength, 0.0), uImageSize1, uResolution)).b,
        color1.a
      );
      
      // カラーミックス
      float mixFactor = smoothstep(0.3, 0.7, uProgress);
      vec4 finalColor = mix(color0Shift, color1Shift, mixFactor);
      
      // デジタルノイズ
      float digitalNoise = random(uv + vec2(uTime * 100.0)) * glitchStrength * 0.1;
      finalColor.rgb += vec3(digitalNoise);
      
      // カラー反転（ランダム）
      float invertChance = step(0.95, random(vec2(uTime * 30.0))) * glitchStrength;
      finalColor.rgb = mix(finalColor.rgb, 1.0 - finalColor.rgb, invertChance);
      
      // スキャンライン
      float scanline = sin(uv.y * 800.0) * 0.04 * glitchStrength;
      finalColor.rgb -= scanline;
      
      gl_FragColor = finalColor;
    }
  `);
        this.intensity = options.intensity ?? 0.5;
        this.sliceCount = options.sliceCount ?? 15.0;
        this.colorShift = options.colorShift ?? 0.03;
        this.noiseAmount = options.noiseAmount ?? 0.1;
        this.startTime = Date.now();
    }
    getUniforms(progress) {
        const time = (Date.now() - this.startTime) / 1000;
        return {
            uProgress: progress,
            uIntensity: this.intensity,
            uSliceCount: this.sliceCount,
            uColorShift: this.colorShift,
            uNoiseAmount: this.noiseAmount,
            uTime: time,
        };
    }
}

/**
 * Custom effect that allows loading external shaders
 */
class CustomEffect extends BaseEffect {
    constructor(options) {
        super();
        this.name = options.name;
        this.vertexShader = options.vertexShader;
        this.fragmentShader = options.fragmentShader;
        this.uniformsGetter = options.uniforms;
        this._requiresWebGL2 = options.requiresWebGL2 ?? false;
        this._requiresCustomMesh = options.requiresCustomMesh ?? false;
        this._getMesh = options.getMesh;
        this._getInstanceData = options.getInstanceData;
        this._getTransformFeedbackVaryings = options.getTransformFeedbackVaryings;
    }
    getUniforms(progress) {
        const baseUniforms = {
            uProgress: progress,
        };
        if (this.uniformsGetter) {
            return { ...baseUniforms, ...this.uniformsGetter() };
        }
        return baseUniforms;
    }
    get requiresWebGL2() {
        return this._requiresWebGL2;
    }
    get requiresCustomMesh() {
        return this._requiresCustomMesh;
    }
    getMesh() {
        if (this._getMesh) {
            const mesh = this._getMesh();
            return {
                positions: mesh.positions,
                indices: mesh.indices,
                texCoords: new Float32Array(0), // Default empty
                normals: new Float32Array(0), // Default empty
                triangles: [],
            };
        }
        throw new Error('getMesh() not implemented for this custom effect');
    }
    getInstanceData() {
        if (this._getInstanceData) {
            const data = this._getInstanceData();
            if (data) {
                // Convert Float32Array to the expected format
                return {
                    positions: data,
                    offsets: new Float32Array(0),
                    scales: new Float32Array(0),
                };
            }
        }
        // Return empty data instead of null to match BaseEffect
        return {
            positions: new Float32Array(0),
            offsets: new Float32Array(0),
            scales: new Float32Array(0),
        };
    }
    getTransformFeedbackVaryings() {
        if (this._getTransformFeedbackVaryings) {
            return this._getTransformFeedbackVaryings();
        }
        return [];
    }
}
/**
 * Helper function to create a custom effect from external shader files
 */
async function createCustomEffectFromFiles(name, vertexShaderUrl, fragmentShaderUrl, options) {
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch(vertexShaderUrl).then((r) => r.text()),
        fetch(fragmentShaderUrl).then((r) => r.text()),
    ]);
    return new CustomEffect({
        name,
        vertexShader,
        fragmentShader,
        ...options,
    });
}
/**
 * Helper function to create a custom effect from shader strings
 */
function createCustomEffect(name, vertexShader, fragmentShader, options) {
    // Use default vertex shader if not provided
    const defaultVertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;
    return new CustomEffect({
        name,
        vertexShader: vertexShader || defaultVertexShader,
        fragmentShader,
        ...options,
    });
}

// Re-export all effects
// Create and export singleton instances
const fadeEffect = new FadeEffect();
const slideLeftEffect = new SlideEffect('left');
const slideRightEffect = new SlideEffect('right');
const slideUpEffect = new SlideEffect('up');
const slideDownEffect = new SlideEffect('down');
const flipHorizontalEffect = new FlipEffect('horizontal');
const flipVerticalEffect = new FlipEffect('vertical');
const waveEffect = new WaveEffect();
const gentleWaveEffect = new WaveEffect({ amplitude: 0.05, frequency: 5.0, speed: 0.5 });
const intenseWaveEffect = new WaveEffect({ amplitude: 0.2, frequency: 15.0, speed: 2.0 });
const distortionEffect = new DistortionEffect();
const subtleDistortionEffect = new DistortionEffect({
    intensity: 0.3,
    radius: 0.6,
    spiral: 1.0,
});
const extremeDistortionEffect = new DistortionEffect({
    intensity: 1.0,
    radius: 1.0,
    spiral: 4.0,
});
const dissolveEffect = new DissolveEffect();
const smoothDissolveEffect = new DissolveEffect({
    scale: 5.0,
    threshold: 0.5,
    fadeWidth: 0.2,
});
const pixelDissolveEffect = new PixelDissolveEffect();
const largePixelDissolveEffect = new PixelDissolveEffect({
    pixelSize: 40.0,
    stagger: 0.2,
});
const smallPixelDissolveEffect = new PixelDissolveEffect({
    pixelSize: 10.0,
    stagger: 0.4,
});
const circleEffect = new CircleEffect();
const circleFromCenterEffect = new CircleEffect({
    centerX: 0.5,
    centerY: 0.5,
    feather: 0.05,
    scale: 1.2,
});
const circleFromCornerEffect = new CircleEffect({
    centerX: 0.0,
    centerY: 0.0,
    feather: 0.1,
    scale: 1.5,
});
const morphEffect = new MorphEffect();
const intenseMorphEffect = new MorphEffect({
    gridSize: 100.0,
    morphIntensity: 0.5,
    twistAmount: 4.0,
    waveFrequency: 5.0,
});
const glitchEffect = new GlitchEffect();
const intenseGlitchEffect = new GlitchEffect({
    intensity: 0.8,
    sliceCount: 25.0,
    colorShift: 0.05,
    noiseAmount: 0.2,
});
const subtleGlitchEffect = new GlitchEffect({
    intensity: 0.3,
    sliceCount: 10.0,
    colorShift: 0.02,
    noiseAmount: 0.05,
});
// Set unique names for effect variants
gentleWaveEffect.name = 'gentleWave';
intenseWaveEffect.name = 'intenseWave';
subtleDistortionEffect.name = 'subtleDistortion';
extremeDistortionEffect.name = 'extremeDistortion';
pixelDissolveEffect.name = 'pixelDissolve';
smoothDissolveEffect.name = 'smoothDissolve';
circleFromCenterEffect.name = 'circleFromCenter';
circleFromCornerEffect.name = 'circleFromCorner';
largePixelDissolveEffect.name = 'largePixelDissolve';
smallPixelDissolveEffect.name = 'smallPixelDissolve';
intenseMorphEffect.name = 'intenseMorph';
intenseGlitchEffect.name = 'intenseGlitch';
subtleGlitchEffect.name = 'subtleGlitch';
// Collection of all default effects
function getDefaultEffects() {
    return [
        fadeEffect,
        slideLeftEffect,
        slideRightEffect,
        slideUpEffect,
        slideDownEffect,
        flipHorizontalEffect,
        flipVerticalEffect,
        waveEffect,
        gentleWaveEffect,
        intenseWaveEffect,
        distortionEffect,
        subtleDistortionEffect,
        extremeDistortionEffect,
        dissolveEffect,
        pixelDissolveEffect,
        largePixelDissolveEffect,
        smallPixelDissolveEffect,
        smoothDissolveEffect,
        circleEffect,
        circleFromCenterEffect,
        circleFromCornerEffect,
        morphEffect,
        intenseMorphEffect,
        glitchEffect,
        intenseGlitchEffect,
        subtleGlitchEffect,
    ];
}
// Helper to register all default effects
function registerDefaultEffects(manager) {
    getDefaultEffects().forEach((effect) => manager.register(effect));
}

class CarouselCore extends EventEmitter {
    constructor(options) {
        super();
        this.renderer = null;
        this.loadedImages = new Map();
        this.textures = new Map();
        this.animationId = null;
        this.transitionStartTime = null;
        this.autoplayTimer = null;
        this.isWebGL = false;
        this.validImageIndices = []; // Track which image indices loaded successfully
        this.options = options;
        this.canvas = options.canvas;
        // Initialize components
        this.stateManager = new StateManager({
            images: options.images,
            currentIndex: 0,
            effect: options.effect || 'fade',
            autoplayInterval: options.autoplayInterval || 3000,
            transitionDuration: options.transitionDuration || 1000,
            loop: options.loop !== false,
            isPlaying: options.autoplay || false,
        });
        this.imageLoader = new ImageLoader({
            crossOrigin: 'anonymous', // Enable CORS for images
        });
        this.effectManager = new EffectManager();
        // Register default effects
        registerDefaultEffects(this.effectManager);
        // Setup state event listeners
        this.setupStateListeners();
        // Setup callbacks
        if (options.onTransitionStart) {
            this.on('transitionStart', options.onTransitionStart);
        }
        if (options.onTransitionEnd) {
            this.on('transitionEnd', options.onTransitionEnd);
        }
    }
    async initialize() {
        try {
            // Initialize renderer
            if (!this.initializeRenderer()) {
                throw new Error('Failed to initialize renderer');
            }
            // Preload images
            await this.preloadImages();
            // Start autoplay if enabled
            if (this.stateManager.get('isPlaying')) {
                this.startAutoplay();
            }
            this.emit('ready');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    initializeRenderer() {
        // Try WebGL 2.0 first (it's backwards compatible and supports more features)
        if (this.options.fallbackToCanvas !== false) {
            const webgl2Renderer = new WebGL2Renderer();
            if (webgl2Renderer.initialize(this.canvas)) {
                this.renderer = webgl2Renderer;
                this.isWebGL = true;
                // Setup WebGL 2.0 event listeners
                webgl2Renderer.on('error', (error) => this.emit('error', error));
                webgl2Renderer.on('contextLost', () => this.handleContextLost());
                webgl2Renderer.on('contextRestored', () => this.handleContextRestored());
                return true;
            }
            webgl2Renderer.dispose();
        }
        // Try WebGL 1.0 if WebGL 2.0 is not available
        if (this.options.fallbackToCanvas !== false) {
            const webglRenderer = new WebGLRenderer();
            if (webglRenderer.initialize(this.canvas)) {
                this.renderer = webglRenderer;
                this.isWebGL = true;
                // Setup WebGL event listeners
                webglRenderer.on('error', (error) => this.emit('error', error));
                webglRenderer.on('contextLost', () => this.handleContextLost());
                webglRenderer.on('contextRestored', () => this.handleContextRestored());
                return true;
            }
            webglRenderer.dispose();
        }
        // Fallback to Canvas2D
        const canvas2DFallback = new Canvas2DFallback();
        if (canvas2DFallback.initialize(this.canvas)) {
            this.renderer = canvas2DFallback;
            this.isWebGL = false;
            return true;
        }
        return false;
    }
    setupStateListeners() {
        this.stateManager.on('transitionStart', (from, to) => {
            this.emit('transitionStart', from, to);
            this.startTransition(from, to);
        });
        this.stateManager.on('transitionEnd', (index) => {
            this.emit('transitionEnd', index);
        });
        this.stateManager.on('playStateChange', (isPlaying) => {
            if (isPlaying) {
                this.emit('play');
                this.startAutoplay();
            }
            else {
                this.emit('pause');
                this.stopAutoplay();
            }
        });
        this.stateManager.on('indexChange', (oldIndex, newIndex) => {
            this.emit('imageChange', newIndex);
        });
    }
    async preloadImages() {
        const images = this.stateManager.get('images');
        const loadedImages = await this.imageLoader.preloadWithProgress(images, (loaded, _total) => {
            if (loaded === 1 && this.loadedImages.size === 0) {
                // First image loaded, can start rendering
                const startIndex = this.stateManager.get('currentIndex');
                const imageUrl = images[startIndex];
                if (imageUrl) {
                    const initialImage = this.imageLoader.getFromCache(imageUrl);
                    if (initialImage) {
                        this.loadedImages.set(imageUrl, initialImage);
                        this.emit('imageLoaded', startIndex, initialImage);
                        this.prepareInitialRender(initialImage, startIndex);
                    }
                }
            }
        });
        // Store all loaded images
        loadedImages.forEach((image, index) => {
            this.loadedImages.set(images[index], image);
            this.emit('imageLoaded', index, image);
            // Create WebGL texture if using WebGL
            if (this.isWebGL &&
                (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)) {
                const texture = this.renderer.loadTexture(image.element);
                if (texture) {
                    this.textures.set(images[index], texture);
                }
            }
        });
        this.emit('allImagesLoaded', loadedImages);
    }
    prepareInitialRender(image, imageIndex) {
        if (this.isWebGL &&
            (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)) {
            const images = this.stateManager.get('images');
            const index = imageIndex ?? this.stateManager.get('currentIndex');
            const imageSrc = images[index];
            // Ensure the renderer has the image element to get size info
            // Load texture (this will also cache the image size)
            let texture = this.renderer.loadTexture(image.element);
            if (texture) {
                this.textures.set(imageSrc, texture);
            }
            if (texture) {
                // Get current effect and its uniforms
                const effectName = this.stateManager.get('effect');
                const effect = this.effectManager.get(effectName);
                const uniforms = effect ? effect.getUniforms(0) : {};
                // Set the effect to renderer before initial render
                if (effect) {
                    this.renderer.setEffect({
                        vertexShader: effect.vertexShader,
                        fragmentShader: effect.fragmentShader,
                    });
                }
                // For initial render, pass the same image as both textures
                this.renderer.render(texture, texture, 0, uniforms, imageSrc, imageSrc);
            }
        }
        else if (this.renderer instanceof Canvas2DFallback) {
            this.renderer.setImages(image.element, null);
            this.renderer.render(0);
        }
    }
    startTransition(from, to) {
        const images = this.stateManager.get('images');
        const fromImage = this.loadedImages.get(images[from]);
        const toImage = this.loadedImages.get(images[to]);
        if (!fromImage || !toImage) {
            // Images not loaded yet, skip transition
            this.stateManager.endTransition(to);
            return;
        }
        this.transitionStartTime = performance.now();
        if (this.isWebGL &&
            (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)) {
            const fromTexture = this.textures.get(images[from]);
            const toTexture = this.textures.get(images[to]);
            if (fromTexture && toTexture) {
                // Set effect if needed
                const effectName = this.stateManager.get('effect');
                let effect = this.effectManager.get(effectName);
                // If TrianglePeelV2, check if it's going to work
                if (effectName === 'trianglePeelV2' && effect) {
                    try {
                        // Check if effect requires custom mesh (WebGL 2.0)
                        if (this.renderer instanceof WebGL2Renderer && effect.requiresCustomMesh) {
                            const mesh = effect.getMesh?.();
                            if (!mesh || !mesh.positions || !mesh.indices) {
                                console.error('[CarouselCore.startTransition] TrianglePeelV2 mesh is invalid, falling back to fade');
                                effect = this.effectManager.get('fade');
                                this.stateManager.set('effect', 'fade');
                            }
                            else {
                                this.renderer.setMesh({
                                    vertices: mesh.positions,
                                    indices: mesh.indices,
                                    texCoords: mesh.texCoords,
                                    normals: mesh.normals,
                                    instanceData: effect.getInstanceData?.()?.positions || undefined,
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.error('[CarouselCore.startTransition] Error setting up TrianglePeelV2:', error);
                        effect = this.effectManager.get('fade');
                        this.stateManager.set('effect', 'fade');
                    }
                }
                if (effect) {
                    this.renderer.setEffect({
                        vertexShader: effect.vertexShader,
                        fragmentShader: effect.fragmentShader,
                    });
                }
                this.animateTransition(fromTexture, toTexture, to);
            }
            else {
                console.error('[CarouselCore.startTransition] Missing texture:', {
                    fromTexture: !!fromTexture,
                    toTexture: !!toTexture,
                });
            }
        }
        else if (this.renderer instanceof Canvas2DFallback) {
            this.renderer.setImages(fromImage.element, toImage.element);
            this.animateTransition(null, null, to);
        }
    }
    animateTransition(fromTexture, toTexture, toIndex) {
        const animate = () => {
            if (!this.transitionStartTime) {
                return;
            }
            const elapsed = performance.now() - this.transitionStartTime;
            const duration = this.stateManager.get('transitionDuration');
            const progress = Math.min(elapsed / duration, 1);
            try {
                if (this.isWebGL &&
                    (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer) &&
                    fromTexture &&
                    toTexture) {
                    const effect = this.effectManager.get(this.stateManager.get('effect'));
                    const uniforms = effect ? effect.getUniforms(progress) : {};
                    const images = this.stateManager.get('images');
                    const currentIndex = this.stateManager.get('currentIndex');
                    const fromSrc = images[currentIndex];
                    const toSrc = images[toIndex];
                    if (this.renderer instanceof WebGL2Renderer && effect?.getInstanceData) {
                        const instanceData = effect.getInstanceData();
                        const instanceCount = instanceData?.positions
                            ? instanceData.positions.length / 12
                            : undefined;
                        // Only use instanced rendering if we actually have instance data
                        if (instanceCount && instanceCount > 0) {
                            this.renderer.render(fromTexture, toTexture, progress, uniforms, fromSrc, toSrc, instanceCount);
                        }
                        else {
                            this.renderer.render(fromTexture, toTexture, progress, uniforms, fromSrc, toSrc);
                        }
                    }
                    else {
                        this.renderer.render(fromTexture, toTexture, progress, uniforms, fromSrc, toSrc);
                    }
                }
                else if (this.renderer instanceof Canvas2DFallback) {
                    this.renderer.render(progress);
                }
            }
            catch (error) {
                console.error('[CarouselCore.animate] Error during render:', error);
                // End transition on error
                this.animationId = null;
                this.transitionStartTime = null;
                this.stateManager.endTransition(toIndex);
                return;
            }
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            }
            else {
                this.animationId = null;
                this.transitionStartTime = null;
                this.stateManager.endTransition(toIndex);
                // Schedule next transition if autoplay
                if (this.stateManager.get('isPlaying')) {
                    this.scheduleNextTransition();
                }
            }
        };
        animate();
    }
    handleContextLost() {
        // Cancel any ongoing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Clear textures
        this.textures.clear();
    }
    handleContextRestored() {
        // Recreate textures
        if (this.isWebGL &&
            (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)) {
            for (const [url, image] of this.loadedImages) {
                const texture = this.renderer.loadTexture(image.element);
                if (texture) {
                    this.textures.set(url, texture);
                }
            }
        }
        // Redraw current image
        const currentIndex = this.stateManager.get('currentIndex');
        const images = this.stateManager.get('images');
        const currentImage = this.loadedImages.get(images[currentIndex]);
        if (currentImage) {
            this.prepareInitialRender(currentImage);
        }
    }
    startAutoplay() {
        this.stopAutoplay();
        this.scheduleNextTransition();
    }
    stopAutoplay() {
        if (this.autoplayTimer) {
            clearTimeout(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }
    scheduleNextTransition() {
        if (!this.stateManager.get('isPlaying'))
            return;
        // Clear any existing timer to prevent duplicates
        this.stopAutoplay();
        const interval = this.stateManager.get('autoplayInterval');
        this.autoplayTimer = setTimeout(() => {
            if (this.stateManager.get('isPlaying') && !this.stateManager.get('isTransitioning')) {
                this.next();
            }
        }, interval);
    }
    // Public API
    next() {
        if (!this.stateManager.get('isTransitioning') && this.stateManager.canGoNext()) {
            const nextIndex = this.stateManager.getNextIndex();
            this.stateManager.startTransition(nextIndex);
        }
    }
    previous() {
        if (!this.stateManager.get('isTransitioning') && this.stateManager.canGoPrevious()) {
            const prevIndex = this.stateManager.getPreviousIndex();
            this.stateManager.startTransition(prevIndex);
        }
    }
    goTo(index) {
        const images = this.stateManager.get('images');
        if (index >= 0 &&
            index < images.length &&
            index !== this.stateManager.get('currentIndex') &&
            !this.stateManager.get('isTransitioning')) {
            this.stateManager.startTransition(index);
        }
    }
    play() {
        this.stateManager.set('isPlaying', true);
    }
    pause() {
        this.stateManager.set('isPlaying', false);
    }
    setAutoplay(enabled, interval) {
        if (interval !== undefined) {
            this.stateManager.set('autoplayInterval', interval);
        }
        this.stateManager.set('isPlaying', enabled);
    }
    setTransitionDuration(duration) {
        this.stateManager.set('transitionDuration', duration);
    }
    setEffect(effectName) {
        if (this.effectManager.has(effectName)) {
            const effect = this.effectManager.get(effectName);
            // Check if effect requires WebGL 2.0
            if (effect && effect.requiresWebGL2) {
                if (!(this.renderer instanceof WebGL2Renderer)) {
                    console.warn(`Effect "${effectName}" requires WebGL 2.0, but current renderer is ${this.renderer?.constructor.name}. Falling back to fade effect.`);
                    // Fallback to fade effect
                    return this.setEffect('fade');
                }
            }
            this.stateManager.set('effect', effectName);
            // Update renderer with new effect
            if (this.isWebGL &&
                (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer) &&
                effect) {
                this.renderer.setEffect({
                    vertexShader: effect.vertexShader,
                    fragmentShader: effect.fragmentShader,
                });
                // Re-render current image with new effect
                const currentIndex = this.stateManager.get('currentIndex');
                const images = this.stateManager.get('images');
                const currentImageSrc = images[currentIndex];
                if (currentImageSrc) {
                    const texture = this.textures.get(currentImageSrc);
                    if (texture) {
                        this.renderer.render(texture, null, 0, effect.getUniforms(0), currentImageSrc);
                    }
                }
            }
            return true;
        }
        return false;
    }
    registerEffect(effect) {
        this.effectManager.register(effect);
    }
    getCurrentIndex() {
        return this.stateManager.get('currentIndex');
    }
    getImages() {
        const urls = this.stateManager.get('images');
        return urls
            .map((url) => this.loadedImages.get(url))
            .filter((img) => img !== undefined);
    }
    resize(width, height) {
        if (!this.renderer)
            return;
        // Use provided dimensions or get from canvas
        const actualWidth = width ?? this.canvas.width;
        const actualHeight = height ?? this.canvas.height;
        this.renderer.resize(actualWidth, actualHeight);
        // Redraw current state
        const currentIndex = this.stateManager.get('currentIndex');
        const images = this.stateManager.get('images');
        const currentImageSrc = images[currentIndex];
        if (!currentImageSrc)
            return;
        const currentImage = this.loadedImages.get(currentImageSrc);
        if (!currentImage)
            return;
        // If transitioning, let the animation loop handle it
        if (this.stateManager.get('isTransitioning')) {
            return;
        }
        // Redraw the current image
        if (this.isWebGL &&
            (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)) {
            const texture = this.textures.get(currentImageSrc);
            if (texture) {
                // Get current effect and its uniforms
                const effectName = this.stateManager.get('effect');
                const effect = this.effectManager.get(effectName);
                const uniforms = effect ? effect.getUniforms(0) : {};
                this.renderer.render(texture, null, 0, uniforms, currentImageSrc);
            }
        }
        else if (this.renderer instanceof Canvas2DFallback) {
            this.renderer.setImages(currentImage.element, null);
            this.renderer.render(0);
        }
    }
    dispose() {
        // Stop animations
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Stop autoplay
        this.stopAutoplay();
        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        // Clear caches
        this.imageLoader.clearCache();
        this.loadedImages.clear();
        this.textures.clear();
        // Remove all listeners
        this.removeAllListeners();
        this.stateManager.removeAllListeners();
    }
    isReady() {
        return this.renderer !== null && this.loadedImages.size > 0;
    }
    isUsingWebGL() {
        return this.isWebGL;
    }
}

class WebGLCarousel extends EventEmitter {
    constructor(options) {
        super();
        this.isInitialized = false;
        this.handleResize = () => {
            this.resizeCanvas();
            this.core.resize(this.canvas.width, this.canvas.height);
        };
        // Validate and set options
        this.options = this.validateOptions(options);
        this.images = this.options.images;
        // Get container element
        this.container = this.getContainer(this.options.container);
        // Create canvas
        this.canvas = this.createCanvas();
        // Initialize core
        this.core = this.createCore();
        // Initialize
        void this.initialize();
    }
    validateOptions(options) {
        if (!options.container) {
            throw new Error('Container is required');
        }
        if (!options.images || options.images.length === 0) {
            throw new Error('At least one image is required');
        }
        return {
            container: options.container,
            images: options.images,
            effect: options.effect || 'fade',
            effects: options.effects || [],
            autoplay: options.autoplay ?? false,
            autoplayInterval: options.autoplayInterval ?? 3000,
            navigation: options.navigation ?? true,
            pagination: options.pagination ?? true,
            loop: options.loop ?? true,
            preload: options.preload ?? true,
            fallbackToCanvas2D: options.fallbackToCanvas2D ?? true,
            transitionDuration: options.transitionDuration ?? 1000,
            startIndex: options.startIndex ?? 0,
            easing: options.easing || ((t) => t),
            onImageChange: options.onImageChange || (() => { }),
            onTransitionStart: options.onTransitionStart || (() => { }),
            onTransitionEnd: options.onTransitionEnd || (() => { }),
            onError: options.onError || (() => { }),
        };
    }
    getContainer(container) {
        if (typeof container === 'string') {
            const element = document.querySelector(container);
            if (!element) {
                throw new Error(`Container element not found: ${container}`);
            }
            return element;
        }
        return container;
    }
    createCanvas() {
        // Ensure container has position for absolute children
        const containerPosition = window.getComputedStyle(this.container).position;
        if (containerPosition === 'static') {
            this.container.style.position = 'relative';
        }
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        this.container.appendChild(canvas);
        return canvas;
    }
    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }
    createCore() {
        // Extract effect name if it's an IEffect object
        const effectName = typeof this.options.effect === 'string'
            ? this.options.effect
            : this.options.effect?.name || 'fade';
        return new CarouselCore({
            canvas: this.canvas,
            images: this.options.images,
            effect: effectName,
            autoplay: this.options.autoplay,
            autoplayInterval: this.options.autoplayInterval,
            transitionDuration: this.options.transitionDuration,
            loop: this.options.loop,
            fallbackToCanvas: this.options.fallbackToCanvas2D,
            // Remove callbacks here to avoid duplicate events
        });
    }
    async initialize() {
        try {
            // Resize canvas before initialization
            this.resizeCanvas();
            // Set up event listeners
            this.setupEventListeners();
            // Initialize core
            await this.core.initialize();
            // Set initial effect
            if (typeof this.options.effect === 'object') {
                // Register and use custom effect
                this.registerEffect(this.options.effect);
                this.setEffect(this.options.effect.name);
            }
            else {
                this.setEffect(this.options.effect);
            }
            // Register additional effects if provided
            if (this.options.effects) {
                this.options.effects.forEach((effect) => {
                    this.registerEffect(effect);
                });
            }
            // Set up autoplay
            if (this.options.autoplay) {
                this.core.setAutoplay(true, this.options.autoplayInterval);
            }
            // Set transition duration
            this.core.setTransitionDuration(this.options.transitionDuration);
            // Create UI controls
            if (this.options.navigation) {
                this.createNavigationControls();
            }
            if (this.options.pagination) {
                this.createPaginationControls();
                // Set initial active state
                this.updatePagination(this.options.startIndex || 0);
            }
            // Set initial canvas size
            this.resizeCanvas();
            // Handle window resize
            window.addEventListener('resize', this.handleResize);
            this.isInitialized = true;
            this.emit('ready');
        }
        catch (error) {
            this.handleError(error);
        }
    }
    setupEventListeners() {
        // Forward core events
        this.core.on('imageChange', (...args) => {
            const index = args[0];
            this.emit('imageChange', index);
            this.options.onImageChange?.(index);
            this.updatePagination(index);
        });
        this.core.on('transitionStart', (from, to) => {
            this.emit('transitionStart', from, to);
            this.options.onTransitionStart?.(from, to);
        });
        this.core.on('transitionEnd', (index) => {
            this.emit('transitionEnd', index);
            this.options.onTransitionEnd?.(index);
        });
        this.core.on('error', (error) => {
            this.handleError(error);
        });
        this.core.on('ready', () => { });
    }
    handleError(error) {
        this.emit('error', error);
        this.options.onError?.(error);
        console.error('WebGLCarousel error:', error);
    }
    createNavigationControls() {
        const prevButton = document.createElement('button');
        prevButton.className = 'webgl-carousel-prev';
        prevButton.innerHTML = '&lsaquo;';
        prevButton.setAttribute('aria-label', 'Previous image');
        prevButton.addEventListener('click', () => this.previous());
        const nextButton = document.createElement('button');
        nextButton.className = 'webgl-carousel-next';
        nextButton.innerHTML = '&rsaquo;';
        nextButton.setAttribute('aria-label', 'Next image');
        nextButton.addEventListener('click', () => this.next());
        this.container.appendChild(prevButton);
        this.container.appendChild(nextButton);
        // Add default styles
        this.addNavigationStyles();
    }
    createPaginationControls() {
        const pagination = document.createElement('div');
        pagination.className = 'webgl-carousel-pagination';
        const imageCount = this.options.images.length;
        for (let i = 0; i < imageCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'webgl-carousel-dot';
            dot.setAttribute('aria-label', `Go to image ${i + 1}`);
            dot.addEventListener('click', () => this.goTo(i));
            if (i === 0) {
                dot.classList.add('active');
            }
            pagination.appendChild(dot);
        }
        this.container.appendChild(pagination);
        // Add default styles
        this.addPaginationStyles();
    }
    updatePagination(index) {
        const dots = this.container.querySelectorAll('.webgl-carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    addNavigationStyles() {
        if (document.getElementById('webgl-carousel-nav-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'webgl-carousel-nav-styles';
        style.textContent = `
      .webgl-carousel-prev,
      .webgl-carousel-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 2rem;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 0.3s;
        z-index: 10;
      }
      
      .webgl-carousel-prev:hover,
      .webgl-carousel-next:hover {
        background: rgba(0, 0, 0, 0.7);
      }
      
      .webgl-carousel-prev {
        left: 1rem;
      }
      
      .webgl-carousel-next {
        right: 1rem;
      }
    `;
        document.head.appendChild(style);
    }
    addPaginationStyles() {
        if (document.getElementById('webgl-carousel-pagination-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'webgl-carousel-pagination-styles';
        style.textContent = `
      .webgl-carousel-pagination {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
        z-index: 10;
      }
      
      .webgl-carousel-dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        border: 2px solid white;
        background: transparent;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .webgl-carousel-dot:hover {
        background: rgba(255, 255, 255, 0.5);
      }
      
      .webgl-carousel-dot.active {
        background: white;
      }
    `;
        document.head.appendChild(style);
    }
    // Public API methods
    next() {
        if (!this.isInitialized)
            return;
        this.core.next();
    }
    previous() {
        if (!this.isInitialized)
            return;
        this.core.previous();
    }
    goTo(index) {
        if (!this.isInitialized)
            return;
        this.core.goTo(index);
    }
    setEffect(effectName) {
        if (!this.isInitialized)
            return;
        const success = this.core.setEffect(effectName);
        if (success) {
            this.emit('effectChange', effectName);
        }
    }
    getAvailableEffects() {
        // Return list of available effects
        return [
            'fade',
            'slideLeft',
            'slideRight',
            'slideUp',
            'slideDown',
            'flipHorizontal',
            'flipVertical',
            'wave',
            'distortion',
            'dissolve',
            'pixelDissolve',
            'circle',
            'morph',
            'glitch',
            'pageFlip',
        ];
    }
    registerEffect(effect) {
        if (!this.isInitialized)
            return;
        this.core.registerEffect(effect);
    }
    play() {
        if (!this.isInitialized)
            return;
        this.core.setAutoplay(true, this.options.autoplayInterval);
    }
    pause() {
        if (!this.isInitialized)
            return;
        this.core.setAutoplay(false);
    }
    setAutoplay(enabled, interval) {
        if (!this.isInitialized)
            return;
        this.core.setAutoplay(enabled, interval);
    }
    setTransitionDuration(duration) {
        if (!this.isInitialized)
            return;
        this.core.setTransitionDuration(duration);
    }
    getCurrentIndex() {
        return this.core.getCurrentIndex();
    }
    getImageCount() {
        // Return the actual number of successfully loaded images
        return this.images.length;
    }
    destroy() {
        if (!this.isInitialized)
            return;
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
        // Destroy core
        this.core.dispose();
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        // Remove controls
        const controls = this.container.querySelectorAll('.webgl-carousel-prev, .webgl-carousel-next, .webgl-carousel-pagination');
        controls.forEach((control) => control.remove());
        // Clear container styles if needed
        this.container.style.position = '';
        this.isInitialized = false;
        this.removeAllListeners();
    }
    isReady() {
        return this.isInitialized;
    }
    isUsingWebGL() {
        return this.core.isUsingWebGL();
    }
    updateImages(images) {
        if (!this.isInitialized)
            return;
        this.options.images = images;
        // Note: This would need to be implemented in CarouselCore
        // For now, this is a placeholder
    }
    getImages() {
        return this.options.images;
    }
}

const WebGLCarouselReact = forwardRef((props, ref) => {
    const { className, style, width = '100%', height = '400px', onReady, onImageChange, onTransitionStart, onTransitionEnd, onError, onEffectChange, ...carouselOptions } = props;
    const containerRef = useRef(null);
    const carouselRef = useRef(null);
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        next: () => carouselRef.current?.next(),
        previous: () => carouselRef.current?.previous(),
        goTo: (index) => carouselRef.current?.goTo(index),
        setEffect: (effectName) => carouselRef.current?.setEffect(effectName),
        getAvailableEffects: () => carouselRef.current?.getAvailableEffects() || [],
        registerEffect: (effect) => carouselRef.current?.registerEffect(effect),
        play: () => carouselRef.current?.play(),
        pause: () => carouselRef.current?.pause(),
        setTransitionDuration: (duration) => carouselRef.current?.setTransitionDuration(duration),
        getCurrentIndex: () => carouselRef.current?.getCurrentIndex() || 0,
        getImageCount: () => carouselRef.current?.getImageCount() || 0,
        isReady: () => carouselRef.current?.isReady() || false,
    }), []);
    useEffect(() => {
        if (!containerRef.current)
            return;
        // Create carousel instance
        const carousel = new WebGLCarousel({
            ...carouselOptions,
            container: containerRef.current,
            onImageChange: onImageChange,
            onTransitionStart: onTransitionStart,
            onTransitionEnd: onTransitionEnd,
            onError: onError,
        });
        carouselRef.current = carousel;
        // Set up event listeners
        if (onReady) {
            carousel.on('ready', onReady);
        }
        if (onImageChange) {
            carousel.on('imageChange', onImageChange);
        }
        if (onTransitionStart) {
            carousel.on('transitionStart', onTransitionStart);
        }
        if (onTransitionEnd) {
            carousel.on('transitionEnd', onTransitionEnd);
        }
        if (onError) {
            carousel.on('error', onError);
        }
        if (onEffectChange) {
            carousel.on('effectChange', onEffectChange);
        }
        // Cleanup
        return () => {
            carousel.destroy();
            carouselRef.current = null;
        };
    }, []); // Only run once on mount
    // Handle prop changes that require carousel updates
    useEffect(() => {
        if (!carouselRef.current || !carouselRef.current.isReady())
            return;
        if (carouselOptions.effect) {
            if (typeof carouselOptions.effect === 'object') {
                // Register and use custom effect
                carouselRef.current.registerEffect(carouselOptions.effect);
                carouselRef.current.setEffect(carouselOptions.effect.name);
            }
            else {
                carouselRef.current.setEffect(carouselOptions.effect);
            }
        }
    }, [carouselOptions.effect]);
    useEffect(() => {
        if (!carouselRef.current || !carouselRef.current.isReady())
            return;
        if (carouselOptions.autoplay !== undefined) {
            if (carouselOptions.autoplay) {
                carouselRef.current.play();
            }
            else {
                carouselRef.current.pause();
            }
        }
    }, [carouselOptions.autoplay]);
    useEffect(() => {
        if (!carouselRef.current || !carouselRef.current.isReady())
            return;
        if (carouselOptions.transitionDuration !== undefined) {
            carouselRef.current.setTransitionDuration(carouselOptions.transitionDuration);
        }
    }, [carouselOptions.transitionDuration]);
    const containerStyle = {
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style,
    };
    return (React.createElement("div", { ref: containerRef, className: className, style: containerStyle, role: "region", "aria-label": "Image carousel" }));
});
WebGLCarouselReact.displayName = 'WebGLCarouselReact';

const WebGLCarouselVue = defineComponent({
    name: 'WebGLCarouselVue',
    props: {
        images: {
            type: Array,
            required: true,
        },
        autoplay: {
            type: Boolean,
            default: false,
        },
        interval: {
            type: Number,
            default: 3000,
        },
        transitionDuration: {
            type: Number,
            default: 1000,
        },
        effect: {
            type: [String, Object],
            default: 'fade',
        },
        effects: {
            type: Array,
            default: undefined,
        },
        showControls: {
            type: Boolean,
            default: true,
        },
        enableTouch: {
            type: Boolean,
            default: true,
        },
        startIndex: {
            type: Number,
            default: 0,
        },
        fallbackRenderer: {
            type: String,
            default: 'canvas2d',
        },
        webglOptions: {
            type: Object,
            default: undefined,
        },
        easing: {
            type: Function,
            default: undefined,
        },
        onTransitionStart: {
            type: Function,
            default: undefined,
        },
        onTransitionEnd: {
            type: Function,
            default: undefined,
        },
        onError: {
            type: Function,
            default: undefined,
        },
        onWebGLContextLost: {
            type: Function,
            default: undefined,
        },
        onWebGLContextRestored: {
            type: Function,
            default: undefined,
        },
        onImageLoad: {
            type: Function,
            default: undefined,
        },
        onImageError: {
            type: Function,
            default: undefined,
        },
        onReady: {
            type: Function,
            default: undefined,
        },
    },
    setup(props, { expose }) {
        const containerRef = ref(null);
        let carousel = null;
        const initCarousel = () => {
            if (!containerRef.value || carousel)
                return;
            const options = {
                container: containerRef.value,
                images: props.images,
                autoplay: props.autoplay,
                autoplayInterval: props.interval,
                transitionDuration: props.transitionDuration,
                effect: typeof props.effect === 'string' ? props.effect : undefined,
                startIndex: props.startIndex,
            };
            // Add custom effects if provided
            if (props.effects) {
                options.effects = props.effects;
            }
            // Add custom effect object if provided
            if (typeof props.effect === 'object') {
                options.effects = [props.effect];
            }
            // Add easing function if provided
            if (props.easing) {
                options.easing = props.easing;
            }
            carousel = new WebGLCarousel(options);
            // Setup event listeners
            if (props.onTransitionStart) {
                carousel.on('transitionStart', (from, to) => {
                    props.onTransitionStart?.({ from, to });
                });
            }
            if (props.onTransitionEnd) {
                carousel.on('transitionEnd', (_index) => {
                    // Vue component expects different signature
                    props.onTransitionEnd?.({ from: 0, to: 0 });
                });
            }
            if (props.onError) {
                carousel.on('error', props.onError);
            }
            // These events are not part of WebGLCarousel's public API
            if (props.onReady) {
                carousel.on('ready', props.onReady);
            }
        };
        const destroyCarousel = () => {
            if (carousel) {
                carousel.destroy();
                carousel = null;
            }
        };
        // Watch for prop changes
        watch(() => props.images, (newImages) => {
            if (carousel) {
                carousel.updateImages(newImages);
            }
        });
        watch(() => props.autoplay, (newAutoplay) => {
            if (carousel) {
                if (newAutoplay) {
                    carousel.play();
                }
                else {
                    carousel.pause();
                }
            }
        });
        watch(() => props.interval, (newInterval) => {
            if (carousel) {
                carousel.setAutoplay(props.autoplay, newInterval);
            }
        });
        watch(() => props.effect, (newEffect) => {
            if (carousel && typeof newEffect === 'string') {
                carousel.setEffect(newEffect);
            }
        });
        onMounted(() => {
            initCarousel();
        });
        onUnmounted(() => {
            destroyCarousel();
        });
        // Expose methods
        const next = () => {
            carousel?.next();
        };
        const previous = () => {
            carousel?.previous();
        };
        const goTo = (index) => {
            carousel?.goTo(index);
        };
        const getCurrentIndex = () => {
            return carousel?.getCurrentIndex() ?? 0;
        };
        const getTotalImages = () => {
            return carousel?.getImageCount() ?? 0;
        };
        const setEffect = (effect) => {
            if (carousel && typeof effect === 'string') {
                carousel.setEffect(effect);
            }
        };
        const getAvailableEffects = () => {
            return carousel?.getAvailableEffects() ?? [];
        };
        const registerEffect = (effect) => {
            // BaseEffect already implements IEffect
            carousel?.registerEffect(effect);
        };
        const play = () => {
            carousel?.play();
        };
        const pause = () => {
            carousel?.pause();
        };
        const isPlaying = () => {
            // WebGLCarousel doesn't have isPlaying method
            return false;
        };
        const setAutoplayInterval = (interval) => {
            carousel?.setAutoplay(true, interval);
        };
        const updateImages = (_images) => {
            // WebGLCarousel doesn't support updating images dynamically
        };
        const isTransitioning = () => {
            // WebGLCarousel doesn't have isTransitioning method
            return false;
        };
        expose({
            next,
            previous,
            goTo,
            getCurrentIndex,
            getTotalImages,
            setEffect,
            getAvailableEffects,
            registerEffect,
            play,
            pause,
            isPlaying,
            setAutoplayInterval,
            updateImages,
            isTransitioning,
        });
        return () => h('div', {
            ref: containerRef,
            class: 'webgl-carousel-container',
            style: {
                width: '100%',
                height: '100%',
                position: 'relative',
            },
        });
    },
});

// Main entry point for webgl-carousel
const VERSION = '0.1.0';

export { BaseEffect, Canvas2DFallback, CarouselCore, CircleEffect, CustomEffect, DissolveEffect, DistortionEffect, EffectManager, EventEmitter, FadeEffect, FlipEffect, ImageLoader, SlideEffect, StateManager, VERSION, WaveEffect, WebGLCarousel, WebGLCarouselReact, WebGLCarouselVue, WebGLRenderer, circleEffect, circleFromCenterEffect, circleFromCornerEffect, commonShaderFunctions, createCustomEffect, createCustomEffectFromFiles, createEffectManager, createFragmentShader, WebGLCarousel as default, dissolveEffect, distortionEffect, extremeDistortionEffect, fadeEffect, flipHorizontalEffect, flipVerticalEffect, gentleWaveEffect, getDefaultEffects, intenseWaveEffect, pixelDissolveEffect, registerDefaultEffects, slideDownEffect, slideLeftEffect, slideRightEffect, slideUpEffect, smoothDissolveEffect, subtleDistortionEffect, waveEffect };
//# sourceMappingURL=webgl-carousel.esm.js.map
