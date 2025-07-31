import { BaseEffect } from './BaseEffect';
import { TriangleMesh } from '../utils/MeshGenerator';

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

  get requiresWebGL2(): boolean {
    return this._requiresWebGL2;
  }

  get requiresCustomMesh(): boolean {
    return this._requiresCustomMesh;
  }

  getMesh(): TriangleMesh {
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

  getInstanceData(): { positions: Float32Array; offsets: Float32Array; scales: Float32Array } {
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
  options?: Partial<CustomEffectOptions>,
): Promise<CustomEffect> {
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
export function createCustomEffect(
  name: string,
  vertexShader: string,
  fragmentShader: string,
  options?: Partial<CustomEffectOptions>,
): CustomEffect {
  return new CustomEffect({
    name,
    vertexShader,
    fragmentShader,
    ...options,
  });
}
