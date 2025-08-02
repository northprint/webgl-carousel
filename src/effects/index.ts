// Re-export all effects
export { BaseEffect } from './BaseEffect';
export { createFragmentShader, commonShaderFunctions } from './shaderUtils';

// Effect classes
export { FadeEffect } from './fade';
export { SlideEffect, type SlideDirection } from './slide';
export { FlipEffect, type FlipAxis } from './flip';
export { WaveEffect, type WaveOptions } from './wave';
export { DistortionEffect, type DistortionOptions } from './distortion';
export { DissolveEffect, type DissolveOptions } from './dissolve';
export { CircleEffect, type CircleOptions } from './circle';
export { PixelDissolveEffect, type PixelDissolveOptions } from './pixelDissolve';
export { MorphEffect, type MorphOptions } from './morph';
export { GlitchEffect, type GlitchOptions } from './glitch';
export {
  CustomEffect,
  createCustomEffect,
  createCustomEffectFromFiles,
  type CustomEffectOptions,
} from './CustomEffect';

// Import classes for creating instances
import { FadeEffect } from './fade';
import { SlideEffect } from './slide';
import { FlipEffect } from './flip';
import { WaveEffect } from './wave';
import { DistortionEffect } from './distortion';
import { DissolveEffect } from './dissolve';
import { CircleEffect } from './circle';
import { PixelDissolveEffect } from './pixelDissolve';
import { MorphEffect } from './morph';
import { GlitchEffect } from './glitch';

// Create and export singleton instances
export const fadeEffect = new FadeEffect();
export const slideLeftEffect = new SlideEffect('left');
export const slideRightEffect = new SlideEffect('right');
export const slideUpEffect = new SlideEffect('up');
export const slideDownEffect = new SlideEffect('down');
export const flipHorizontalEffect = new FlipEffect('horizontal');
export const flipVerticalEffect = new FlipEffect('vertical');
export const waveEffect = new WaveEffect();
export const gentleWaveEffect = new WaveEffect({ amplitude: 0.05, frequency: 5.0, speed: 0.5 });
export const intenseWaveEffect = new WaveEffect({ amplitude: 0.2, frequency: 15.0, speed: 2.0 });
export const distortionEffect = new DistortionEffect();
export const subtleDistortionEffect = new DistortionEffect({
  intensity: 0.3,
  radius: 0.6,
  spiral: 1.0,
});
export const extremeDistortionEffect = new DistortionEffect({
  intensity: 1.0,
  radius: 1.0,
  spiral: 4.0,
});
export const dissolveEffect = new DissolveEffect();
export const smoothDissolveEffect = new DissolveEffect({
  scale: 5.0,
  threshold: 0.5,
  fadeWidth: 0.2,
});
export const pixelDissolveEffect = new PixelDissolveEffect();
export const largePixelDissolveEffect = new PixelDissolveEffect({
  pixelSize: 40.0,
  stagger: 0.2,
});
export const smallPixelDissolveEffect = new PixelDissolveEffect({
  pixelSize: 10.0,
  stagger: 0.4,
});
export const circleEffect = new CircleEffect();
export const circleFromCenterEffect = new CircleEffect({
  centerX: 0.5,
  centerY: 0.5,
  feather: 0.05,
  scale: 1.2,
});
export const circleFromCornerEffect = new CircleEffect({
  centerX: 0.0,
  centerY: 0.0,
  feather: 0.1,
  scale: 1.5,
});
export const morphEffect = new MorphEffect();
export const intenseMorphEffect = new MorphEffect({
  gridSize: 100.0,
  morphIntensity: 0.5,
  twistAmount: 4.0,
  waveFrequency: 5.0,
});
export const glitchEffect = new GlitchEffect();
export const intenseGlitchEffect = new GlitchEffect({
  intensity: 0.8,
  sliceCount: 25.0,
  colorShift: 0.05,
  noiseAmount: 0.2,
});
export const subtleGlitchEffect = new GlitchEffect({
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
export function getDefaultEffects() {
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

import type { EffectManager } from '../core/EffectManager';

// Helper to register all default effects
export function registerDefaultEffects(manager: EffectManager): void {
  getDefaultEffects().forEach((effect) => manager.register(effect));
}
