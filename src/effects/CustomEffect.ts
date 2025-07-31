import { BaseEffect } from './BaseEffect';

export interface CustomEffectOptions {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms?: () => Record<string, number | number[] | Float32Array>;
  requiresWebGL2?: boolean;
  requiresCustomMesh?: boolean;
  getMesh?: () => { positions: Float32Array; indices: Uint16Array };
  getInstanceData?: () => Float32Array | null;
  getTransformFeedbackVaryings?: () => string[];
}

/**
 * Custom effect that allows loading external shaders
 */
export class CustomEffect extends BaseEffect {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  private uniformsGetter?: () => Record<string, number | number[] | Float32Array>;
  private _requiresWebGL2: boolean;
  private _requiresCustomMesh: boolean;
  private _getMesh?: () => { positions: Float32Array; indices: Uint16Array };
  private _getInstanceData?: () => Float32Array | null;
  private _getTransformFeedbackVaryings?: () => string[];

  constructor(options: CustomEffectOptions) {
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

  getUniforms(progress: number): Record<string, number | number[] | Float32Array> {
    const baseUniforms = {
      uProgress: progress,
    };
    
    if (this.uniformsGetter) {
      return { ...baseUniforms, ...this.uniformsGetter() };
    }
    
    return baseUniforms;
  }

  requiresWebGL2(): boolean {
    return this._requiresWebGL2;
  }

  requiresCustomMesh(): boolean {
    return this._requiresCustomMesh;
  }

  getMesh(): { positions: Float32Array; indices: Uint16Array } {
    if (this._getMesh) {
      return this._getMesh();
    }
    throw new Error('getMesh() not implemented for this custom effect');
  }

  getInstanceData(): Float32Array | null {
    if (this._getInstanceData) {
      return this._getInstanceData();
    }
    return null;
  }

  getTransformFeedbackVaryings(): string[] {
    if (this._getTransformFeedbackVaryings) {
      return this._getTransformFeedbackVaryings();
    }
    return [];
  }
}

/**
 * Helper function to create a custom effect from external shader files
 */
export async function createCustomEffectFromFiles(
  name: string,
  vertexShaderUrl: string,
  fragmentShaderUrl: string,
  options?: Partial<CustomEffectOptions>
): Promise<CustomEffect> {
  const [vertexShader, fragmentShader] = await Promise.all([
    fetch(vertexShaderUrl).then(r => r.text()),
    fetch(fragmentShaderUrl).then(r => r.text()),
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
export function createCustomEffect(
  name: string,
  vertexShader: string,
  fragmentShader: string,
  options?: Partial<CustomEffectOptions>
): CustomEffect {
  return new CustomEffect({
    name,
    vertexShader,
    fragmentShader,
    ...options,
  });
}