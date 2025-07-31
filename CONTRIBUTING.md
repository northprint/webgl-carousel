# Contributing to WebGL Carousel

First off, thank you for considering contributing to WebGL Carousel! It's people like you that make WebGL Carousel such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible
* Include your environment details (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the feature
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fork the repo and create your branch from `main`
* If you've added code that should be tested, add tests
* If you've changed APIs, update the documentation
* Ensure the test suite passes
* Make sure your code lints
* Issue that pull request!

## Development Setup

1. Fork and clone the repository
```bash
git clone https://github.com/northprint/webgl-carousel.git
cd webgl-carousel
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Run tests
```bash
npm test
npm run test:e2e
```

## Development Process

1. Create a new branch for your feature or bugfix
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them with descriptive messages
```bash
git add .
git commit -m "feat: add new transition effect"
```

3. Push your branch and create a pull request
```bash
git push origin feature/your-feature-name
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat:` A new feature
* `fix:` A bug fix
* `docs:` Documentation only changes
* `style:` Changes that don't affect the meaning of the code
* `refactor:` A code change that neither fixes a bug nor adds a feature
* `perf:` A code change that improves performance
* `test:` Adding missing tests or correcting existing tests
* `chore:` Changes to the build process or auxiliary tools

### Code Style

* We use ESLint and Prettier for code formatting
* Run `npm run lint` to check your code
* Run `npm run format` to auto-format your code
* TypeScript strict mode is enabled

### Testing

* Write unit tests for new functionality
* Add E2E tests for user-facing features
* Ensure all tests pass before submitting PR
* Aim for high code coverage

### Documentation

* Update README.md if needed
* Add JSDoc comments to new functions/classes
* Update the documentation site for new features
* Include examples for new functionality

## Project Structure

```
webgl-carousel/
├── src/                # Source code
│   ├── core/          # Core functionality
│   ├── effects/       # Transition effects
│   └── adapters/      # Framework adapters
├── tests/             # Unit tests
├── e2e/              # E2E tests
├── demos/            # Demo pages
└── docs/             # Documentation site
```

## Adding New Effects

To add a new transition effect:

1. Create a new file in `src/effects/`
2. Implement the `Effect` interface
3. Add vertex and fragment shaders
4. Register the effect in `src/effects/index.ts`
5. Add unit tests
6. Add E2E tests
7. Update documentation

Example:
```typescript
// src/effects/myEffect.ts
import { Effect } from '../types';

export const myEffect: Effect = {
  name: 'myEffect',
  uniforms: {
    progress: 0.0,
    // Add custom uniforms
  },
  vertexShader: `...`,
  fragmentShader: `...`,
};
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers directly.

Thank you for your contribution! 🎉