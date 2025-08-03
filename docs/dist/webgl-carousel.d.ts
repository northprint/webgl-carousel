import React from 'react';
import * as vue from 'vue';
import { PropType } from 'vue';

interface EventMap {
    [event: string]: unknown[];
}
declare class EventEmitter<T extends EventMap = EventMap> {
    private events;
    on<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this;
    off<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this;
    emit<K extends keyof T>(event: K, ...args: T[K]): this;
    once<K extends keyof T>(event: K, handler: (...args: T[K]) => void): this;
    removeAllListeners(event?: keyof T): this;
    listenerCount(event: keyof T): number;
}

interface IEffect {
    readonly name: string;
    readonly vertexShader: string;
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[] | Float32Array>;
    onBeforeRender?(gl: WebGLRenderingContext): void;
    onAfterRender?(gl: WebGLRenderingContext): void;
    readonly requiresWebGL2?: boolean;
    readonly requiresCustomMesh?: boolean;
    getMesh?(): {
        positions: Float32Array;
        indices: Uint16Array;
        texCoords: Float32Array;
        normals?: Float32Array;
    };
    getInstanceData?(): {
        positions: Float32Array;
        offsets: Float32Array;
        scales: Float32Array;
    };
}
declare class EffectManager {
    private effects;
    private defaultEffectName;
    register(effect: IEffect): void;
    unregister(name: string): boolean;
    get(name: string): IEffect | null;
    has(name: string): boolean;
    list(): string[];
    clear(): void;
    size(): number;
    setDefault(name: string): void;
    getDefault(): IEffect | null;
    getDefaultName(): string;
}
declare function createEffectManager(effects?: IEffect[]): EffectManager;

interface CarouselState$1 {
    currentIndex: number;
    images: string[];
    isTransitioning: boolean;
    autoplay: boolean;
    currentEffect: string;
}
interface LoadedImage$1 {
    url: string;
    element: HTMLImageElement;
    width: number;
    height: number;
}
interface TransitionState {
    from: number;
    to: number;
    progress: number;
    startTime: number;
    duration: number;
}
interface CarouselTransitionOptions {
    duration?: number;
    effect?: string;
    easing?: (t: number) => number;
}
interface WebGLCarouselOptions {
    container: string | HTMLElement;
    images: string[];
    effect?: string | IEffect;
    effects?: IEffect[];
    autoplay?: boolean;
    autoplayInterval?: number;
    navigation?: boolean;
    pagination?: boolean;
    loop?: boolean;
    preload?: boolean;
    fallbackToCanvas2D?: boolean;
    transitionDuration?: number;
    startIndex?: number;
    easing?: (t: number) => number;
    onImageChange?: (index: number) => void;
    onTransitionStart?: (from: number, to: number) => void;
    onTransitionEnd?: (index: number) => void;
    onError?: (error: Error) => void;
}
interface WebGLCarouselEvents extends Record<string, unknown[]> {
    ready: [];
    imageChange: [index: number];
    transitionStart: [from: number, to: number];
    transitionEnd: [index: number];
    error: [error: Error];
    effectChange: [effectName: string];
}

declare class WebGLCarousel extends EventEmitter<WebGLCarouselEvents> {
    private core;
    private container;
    private canvas;
    private options;
    private isInitialized;
    private images;
    constructor(options: WebGLCarouselOptions);
    private validateOptions;
    private getContainer;
    private createCanvas;
    private resizeCanvas;
    private createCore;
    private initialize;
    private setupEventListeners;
    private handleError;
    private handleResize;
    private createNavigationControls;
    private createPaginationControls;
    private updatePagination;
    private addNavigationStyles;
    private addPaginationStyles;
    next(): void;
    previous(): void;
    goTo(index: number): void;
    setEffect(effectName: string): void;
    getAvailableEffects(): string[];
    registerEffect(effect: IEffect): void;
    play(): void;
    pause(): void;
    setAutoplay(enabled: boolean, interval?: number): void;
    setTransitionDuration(duration: number): void;
    getCurrentIndex(): number;
    getImageCount(): number;
    destroy(): void;
    isReady(): boolean;
    isUsingWebGL(): boolean;
    updateImages(images: string[]): void;
    getImages(): string[];
}

