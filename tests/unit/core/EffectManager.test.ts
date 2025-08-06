import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { EffectManager, IEffect, createEffectManager } from '../../../src/core/EffectManager';

// Mock effect implementation
class MockEffect implements IEffect {
  constructor(
    public readonly name: string,
    public readonly vertexShader: string = 'vertex',
    public readonly fragmentShader: string = 'fragment',
  ) {}

  getUniforms(progress: number): Record<string, number | number[]> {
    return { uProgress: progress };
  }

  onBeforeRender?(gl: WebGLRenderingContext): void {
    // Optional hook
  }

  onAfterRender?(gl: WebGLRenderingContext): void {
    // Optional hook
  }
}

describe('EffectManager', () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
  });

  describe('register', () => {
    it('should register an effect', () => {
      const effect = new MockEffect('test');
      manager.register(effect);

      expect(manager.has('test')).toBe(true);
      expect(manager.get('test')).toBe(effect);
    });

    it('should throw error for effect without name', () => {
      const effect = { name: '', vertexShader: '', fragmentShader: '', getUniforms: () => ({}) };
      
      expect(() => manager.register(effect)).toThrow('Effect must have a name');
    });

    it('should warn when overwriting existing effect', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      const effect1 = new MockEffect('test');
      const effect2 = new MockEffect('test');
      
      manager.register(effect1);
      manager.register(effect2);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Effect "test" is already registered. Overwriting...'));
      expect(manager.get('test')).toBe(effect2);

      warnSpy.mockRestore();
    });
  });

  describe('unregister', () => {
    it('should unregister an effect', () => {
      const effect = new MockEffect('test');
      manager.register(effect);

      const result = manager.unregister('test');

      expect(result).toBe(true);
      expect(manager.has('test')).toBe(false);
    });

    it('should return false when unregistering non-existent effect', () => {
      const result = manager.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should get registered effect', () => {
      const effect = new MockEffect('test');
      manager.register(effect);

      expect(manager.get('test')).toBe(effect);
    });

    it('should return null for non-existent effect', () => {
      expect(manager.get('non-existent')).toBeNull();
    });
  });

  describe('has', () => {
    it('should check if effect exists', () => {
      const effect = new MockEffect('test');
      manager.register(effect);

      expect(manager.has('test')).toBe(true);
      expect(manager.has('non-existent')).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all registered effect names', () => {
      manager.register(new MockEffect('effect1'));
      manager.register(new MockEffect('effect2'));
      manager.register(new MockEffect('effect3'));

      const list = manager.list();

      expect(list).toHaveLength(3);
      expect(list).toContain('effect1');
      expect(list).toContain('effect2');
      expect(list).toContain('effect3');
    });

    it('should return empty array when no effects registered', () => {
      expect(manager.list()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all effects', () => {
      manager.register(new MockEffect('effect1'));
      manager.register(new MockEffect('effect2'));

      manager.clear();

      expect(manager.size()).toBe(0);
      expect(manager.list()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of registered effects', () => {
      expect(manager.size()).toBe(0);

      manager.register(new MockEffect('effect1'));
      expect(manager.size()).toBe(1);

      manager.register(new MockEffect('effect2'));
      expect(manager.size()).toBe(2);

      manager.unregister('effect1');
      expect(manager.size()).toBe(1);
    });
  });

  describe('default effect', () => {
    it('should have fade as default effect name', () => {
      expect(manager.getDefaultName()).toBe('fade');
    });

    it('should set and get default effect', () => {
      const fadeEffect = new MockEffect('fade');
      const slideEffect = new MockEffect('slide');

      manager.register(fadeEffect);
      manager.register(slideEffect);

      expect(manager.getDefault()).toBe(fadeEffect);

      manager.setDefault('slide');
      expect(manager.getDefaultName()).toBe('slide');
      expect(manager.getDefault()).toBe(slideEffect);
    });

    it('should throw error when setting non-existent effect as default', () => {
      expect(() => manager.setDefault('non-existent')).toThrow(
        'Effect "non-existent" is not registered',
      );
    });

    it('should return null if default effect is not registered', () => {
      // No fade effect registered
      expect(manager.getDefault()).toBeNull();
    });
  });
});

describe('createEffectManager', () => {
  it('should create manager with no effects', () => {
    const manager = createEffectManager();
    expect(manager.size()).toBe(0);
  });

  it('should create manager with pre-registered effects', () => {
    const effects = [
      new MockEffect('effect1'),
      new MockEffect('effect2'),
      new MockEffect('effect3'),
    ];

    const manager = createEffectManager(effects);

    expect(manager.size()).toBe(3);
    expect(manager.has('effect1')).toBe(true);
    expect(manager.has('effect2')).toBe(true);
    expect(manager.has('effect3')).toBe(true);
  });
});