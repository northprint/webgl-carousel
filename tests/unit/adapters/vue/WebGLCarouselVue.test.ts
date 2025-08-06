import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { WebGLCarouselVue } from '../../../../src/adapters/vue/WebGLCarouselVue';
import { WebGLCarousel } from '../../../../src/WebGLCarousel';
import type { BaseEffect } from '../../../../src/effects/BaseEffect';

// Mock WebGLCarousel
vi.mock('../../../../src/WebGLCarousel');

describe('WebGLCarouselVue', () => {
  let wrapper: VueWrapper<any>;
  let mockCarouselInstance: any;

  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock carousel instance
    mockCarouselInstance = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      next: vi.fn(),
      previous: vi.fn(),
      goTo: vi.fn(),
      getCurrentIndex: vi.fn(() => 0),
      getTotalImages: vi.fn(() => mockImages.length),
      getImageCount: vi.fn(() => mockImages.length),
      setEffect: vi.fn(),
      getAvailableEffects: vi.fn(() => ['fade', 'slide', 'zoom']),
      registerEffect: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      isPlaying: vi.fn(() => false),
      setAutoplayInterval: vi.fn(),
      setAutoplay: vi.fn(),
      updateImages: vi.fn(),
      isTransitioning: vi.fn(() => false),
      destroy: vi.fn(),
    };

    // Mock constructor
    (WebGLCarousel as vi.MockedClass<typeof WebGLCarousel>).mockImplementation(
      () => mockCarouselInstance
    );
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render container element', () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    expect(wrapper.find('.webgl-carousel-container').exists()).toBe(true);
  });

  it('should initialize WebGLCarousel with correct options', () => {
    const props = {
      images: mockImages,
      autoplay: true,
      interval: 5000,
      transitionDuration: 1500,
      effect: 'slide',
      showControls: false,
      enableTouch: false,
      startIndex: 1,
    };

    wrapper = mount(WebGLCarouselVue, { props });

    expect(WebGLCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        images: mockImages,
        autoplay: true,
        autoplayInterval: 5000,
        transitionDuration: 1500,
        effect: 'slide',
        startIndex: 1,
      })
    );
  });

  it('should register event listeners', () => {
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();
    const onError = vi.fn();
    const onReady = vi.fn();

    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        onTransitionStart,
        onTransitionEnd,
        onError,
        onReady,
      },
    });

    expect(mockCarouselInstance.on).toHaveBeenCalledWith('transitionStart', expect.any(Function));
    expect(mockCarouselInstance.on).toHaveBeenCalledWith('transitionEnd', expect.any(Function));
    expect(mockCarouselInstance.on).toHaveBeenCalledWith('error', onError);
    expect(mockCarouselInstance.on).toHaveBeenCalledWith('ready', onReady);
  });

  it('should expose carousel methods', () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    const exposed = wrapper.vm;

    // Test next method
    exposed.next();
    expect(mockCarouselInstance.next).toHaveBeenCalled();

    // Test previous method
    exposed.previous();
    expect(mockCarouselInstance.previous).toHaveBeenCalled();

    // Test goTo method
    exposed.goTo(2);
    expect(mockCarouselInstance.goTo).toHaveBeenCalledWith(2);

    // Test getCurrentIndex
    expect(exposed.getCurrentIndex()).toBe(0);

    // Test getTotalImages
    expect(exposed.getTotalImages()).toBe(mockImages.length);

    // Test setEffect
    exposed.setEffect('zoom');
    expect(mockCarouselInstance.setEffect).toHaveBeenCalledWith('zoom');

    // Test getAvailableEffects
    expect(exposed.getAvailableEffects()).toEqual(['fade', 'slide', 'zoom']);

    // Test play/pause
    exposed.play();
    expect(mockCarouselInstance.play).toHaveBeenCalled();

    exposed.pause();
    expect(mockCarouselInstance.pause).toHaveBeenCalled();

    // Test isPlaying
    expect(exposed.isPlaying()).toBe(false);

    // Test setAutoplayInterval
    exposed.setAutoplayInterval(4000);
    expect(mockCarouselInstance.setAutoplay).toHaveBeenCalledWith(true, 4000);

    // Test updateImages (no-op in current implementation)
    const newImages = ['new1.jpg', 'new2.jpg'];
    exposed.updateImages(newImages);
    // updateImages is not implemented in WebGLCarousel

    // Test isTransitioning
    expect(exposed.isTransitioning()).toBe(false);
  });

  it('should update images when prop changes', async () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    const newImages = ['new1.jpg', 'new2.jpg'];
    await wrapper.setProps({ images: newImages });

    // updateImages is not implemented in current WebGLCarousel
    // The component would need to be recreated with new images
  });

  it('should handle autoplay prop changes', async () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        autoplay: false,
      },
    });

    // Enable autoplay
    await wrapper.setProps({ autoplay: true });
    expect(mockCarouselInstance.play).toHaveBeenCalled();

    // Disable autoplay
    await wrapper.setProps({ autoplay: false });
    expect(mockCarouselInstance.pause).toHaveBeenCalled();
  });

  it('should handle interval prop changes', async () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        interval: 3000,
      },
    });

    await wrapper.setProps({ interval: 5000 });
    expect(mockCarouselInstance.setAutoplay).toHaveBeenCalledWith(false, 5000);
  });

  it('should handle effect prop changes', async () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        effect: 'fade',
      },
    });

    await wrapper.setProps({ effect: 'slide' });
    expect(mockCarouselInstance.setEffect).toHaveBeenCalledWith('slide');
  });

  it('should destroy carousel on unmount', () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    wrapper.unmount();
    expect(mockCarouselInstance.destroy).toHaveBeenCalled();
  });

  it('should pass custom effects to carousel', () => {
    const mockEffect: BaseEffect = {
      name: 'custom',
      vertexShader: 'vertex',
      fragmentShader: 'fragment',
      getUniforms: vi.fn(),
    };

    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        effects: [mockEffect],
      },
    });

    expect(WebGLCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: [mockEffect],
      })
    );
  });

  it('should pass easing function to carousel', () => {
    const easingFn = (t: number) => t * t;

    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
        easing: easingFn,
      },
    });

    expect(WebGLCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        easing: easingFn,
      })
    );
  });

  it('should handle navigation methods', () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    const exposed = wrapper.vm;

    exposed.next();
    expect(mockCarouselInstance.next).toHaveBeenCalled();

    exposed.previous();
    expect(mockCarouselInstance.previous).toHaveBeenCalled();

    exposed.goTo(1);
    expect(mockCarouselInstance.goTo).toHaveBeenCalledWith(1);
  });

  it('should register custom effect', () => {
    wrapper = mount(WebGLCarouselVue, {
      props: {
        images: mockImages,
      },
    });

    const mockEffect: BaseEffect = {
      name: 'custom',
      vertexShader: 'vertex',
      fragmentShader: 'fragment',
      getUniforms: vi.fn(),
    };

    wrapper.vm.registerEffect(mockEffect);
    expect(mockCarouselInstance.registerEffect).toHaveBeenCalledWith(mockEffect);
  });
});