interface CarouselState {
    currentIndex: number;
    images: string[];
    isPlaying: boolean;
    isTransitioning: boolean;
    effect: string;
    transitionDuration: number;
    autoplayInterval: number;
    loop: boolean;
}
interface StateEvents extends Record<string, unknown[]> {
    stateChange: [keyof CarouselState, unknown, unknown];
    indexChange: [number, number];
    playStateChange: [boolean];
    transitionStart: [number, number];
    transitionEnd: [number];
}
declare class StateManager extends EventEmitter<StateEvents> {
    private state;
    constructor(initialState?: Partial<CarouselState>);
    getState(): Readonly<CarouselState>;
    get<K extends keyof CarouselState>(key: K): CarouselState[K];
    set<K extends keyof CarouselState>(key: K, value: CarouselState[K]): void;
    update(updates: Partial<CarouselState>): void;
    canGoNext(): boolean;
    canGoPrevious(): boolean;
    getNextIndex(): number;
    getPreviousIndex(): number;
    startTransition(toIndex: number): void;
    endTransition(newIndex: number): void;
    reset(): void;
}

interface LoadedImage {
    url: string;
    element: HTMLImageElement;
    width: number;
    height: number;
    aspectRatio: number;
}
interface ImageLoaderOptions {
    crossOrigin?: string;
    timeout?: number;
}
declare class ImageLoader {
    private cache;
    private loadingPromises;
    private options;
    constructor(options?: ImageLoaderOptions);
    load(url: string): Promise<LoadedImage>;
    preload(urls: string[]): Promise<LoadedImage[]>;
    preloadWithProgress(urls: string[], onProgress?: (loaded: number, total: number) => void): Promise<LoadedImage[]>;
    getFromCache(url: string): LoadedImage | null;
    clearCache(url?: string): void;
    getCacheSize(): number;
    private loadImage;
}

interface WebGLRendererEvents extends Record<string, unknown[]> {
    contextLost: [];
    contextRestored: [];
    error: [Error];
}
declare abstract class BaseWebGLRenderer<TContext extends WebGLRenderingContext | WebGL2RenderingContext = WebGLRenderingContext> extends EventEmitter<WebGLRendererEvents> {
    protected canvas: HTMLCanvasElement | null;
    protected gl: TContext | null;
    protected program: WebGLProgram | null;
    protected textures: Map<string, WebGLTexture>;
    protected imageSizes: Map<string, {
        width: number;
        height: number;
    }>;
    protected uniforms: Map<string, WebGLUniformLocation>;
    protected attributes: Map<string, number>;
    abstract initialize(canvas: HTMLCanvasElement): boolean;
    abstract setEffect(effect: {
        vertexShader: string;
        fragmentShader: string;
    }): void;
    abstract render(currentTexture: WebGLTexture | null, nextTexture: WebGLTexture | null, progress: number, additionalUniforms?: Record<string, number | number[] | Float32Array>, currentImageSrc?: string, nextImageSrc?: string): void;
    abstract dispose(): void;
    loadTexture(image: HTMLImageElement): WebGLTexture | null;
    protected createTexture(image: HTMLImageElement): WebGLTexture | null;
    protected compileShader(source: string, type: number): WebGLShader | null;
    protected createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null;
    protected cacheUniformsAndAttributes(): void;
    resize(width: number, height: number): void;
    protected handleContextLost: (event: Event) => void;
    protected handleContextRestored: () => void;
    protected setImageSizeUniforms(currentImageSrc?: string, nextImageSrc?: string): void;
    protected disposeCommon(): void;
    isInitialized(): boolean;
    getContext(): TContext | null;
}

interface WebGLRendererOptions {
    antialias?: boolean;
    alpha?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
}
declare class WebGLRenderer extends BaseWebGLRenderer<WebGLRenderingContext> {
    private vertexBuffer;
    private options;
    constructor(options?: WebGLRendererOptions);
    initialize(canvas: HTMLCanvasElement): boolean;
    private setupEventListeners;
    private initializeVertexBuffer;
    private setDefaultEffect;
    setEffect(effect: {
        vertexShader: string;
        fragmentShader: string;
    }): void;
    render(currentTexture: WebGLTexture | null, nextTexture: WebGLTexture | null, progress: number, additionalUniforms?: Record<string, number | number[] | Float32Array>, currentImageSrc?: string, nextImageSrc?: string): void;
    dispose(): void;
}

