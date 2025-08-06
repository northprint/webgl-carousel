import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebGLCarouselReact, useWebGLCarousel } from '../../../../src/adapters/react';
import type { WebGLCarouselReactRef } from '../../../../src/adapters/react';

// Mock WebGLCarousel
const mockCarouselInstance = {
  on: vi.fn(),
  emit: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  goTo: vi.fn(),
  setEffect: vi.fn(),
  getAvailableEffects: vi.fn().mockReturnValue(['fade', 'slide', 'flip']),
  registerEffect: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  setTransitionDuration: vi.fn(),
  getCurrentIndex: vi.fn().mockReturnValue(0),
  getImageCount: vi.fn().mockReturnValue(3),
  isReady: vi.fn().mockReturnValue(true),
  destroy: vi.fn(),
};

vi.mock('../../../../src/WebGLCarousel', () => {
  return {
    WebGLCarousel: vi.fn().mockImplementation((options) => {
      const listeners: Record<string, Function[]> = {};
      
      // Set up event handling
      mockCarouselInstance.on.mockImplementation((event: string, handler: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
        
        // Simulate ready event
        if (event === 'ready') {
          setTimeout(() => handler(), 0);
        }
      });
      
      mockCarouselInstance.emit.mockImplementation((event: string, ...args: any[]) => {
        if (listeners[event]) {
          listeners[event].forEach(handler => handler(...args));
        }
      });
      
      return mockCarouselInstance;
    }),
  };
});

describe('WebGLCarouselReact', () => {
  const mockImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <WebGLCarouselReact 
        images={mockImages}
      />
    );
    
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should apply custom className and style', () => {
    render(
      <WebGLCarouselReact 
        images={mockImages}
        className="custom-carousel"
        style={{ backgroundColor: 'red' }}
        width={800}
        height={600}
      />
    );
    
    const container = screen.getByRole('region');
    expect(container).toHaveClass('custom-carousel');
    expect(container).toHaveStyle({
      width: '800px',
      height: '600px',
    });
    // Check backgroundColor separately as JSDOM returns RGB format
    const style = window.getComputedStyle(container);
    expect(style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('should call event handlers', async () => {
    const onReady = vi.fn();
    const onImageChange = vi.fn();
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();
    const onError = vi.fn();
    const onEffectChange = vi.fn();


    render(
      <WebGLCarouselReact 
        images={mockImages}
        onReady={onReady}
        onImageChange={onImageChange}
        onTransitionStart={onTransitionStart}
        onTransitionEnd={onTransitionEnd}
        onError={onError}
        onEffectChange={onEffectChange}
      />
    );

    // Wait for ready
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // Simulate events
    mockCarouselInstance.emit('imageChange', 1);
    expect(onImageChange).toHaveBeenCalledWith(1);

    mockCarouselInstance.emit('transitionStart', 0, 1);
    expect(onTransitionStart).toHaveBeenCalledWith(0, 1);

    mockCarouselInstance.emit('transitionEnd', 1);
    expect(onTransitionEnd).toHaveBeenCalledWith(1);

    mockCarouselInstance.emit('error', new Error('Test error'));
    expect(onError).toHaveBeenCalledWith(new Error('Test error'));

    mockCarouselInstance.emit('effectChange', 'slide');
    expect(onEffectChange).toHaveBeenCalledWith('slide');
  });

  it('should expose methods via ref', () => {
    const ref = React.createRef<WebGLCarouselReactRef>();
    
    render(
      <WebGLCarouselReact 
        ref={ref}
        images={mockImages}
      />
    );

    expect(ref.current).toBeDefined();
    expect(ref.current?.next).toBeDefined();
    expect(ref.current?.previous).toBeDefined();
    expect(ref.current?.goTo).toBeDefined();
    expect(ref.current?.setEffect).toBeDefined();
    expect(ref.current?.getAvailableEffects).toBeDefined();
    expect(ref.current?.registerEffect).toBeDefined();
    expect(ref.current?.play).toBeDefined();
    expect(ref.current?.pause).toBeDefined();
    expect(ref.current?.setTransitionDuration).toBeDefined();
    expect(ref.current?.getCurrentIndex).toBeDefined();
    expect(ref.current?.getImageCount).toBeDefined();
    expect(ref.current?.isReady).toBeDefined();
  });

  it('should call carousel methods via ref', () => {
    const ref = React.createRef<WebGLCarouselReactRef>();
    
    render(
      <WebGLCarouselReact 
        ref={ref}
        images={mockImages}
      />
    );

    ref.current?.next();
    expect(mockCarouselInstance.next).toHaveBeenCalled();

    ref.current?.previous();
    expect(mockCarouselInstance.previous).toHaveBeenCalled();

    ref.current?.goTo(2);
    expect(mockCarouselInstance.goTo).toHaveBeenCalledWith(2);

    ref.current?.setEffect('slide');
    expect(mockCarouselInstance.setEffect).toHaveBeenCalledWith('slide');

    const mockEffect = { name: 'custom', vertexShader: '', fragmentShader: '', getUniforms: () => ({}) };
    ref.current?.registerEffect(mockEffect);
    expect(mockCarouselInstance.registerEffect).toHaveBeenCalledWith(mockEffect);

    ref.current?.play();
    expect(mockCarouselInstance.play).toHaveBeenCalled();

    ref.current?.pause();
    expect(mockCarouselInstance.pause).toHaveBeenCalled();

    ref.current?.setTransitionDuration(2000);
    expect(mockCarouselInstance.setTransitionDuration).toHaveBeenCalledWith(2000);

    expect(ref.current?.getCurrentIndex()).toBe(0);
    expect(ref.current?.getImageCount()).toBe(3);
    expect(ref.current?.isReady()).toBe(true);
    expect(ref.current?.getAvailableEffects()).toEqual(['fade', 'slide', 'flip']);
  });

  it('should update carousel when props change', () => {
    // Mock isReady to return true after initial render
    mockCarouselInstance.isReady.mockReturnValue(true);
    
    const { rerender } = render(
      <WebGLCarouselReact 
        images={mockImages}
        effect="fade"
        autoplay={false}
        transitionDuration={1000}
      />
    );

    // Clear previous calls
    mockCarouselInstance.setEffect.mockClear();
    mockCarouselInstance.play.mockClear();
    mockCarouselInstance.pause.mockClear();
    mockCarouselInstance.setTransitionDuration.mockClear();

    // Change effect
    rerender(
      <WebGLCarouselReact 
        images={mockImages}
        effect="slide"
        autoplay={false}
        transitionDuration={1000}
      />
    );
    expect(mockCarouselInstance.setEffect).toHaveBeenCalledWith('slide');

    // Enable autoplay
    rerender(
      <WebGLCarouselReact 
        images={mockImages}
        effect="slide"
        autoplay={true}
        transitionDuration={1000}
      />
    );
    expect(mockCarouselInstance.play).toHaveBeenCalled();

    // Disable autoplay
    rerender(
      <WebGLCarouselReact 
        images={mockImages}
        effect="slide"
        autoplay={false}
        transitionDuration={1000}
      />
    );
    expect(mockCarouselInstance.pause).toHaveBeenCalled();

    // Change transition duration
    rerender(
      <WebGLCarouselReact 
        images={mockImages}
        effect="slide"
        autoplay={false}
        transitionDuration={2000}
      />
    );
    expect(mockCarouselInstance.setTransitionDuration).toHaveBeenCalledWith(2000);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <WebGLCarouselReact 
        images={mockImages}
      />
    );

    unmount();
    expect(mockCarouselInstance.destroy).toHaveBeenCalled();
  });
});

