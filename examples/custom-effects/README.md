# Custom Effects Example

This example demonstrates how to create and use custom shader effects with WebGL Carousel.

## Features Demonstrated

- Creating custom GLSL fragment shaders
- Registering custom effects
- Using shader uniforms
- Aspect ratio handling with getCoverUV
- Multiple custom effects in one application

## Running the Example

1. Open `index.html` in your browser
2. Or use a local server:
   ```bash
   npx serve .
   ```

## Custom Effects Included

1. **Ripple Effect** - Circular ripple transition
2. **Blur Transition** - Gaussian blur effect
3. **Glitch Effect** - Digital glitch transition
4. **Mosaic Effect** - Pixelated transition

## Key Concepts

- Writing GLSL shaders
- Using texture samplers
- Progress-based animations
- Image aspect ratio preservation