interface Canvas2DFallbackOptions {
    transitionDuration?: number;
}
declare class Canvas2DFallback {
    private canvas;
    private ctx;
    private currentImage;
    private nextImage;
    private options;
    constructor(options?: Canvas2DFallbackOptions);
    initialize(canvas: HTMLCanvasElement): boolean;
    setImages(current: HTMLImageElement | null, next: HTMLImageElement | null): void;
    render(progress: number): void;
    private calculateDimensions;
    resize(width: number, height: number): void;
    dispose(): void;
    isInitialized(): boolean;
    getContext(): CanvasRenderingContext2D | null;
}

interface CarouselCoreOptions {
    canvas: HTMLCanvasElement;
    images: string[];
    effect?: string;
    autoplay?: boolean;
    autoplayInterval?: number;
    transitionDuration?: number;
    loop?: boolean;
    fallbackToCanvas?: boolean;
    onTransitionStart?: (from: number, to: number) => void;
    onTransitionEnd?: (current: number) => void;
}
interface CarouselCoreEvents extends Record<string, unknown[]> {
    ready: [];
    error: [Error];
    imageLoaded: [number, LoadedImage];
    allImagesLoaded: [LoadedImage[]];
    transitionStart: [number, number];
    transitionEnd: [number];
    play: [];
    pause: [];
}
declare class CarouselCore extends EventEmitter<CarouselCoreEvents> {
    private stateManager;
    private imageLoader;
    private renderer;
    private effectManager;
    private canvas;
    private options;
    private loadedImages;
    private textures;
    private animationId;
    private transitionStartTime;
    private autoplayTimer;
    private isWebGL;
    private validImageIndices;
    constructor(options: CarouselCoreOptions);
    initialize(): Promise<void>;
    private initializeRenderer;
    private setupStateListeners;
    private preloadImages;
    private prepareInitialRender;
    private startTransition;
    private animateTransition;
    private handleContextLost;
    private handleContextRestored;
    private startAutoplay;
    private stopAutoplay;
    private scheduleNextTransition;
    next(): void;
    previous(): void;
    goTo(index: number): void;
    play(): void;
    pause(): void;
    setAutoplay(enabled: boolean, interval?: number): void;
    setTransitionDuration(duration: number): void;
    setEffect(effectName: string): boolean;
    registerEffect(effect: IEffect): void;
    getCurrentIndex(): number;
    getImages(): LoadedImage[];
    resize(width?: number, height?: number): void;
    dispose(): void;
    isReady(): boolean;
    isUsingWebGL(): boolean;
}

interface Triangle {
    vertices: Float32Array;
    center: Float32Array;
    normal: Float32Array;
    index: number;
}
interface TriangleMesh {
    positions: Float32Array;
    texCoords: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
    triangles: Triangle[];
    instanceData?: Float32Array;
}

declare abstract class BaseEffect implements IEffect {
    abstract readonly name: string;
    readonly vertexShader: string;
    abstract readonly fragmentShader: string;
    abstract getUniforms(progress: number): Record<string, number | number[] | Float32Array>;
    onBeforeRender?(gl: WebGLRenderingContext | WebGL2RenderingContext): void;
    onAfterRender?(gl: WebGLRenderingContext | WebGL2RenderingContext): void;
    get requiresWebGL2(): boolean;
    get requiresCustomMesh(): boolean;
    getMesh?(): TriangleMesh;
    getInstanceData?(): {
        positions: Float32Array;
        offsets: Float32Array;
        scales: Float32Array;
    };
    getTransformFeedbackVaryings?(): string[];
}

declare const commonShaderFunctions = "\n  // Custom smooth step function for transitions\n  float customSmoothstep(float edge0, float edge1, float x) {\n    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);\n    return t * t * (3.0 - 2.0 * t);\n  }\n  \n  // Cubic easing function\n  float cubicInOut(float t) {\n    return t < 0.5\n      ? 4.0 * t * t * t\n      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;\n  }\n  \n  // Linear interpolation\n  vec4 mix4(vec4 a, vec4 b, float t) {\n    return a * (1.0 - t) + b * t;\n  }\n  \n  // 2D rotation matrix\n  mat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(c, -s, s, c);\n  }\n  \n  // Convert normalized coordinates to aspect-corrected coordinates\n  vec2 aspectCorrect(vec2 uv, vec2 resolution) {\n    float aspect = resolution.x / resolution.y;\n    return vec2(uv.x * aspect, uv.y);\n  }\n";
declare const createFragmentShader: (effectCode: string, includeCommon?: boolean) => string;