describe('useWebGLCarousel', () => {
  function TestComponent() {
    const carousel = useWebGLCarousel();
    
    return (
      <>
        <WebGLCarouselReact 
          ref={carousel.ref}
          images={['image1.jpg', 'image2.jpg']}
        />
        <button onClick={() => carousel.next()}>Next</button>
        <button onClick={() => carousel.previous()}>Previous</button>
        <button onClick={() => carousel.goTo(1)}>Go to 1</button>
        <button onClick={() => carousel.play()}>Play</button>
        <button onClick={() => carousel.pause()}>Pause</button>
        <div data-testid="index">{carousel.getCurrentIndex()}</div>
        <div data-testid="count">{carousel.getImageCount()}</div>
        <div data-testid="ready">{carousel.isReady() ? 'ready' : 'not ready'}</div>
      </>
    );
  }

  it('should provide carousel controls via hook', async () => {
    render(<TestComponent />);
    
    const user = userEvent.setup();
    
    // Clear previous calls
    mockCarouselInstance.next.mockClear();
    mockCarouselInstance.previous.mockClear();
    mockCarouselInstance.goTo.mockClear();
    mockCarouselInstance.play.mockClear();
    mockCarouselInstance.pause.mockClear();
    
    await user.click(screen.getByText('Next'));
    expect(mockCarouselInstance.next).toHaveBeenCalled();

    await user.click(screen.getByText('Previous'));
    expect(mockCarouselInstance.previous).toHaveBeenCalled();

    await user.click(screen.getByText('Go to 1'));
    expect(mockCarouselInstance.goTo).toHaveBeenCalledWith(1);

    await user.click(screen.getByText('Play'));
    expect(mockCarouselInstance.play).toHaveBeenCalled();

    await user.click(screen.getByText('Pause'));
    expect(mockCarouselInstance.pause).toHaveBeenCalled();

    // These values come from the hook which uses the ref
    // Since the carousel is mocked, these will return default values from the hook
    expect(screen.getByTestId('index')).toHaveTextContent('0');
    expect(screen.getByTestId('count')).toHaveTextContent('0'); // Hook returns 0 when ref.current is null
    expect(screen.getByTestId('ready')).toHaveTextContent('not ready'); // Hook returns false when ref.current is null
  });
});