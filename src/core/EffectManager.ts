export interface IEffect {
  readonly name: string;
  readonly vertexShader: string;
  readonly fragmentShader: string;

  getUniforms(progress: number): Record<string, number | number[]>;

  // Optional hooks
  onBeforeRender?(gl: WebGLRenderingContext): void;
  onAfterRender?(gl: WebGLRenderingContext): void;
}

export class EffectManager {
  private effects: Map<string, IEffect> = new Map();
  private defaultEffectName = 'fade';

  register(effect: IEffect): void {
    if (!effect.name) {
      throw new Error('Effect must have a name');
    }

    if (this.effects.has(effect.name)) {
      console.warn(`Effect "${effect.name}" is already registered. Overwriting...`);
    }

    this.effects.set(effect.name, effect);
  }

  unregister(name: string): boolean {
    return this.effects.delete(name);
  }

  get(name: string): IEffect | null {
    return this.effects.get(name) || null;
  }

  has(name: string): boolean {
    return this.effects.has(name);
  }

  list(): string[] {
    return Array.from(this.effects.keys());
  }

  clear(): void {
    this.effects.clear();
  }

  size(): number {
    return this.effects.size;
  }

  setDefault(name: string): void {
    if (!this.effects.has(name)) {
      throw new Error(`Effect "${name}" is not registered`);
    }
    this.defaultEffectName = name;
  }

  getDefault(): IEffect | null {
    return this.get(this.defaultEffectName);
  }

  getDefaultName(): string {
    return this.defaultEffectName;
  }
}

// Factory function for creating effect managers with pre-registered effects
export function createEffectManager(effects?: IEffect[]): EffectManager {
  const manager = new EffectManager();

  if (effects) {
    effects.forEach((effect) => manager.register(effect));
  }

  return manager;
}