declare class FadeEffect extends BaseEffect {
    readonly name = "fade";
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

type SlideDirection = 'left' | 'right' | 'up' | 'down';
declare class SlideEffect extends BaseEffect {
    readonly name: string;
    private direction;
    constructor(direction?: SlideDirection);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

type FlipAxis = 'horizontal' | 'vertical';
declare class FlipEffect extends BaseEffect {
    readonly name: string;
    private axis;
    constructor(axis?: FlipAxis);
    readonly vertexShader = "\n    attribute vec2 aPosition;\n    attribute vec2 aTexCoord;\n    \n    uniform float uProgress;\n    uniform float uAxis;\n    \n    varying vec2 vTexCoord;\n    \n    void main() {\n      vTexCoord = aTexCoord;\n      \n      // \u56DE\u8EE2\u89D2\u5EA6\n      float angle = uProgress * 3.14159;\n      float scale = abs(cos(angle));\n      \n      vec2 position = aPosition;\n      \n      if (uAxis < 0.5) {\n        // Horizontal flip - X\u65B9\u5411\u306E\u307F\u7E2E\u5C0F\n        position.x *= scale;\n      } else {\n        // Vertical flip - Y\u65B9\u5411\u306E\u307F\u7E2E\u5C0F  \n        position.y *= scale;\n      }\n      \n      gl_Position = vec4(position, 0.0, 1.0);\n    }\n  ";
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface WaveOptions {
    amplitude?: number;
    frequency?: number;
    speed?: number;
}
declare class WaveEffect extends BaseEffect {
    name: string;
    private amplitude;
    private frequency;
    private speed;
    constructor(options?: WaveOptions);
    readonly fragmentShader: string;
    private startTime;
    getUniforms(progress: number): Record<string, number | number[]>;
    onBeforeRender(_gl: WebGLRenderingContext): void;
    private lastProgress?;
}

interface DistortionOptions {
    intensity?: number;
    radius?: number;
    spiral?: number;
}
declare class DistortionEffect extends BaseEffect {
    name: string;
    private intensity;
    private radius;
    private spiral;
    constructor(options?: DistortionOptions);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface DissolveOptions {
    scale?: number;
    threshold?: number;
    fadeWidth?: number;
}
declare class DissolveEffect extends BaseEffect {
    name: string;
    private scale;
    private threshold;
    private fadeWidth;
    constructor(options?: DissolveOptions);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface CircleOptions {
    centerX?: number;
    centerY?: number;
    feather?: number;
    scale?: number;
}
declare class CircleEffect extends BaseEffect {
    name: string;
    private centerX;
    private centerY;
    private feather;
    private scale;
    constructor(options?: CircleOptions);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface PixelDissolveOptions {
    pixelSize?: number;
    stagger?: number;
}
declare class PixelDissolveEffect extends BaseEffect {
    name: string;
    private pixelSize;
    private stagger;
    constructor(options?: PixelDissolveOptions);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface MorphOptions {
    gridSize?: number;
    morphIntensity?: number;
    twistAmount?: number;
    waveFrequency?: number;
}
declare class MorphEffect extends BaseEffect {
    name: string;
    private gridSize;
    private morphIntensity;
    private twistAmount;
    private waveFrequency;
    constructor(options?: MorphOptions);
    readonly vertexShader = "\n    attribute vec2 aPosition;\n    attribute vec2 aTexCoord;\n    \n    uniform float uProgress;\n    uniform float uMorphIntensity;\n    uniform float uTwistAmount;\n    uniform float uWaveFrequency;\n    uniform vec2 uResolution;\n    \n    varying vec2 vTexCoord;\n    varying float vMorphAmount;\n    \n    void main() {\n      vTexCoord = aTexCoord;\n      \n      // \u4E2D\u5FC3\u304B\u3089\u306E\u8DDD\u96E2\u3092\u8A08\u7B97\n      vec2 center = vec2(0.5, 0.5);\n      vec2 toCenter = aTexCoord - center;\n      float dist = length(toCenter);\n      \n      // \u30D7\u30ED\u30B0\u30EC\u30B9\u306B\u57FA\u3065\u304F\u30E2\u30FC\u30D5\u91CF\u3092\u8A08\u7B97\n      float morphProgress = smoothstep(0.0, 1.0, uProgress);\n      float morphAmount = sin(morphProgress * 3.14159);\n      vMorphAmount = morphAmount;\n      \n      // \u9802\u70B9\u306E\u5909\u4F4D\u3092\u8A08\u7B97\n      vec2 position = aPosition;\n      \n      // \u30C4\u30A4\u30B9\u30C8\u52B9\u679C\n      float angle = atan(toCenter.y, toCenter.x);\n      float twist = sin(angle * uWaveFrequency + morphProgress * uTwistAmount) * morphAmount;\n      position.x += twist * toCenter.y * uMorphIntensity;\n      position.y -= twist * toCenter.x * uMorphIntensity;\n      \n      // \u6CE2\u5F62\u52B9\u679C\n      float wave = sin(dist * 10.0 - morphProgress * 5.0) * morphAmount;\n      position += normalize(toCenter) * wave * uMorphIntensity * 0.5;\n      \n      // Z\u8EF8\u306E\u5909\u4F4D\uFF083D\u52B9\u679C\uFF09\n      float z = sin(dist * 8.0 + morphProgress * 4.0) * morphAmount * 0.3;\n      \n      gl_Position = vec4(position, z, 1.0);\n    }\n  ";
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface GlitchOptions {
    intensity?: number;
    sliceCount?: number;
    colorShift?: number;
    noiseAmount?: number;
}
declare class GlitchEffect extends BaseEffect {
    name: string;
    private intensity;
    private sliceCount;
    private colorShift;
    private noiseAmount;
    private startTime;
    constructor(options?: GlitchOptions);
    readonly fragmentShader: string;
    getUniforms(progress: number): Record<string, number | number[]>;
}

interface CustomEffectOptions {
    name: string;
    vertexShader: string;
    fragmentShader: string;
    uniforms?: () => Record<string, number | number[] | Float32Array>;
    requiresWebGL2?: boolean;
    requiresCustomMesh?: boolean;
    getMesh?: () => {
        positions: Float32Array;
        indices: Uint16Array;
    };
    getInstanceData?: () => Float32Array | null;
    getTransformFeedbackVaryings?: () => string[];
}
/**
 * Custom effect that allows loading external shaders
 */
declare class CustomEffect extends BaseEffect {
    name: string;
    vertexShader: string;
    fragmentShader: string;
    private uniformsGetter?;
    private _requiresWebGL2;
    private _requiresCustomMesh;
    private _getMesh?;
    private _getInstanceData?;
    private _getTransformFeedbackVaryings?;
    constructor(options: CustomEffectOptions);
    getUniforms(progress: number): Record<string, number | number[] | Float32Array>;
    get requiresWebGL2(): boolean;
    get requiresCustomMesh(): boolean;
    getMesh(): TriangleMesh;
    getInstanceData(): {
        positions: Float32Array;
        offsets: Float32Array;
        scales: Float32Array;
    };
    getTransformFeedbackVaryings(): string[];
}
/**
 * Helper function to create a custom effect from external shader files
 */
declare function createCustomEffectFromFiles(name: string, vertexShaderUrl: string, fragmentShaderUrl: string, options?: Partial<CustomEffectOptions>): Promise<CustomEffect>;
/**
 * Helper function to create a custom effect from shader strings
 */
declare function createCustomEffect(name: string, vertexShader: string | undefined, fragmentShader: string, options?: Partial<CustomEffectOptions>): CustomEffect;

declare const fadeEffect: FadeEffect;
declare const slideLeftEffect: SlideEffect;
declare const slideRightEffect: SlideEffect;
declare const slideUpEffect: SlideEffect;
declare const slideDownEffect: SlideEffect;
declare const flipHorizontalEffect: FlipEffect;
declare const flipVerticalEffect: FlipEffect;
declare const waveEffect: WaveEffect;
declare const gentleWaveEffect: WaveEffect;
declare const intenseWaveEffect: WaveEffect;
declare const distortionEffect: DistortionEffect;
declare const subtleDistortionEffect: DistortionEffect;
declare const extremeDistortionEffect: DistortionEffect;
declare const dissolveEffect: DissolveEffect;
declare const smoothDissolveEffect: DissolveEffect;
declare const pixelDissolveEffect: PixelDissolveEffect;
declare const circleEffect: CircleEffect;
declare const circleFromCenterEffect: CircleEffect;
declare const circleFromCornerEffect: CircleEffect;
declare function getDefaultEffects(): (FadeEffect | SlideEffect | FlipEffect | WaveEffect | DistortionEffect | DissolveEffect | PixelDissolveEffect | CircleEffect | MorphEffect | GlitchEffect)[];

declare function registerDefaultEffects(manager: EffectManager): void;

interface WebGLCarouselReactProps extends Omit<WebGLCarouselOptions, 'container'> {
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    onReady?: () => void;
    onImageChange?: (index: number) => void;
    onTransitionStart?: (from: number, to: number) => void;
    onTransitionEnd?: (index: number) => void;
    onError?: (error: Error) => void;
    onEffectChange?: (effectName: string) => void;
}
interface WebGLCarouselReactRef {
    next: () => void;
    previous: () => void;
    goTo: (index: number) => void;
    setEffect: (effectName: string) => void;
    getAvailableEffects: () => string[];
    registerEffect: (effect: IEffect) => void;
    play: () => void;
    pause: () => void;
    setTransitionDuration: (duration: number) => void;
    getCurrentIndex: () => number;
    getImageCount: () => number;
    isReady: () => boolean;
}
declare const WebGLCarouselReact: React.ForwardRefExoticComponent<WebGLCarouselReactProps & React.RefAttributes<WebGLCarouselReactRef>>;

interface WebGLCarouselVueProps {
    images: string[];
    autoplay?: boolean;
    interval?: number;
    transitionDuration?: number;
    effect?: string | BaseEffect;
    effects?: BaseEffect[];
    showControls?: boolean;
    enableTouch?: boolean;
    startIndex?: number;
    fallbackRenderer?: 'canvas2d' | null;
    webglOptions?: WebGLContextAttributes;
    easing?: (t: number) => number;
    onTransitionStart?: (event: {
        from: number;
        to: number;
    }) => void;
    onTransitionEnd?: (event: {
        from: number;
        to: number;
    }) => void;
    onError?: (error: Error) => void;
    onWebGLContextLost?: () => void;
    onWebGLContextRestored?: () => void;
    onImageLoad?: (event: {
        index: number;
        src: string;
    }) => void;
    onImageError?: (event: {
        index: number;
        src: string;
        error: Error;
    }) => void;
    onReady?: () => void;
}
declare const WebGLCarouselVue: vue.DefineComponent<vue.ExtractPropTypes<{
    images: {
        type: PropType<string[]>;
        required: true;
    };
    autoplay: {
        type: BooleanConstructor;
        default: boolean;
    };
    interval: {
        type: NumberConstructor;
        default: number;
    };
    transitionDuration: {
        type: NumberConstructor;
        default: number;
    };
    effect: {
        type: PropType<string | BaseEffect>;
        default: string;
    };
    effects: {
        type: PropType<BaseEffect[]>;
        default: undefined;
    };
    showControls: {
        type: BooleanConstructor;
        default: boolean;
    };
    enableTouch: {
        type: BooleanConstructor;
        default: boolean;
    };
    startIndex: {
        type: NumberConstructor;
        default: number;
    };
    fallbackRenderer: {
        type: PropType<"canvas2d" | null>;
        default: string;
    };
    webglOptions: {
        type: PropType<WebGLContextAttributes>;
        default: undefined;
    };
    easing: {
        type: PropType<(t: number) => number>;
        default: undefined;
    };
    onTransitionStart: {
        type: PropType<(event: {
            from: number;
            to: number;
        }) => void>;
        default: undefined;
    };
    onTransitionEnd: {
        type: PropType<(event: {
            from: number;
            to: number;
        }) => void>;
        default: undefined;
    };
    onError: {
        type: PropType<(error: Error) => void>;
        default: undefined;
    };
    onWebGLContextLost: {
        type: PropType<() => void>;
        default: undefined;
    };
    onWebGLContextRestored: {
        type: PropType<() => void>;
        default: undefined;
    };
    onImageLoad: {
        type: PropType<(event: {
            index: number;
            src: string;
        }) => void>;
        default: undefined;
    };
    onImageError: {
        type: PropType<(event: {
            index: number;
            src: string;
            error: Error;
        }) => void>;
        default: undefined;
    };
    onReady: {
        type: PropType<() => void>;
        default: undefined;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    images: {
        type: PropType<string[]>;
        required: true;
    };
    autoplay: {
        type: BooleanConstructor;
        default: boolean;
    };
    interval: {
        type: NumberConstructor;
        default: number;
    };
    transitionDuration: {
        type: NumberConstructor;
        default: number;
    };
    effect: {
        type: PropType<string | BaseEffect>;
        default: string;
    };
    effects: {
        type: PropType<BaseEffect[]>;
        default: undefined;
    };
    showControls: {
        type: BooleanConstructor;
        default: boolean;
    };
    enableTouch: {
        type: BooleanConstructor;
        default: boolean;
    };
    startIndex: {
        type: NumberConstructor;
        default: number;
    };
    fallbackRenderer: {
        type: PropType<"canvas2d" | null>;
        default: string;
    };
    webglOptions: {
        type: PropType<WebGLContextAttributes>;
        default: undefined;
    };
    easing: {
        type: PropType<(t: number) => number>;
        default: undefined;
    };
    onTransitionStart: {
        type: PropType<(event: {
            from: number;
            to: number;
        }) => void>;
        default: undefined;
    };
    onTransitionEnd: {
        type: PropType<(event: {
            from: number;
            to: number;
        }) => void>;
        default: undefined;
    };
    onError: {
        type: PropType<(error: Error) => void>;
        default: undefined;
    };
    onWebGLContextLost: {
        type: PropType<() => void>;
        default: undefined;
    };
    onWebGLContextRestored: {
        type: PropType<() => void>;
        default: undefined;
    };
    onImageLoad: {
        type: PropType<(event: {
            index: number;
            src: string;
        }) => void>;
        default: undefined;
    };
    onImageError: {
        type: PropType<(event: {
            index: number;
            src: string;
            error: Error;
        }) => void>;
        default: undefined;
    };
    onReady: {
        type: PropType<() => void>;
        default: undefined;
    };
}>> & Readonly<{}>, {
    autoplay: boolean;
    interval: number;
    transitionDuration: number;
    effect: string | BaseEffect;
    effects: BaseEffect[];
    showControls: boolean;
    enableTouch: boolean;
    startIndex: number;
    fallbackRenderer: "canvas2d" | null;
    webglOptions: WebGLContextAttributes;
    easing: (t: number) => number;
    onTransitionStart: (event: {
        from: number;
        to: number;
    }) => void;
    onTransitionEnd: (event: {
        from: number;
        to: number;
    }) => void;
    onError: (error: Error) => void;
    onWebGLContextLost: () => void;
    onWebGLContextRestored: () => void;
    onImageLoad: (event: {
        index: number;
        src: string;
    }) => void;
    onImageError: (event: {
        index: number;
        src: string;
        error: Error;
    }) => void;
    onReady: () => void;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;

declare const VERSION = "0.1.0";

export { BaseEffect, Canvas2DFallback, CarouselCore, CircleEffect, CustomEffect, DissolveEffect, DistortionEffect, EffectManager, EventEmitter, FadeEffect, FlipEffect, ImageLoader, SlideEffect, StateManager, VERSION, WaveEffect, WebGLCarousel, WebGLCarouselReact, WebGLCarouselVue, WebGLRenderer, circleEffect, circleFromCenterEffect, circleFromCornerEffect, commonShaderFunctions, createCustomEffect, createCustomEffectFromFiles, createEffectManager, createFragmentShader, WebGLCarousel as default, dissolveEffect, distortionEffect, extremeDistortionEffect, fadeEffect, flipHorizontalEffect, flipVerticalEffect, gentleWaveEffect, getDefaultEffects, intenseWaveEffect, pixelDissolveEffect, registerDefaultEffects, slideDownEffect, slideLeftEffect, slideRightEffect, slideUpEffect, smoothDissolveEffect, subtleDistortionEffect, waveEffect };
export type { CarouselState$1 as CarouselState, CarouselTransitionOptions, CustomEffectOptions, DistortionOptions, FlipAxis, IEffect, LoadedImage$1 as LoadedImage, SlideDirection, TransitionState, WaveOptions, WebGLCarouselEvents, WebGLCarouselOptions, WebGLCarouselReactProps, WebGLCarouselVueProps };
