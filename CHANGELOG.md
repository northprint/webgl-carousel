# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2024-07-31

### Added
- Custom shader demo in documentation page
- Shader editor with live preview functionality
- Sample ripple effect for custom shaders
- Image loading improvements with better error handling

### Fixed
- Fixed flip effects (flipHorizontal/flipVertical) not showing next image
- Fixed shader compilation errors with uProgress redefinition
- Fixed image loading issues with CORS
- Fixed E2E test timeout issues in GitHub Actions
- Fixed TypeScript strict mode errors with noUncheckedIndexedAccess

### Changed
- Replaced demo iframe with direct link to improve page performance
- Updated all GitHub repository links to correct URL
- Reduced E2E tests to chromium only for faster CI
- Improved demo page UI with modern dark theme

### Removed
- Removed PageFlip effect completely from the library

## [0.1.0] - 2024-07-31

### Added
- Initial release of WebGL Carousel
- Core carousel functionality with WebGL rendering
- WebGL 2.0 support with automatic fallback to WebGL 1.0
- Canvas 2D fallback for non-WebGL environments
- 15+ built-in transition effects:
  - Basic effects: fade, slide (4 directions)
  - 3D effects: flip (horizontal/vertical), page flip
  - Creative effects: wave, distortion, dissolve, pixel dissolve, circle, morph, glitch
- Custom effect system with GLSL shader support
- Framework adapters for React, Vue, and Svelte
- Touch gesture support
- Keyboard navigation
- Autoplay functionality
- Responsive design
- TypeScript support with full type definitions
- Comprehensive test suite with Jest and Playwright
- Documentation site with interactive demos

### Performance
- GPU-accelerated rendering
- Efficient texture management
- 60fps animation target
- Lazy loading support
- Memory leak prevention

### Developer Experience
- ESM, CJS, and UMD builds
- Source maps for debugging
- Detailed API documentation
- Example code for all features
- Framework-specific examples

[Unreleased]: https://github.com/northprint/webgl-carousel/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/northprint/webgl-carousel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/northprint/webgl-carousel/releases/tag/v0.1.0