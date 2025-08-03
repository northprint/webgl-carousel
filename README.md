# WebGL Carousel

[日本語](README.ja.md) | English

A high-performance image carousel library powered by WebGL with stunning visual effects.

[![npm version](https://img.shields.io/npm/v/webgl-carousel.svg)](https://www.npmjs.com/package/webgl-carousel)
[![License](https://img.shields.io/npm/l/webgl-carousel.svg)](https://github.com/northprint/webgl-carousel/blob/main/LICENSE)

## Features

- Hardware-accelerated rendering using WebGL/WebGL2
- 20+ built-in transition effects
- Framework adapters for React, Vue, and Svelte
- Custom shader support
- Responsive and touch-enabled
- Automatic fallback to Canvas 2D
- TypeScript support
- Lightweight with zero dependencies

## Installation

```bash
npm install webgl-carousel
```

## Quick Start

### Vanilla JavaScript

```javascript
import { WebGLCarousel } from 'webgl-carousel';

const carousel = new WebGLCarousel({
  container: '#carousel',
  images: [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ],
  effect: 'fade',
  autoplay: true,
  autoplayInterval: 3000
});
```

### React

```jsx
import { ReactCarousel } from 'webgl-carousel/react';

function App() {
  const images = [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ];

  return (
    <ReactCarousel
      images={images}
      effect="slide"
      autoplay
      transitionDuration={1500}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

### Vue

```vue
<template>
  <VueCarousel
    :images="images"
    effect="wave"
    :autoplay="true"
    :transition-duration="2000"
    style="width: 100%; height: 400px;"
  />
</template>

<script setup>
import { VueCarousel } from 'webgl-carousel/vue';

const images = [
  'path/to/image1.jpg',
  'path/to/image2.jpg',
  'path/to/image3.jpg'
];
</script>
```

### Svelte

```svelte
<script>
  import { SvelteCarousel } from 'webgl-carousel/svelte';
  
  const images = [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg'
  ];
</script>

<SvelteCarousel
  {images}
  effect="flip"
  autoplay={true}
  transitionDuration={1800}
  style="width: 100%; height: 400px;"
/>
```

## Available Effects

### Basic Effects

- `fade` - Fade transition
- `slideLeft` / `slideRight` - Horizontal slide
- `slideUp` / `slideDown` - Vertical slide

### 3D Effects

- `flipHorizontal` / `flipVertical` - 3D flip rotation

### Creative Effects

- `wave` / `gentleWave` / `intenseWave` - Wave distortion
- `distortion` / `subtleDistortion` / `extremeDistortion` - Lens distortion
- `dissolve` / `smoothDissolve` - Dissolve transition
- `pixelDissolve` - Pixelated dissolve
- `circle` / `circleFromCenter` / `circleFromCorner` - Circular reveal
- `morph` - Morphing transition
- `glitch` - Glitch effect

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string \| HTMLElement | - | Container element or selector |
| `images` | string[] | - | Array of image URLs |
| `effect` | string | 'fade' | Transition effect name |
| `autoplay` | boolean | false | Enable autoplay |
| `autoplayInterval` | number | 3000 | Autoplay interval (ms) |
| `transitionDuration` | number | 1000 | Transition duration (ms) |
| `navigation` | boolean | true | Show navigation arrows |
| `pagination` | boolean | true | Show pagination dots |
| `loop` | boolean | true | Enable infinite loop |
| `preload` | boolean | true | Preload all images |

### Methods

#### Navigation

- `next()` - Go to next image
- `previous()` - Go to previous image
- `goTo(index)` - Go to specific image

#### Effects

- `setEffect(effectName)` - Change transition effect
- `registerEffect(effect)` - Register custom effect
- `getAvailableEffects()` - Get list of available effects

#### Playback

- `play()` - Start autoplay
- `pause()` - Stop autoplay
- `setAutoplay(enabled, interval?)` - Configure autoplay

#### Status

- `getCurrentIndex()` - Get current image index
- `getImageCount()` - Get total image count
- `isReady()` - Check if carousel is ready

### Events

```javascript
carousel.on('ready', () => {
  console.log('Carousel is ready');
});

carousel.on('imageChange', (index) => {
  console.log('Current image:', index);
});

carousel.on('transitionStart', (from, to) => {
  console.log('Transition started:', from, '->', to);
});

carousel.on('transitionEnd', (index) => {
  console.log('Transition ended:', index);
});
```

## Custom Effects

Create your own transition effects using GLSL shaders:

```javascript
import { createCustomEffect } from 'webgl-carousel';

const myEffect = createCustomEffect(
  'myEffect',
  null, // Use default vertex shader
  `
    precision mediump float;
    
    uniform sampler2D uTexture0;
    uniform sampler2D uTexture1;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform vec2 uImageSize0;
    uniform vec2 uImageSize1;
    
    varying vec2 vTexCoord;
    
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
      
      // Your custom transition logic here
      vec4 color0 = texture2D(uTexture0, uv0);
      vec4 color1 = texture2D(uTexture1, uv1);
      
      gl_FragColor = mix(color0, color1, uProgress);
    }
  `
);

carousel.registerEffect(myEffect);
carousel.setEffect('myEffect');
```

## Browser Support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

The library automatically falls back to Canvas 2D rendering when WebGL is not available.

## Performance Considerations

1. **Image Optimization**: Use appropriately sized images for best performance
2. **Preloading**: Enable preloading for smooth transitions
3. **Hardware Acceleration**: The library automatically uses GPU acceleration when available
4. **Memory Management**: Images are automatically managed to optimize memory usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This library uses WebGL for hardware-accelerated rendering and provides fallback support for broader compatibility.
