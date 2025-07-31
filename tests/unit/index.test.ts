// Mock Svelte component before importing
jest.mock('../../src/adapters/svelte/WebGLCarouselSvelte.svelte', () => ({
  default: jest.fn(),
}));

import { WebGLCarousel, VERSION } from '../../src/index';

describe('WebGLCarousel', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should create instance', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const mockOptions = { 
      container,
      images: ['image1.jpg', 'image2.jpg'] 
    };
    const carousel = new WebGLCarousel(mockOptions);
    expect(carousel).toBeInstanceOf(WebGLCarousel);
    
    document.body.removeChild(container);
  });
});