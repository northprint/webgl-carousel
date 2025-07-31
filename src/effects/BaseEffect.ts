import { IEffect } from '../core/EffectManager';
import { TriangleMesh } from '../utils/MeshGenerator';

export abstract class BaseEffect implements IEffect {
  abstract readonly name: string;

  // Default vertex shader that can be overridden
  readonly vertexShader: string = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;

  abstract readonly fragmentShader: string;

  abstract getUniforms(progress: number): Record<string, number | number[] | Float32Array>;

  // Optional lifecycle hooks
  onBeforeRender?(gl: WebGLRenderingContext | WebGL2RenderingContext): void;
  onAfterRender?(gl: WebGLRenderingContext | WebGL2RenderingContext): void;

  // WebGL 2.0 support
  get requiresWebGL2(): boolean {
    return false;
  }

  // Custom mesh support
  get requiresCustomMesh(): boolean {
    return false;
  }

  getMesh?(): TriangleMesh {
    throw new Error('getMesh() must be implemented for effects that require custom meshes');
  }

  // Instance data for instanced rendering
  getInstanceData?(): { positions: Float32Array; offsets: Float32Array; scales: Float32Array } {
    return {
      positions: new Float32Array(0),
      offsets: new Float32Array(0),
      scales: new Float32Array(0),
    };
  }

  // Transform feedback varyings for WebGL 2.0
  getTransformFeedbackVaryings?(): string[] {
    return [];
  }
}
