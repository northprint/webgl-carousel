import { EventEmitter } from './EventEmitter';

export interface CarouselState {
  currentIndex: number;
  images: string[];
  isPlaying: boolean;
  isTransitioning: boolean;
  effect: string;
  transitionDuration: number;
  autoplayInterval: number;
  loop: boolean;
}

export interface StateEvents extends Record<string, unknown[]> {
  stateChange: [keyof CarouselState, unknown, unknown];
  indexChange: [number, number];
  playStateChange: [boolean];
  transitionStart: [number, number];
  transitionEnd: [number];
}

export class StateManager extends EventEmitter<StateEvents> {
  private state: CarouselState;

  constructor(initialState: Partial<CarouselState> = {}) {
    super();
    this.state = {
      currentIndex: 0,
      images: [],
      isPlaying: false,
      isTransitioning: false,
      effect: 'fade',
      transitionDuration: 1000,
      autoplayInterval: 3000,
      loop: true,
      ...initialState,
    };
  }

  getState(): Readonly<CarouselState> {
    return { ...this.state };
  }

  get<K extends keyof CarouselState>(key: K): CarouselState[K] {
    return this.state[key];
  }

  set<K extends keyof CarouselState>(key: K, value: CarouselState[K]): void {
    const oldValue = this.state[key];
    if (oldValue !== value) {
      this.state[key] = value;
      this.emit('stateChange', key, oldValue, value);

      // Emit specific events for certain state changes
      if (key === 'currentIndex') {
        this.emit('indexChange', oldValue as number, value as number);
      } else if (key === 'isPlaying') {
        this.emit('playStateChange', value as boolean);
      }
    }
  }

  update(updates: Partial<CarouselState>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key as keyof CarouselState, value);
    });
  }

  canGoNext(): boolean {
    const { currentIndex, images, loop } = this.state;
    return loop || currentIndex < images.length - 1;
  }

  canGoPrevious(): boolean {
    const { currentIndex, loop } = this.state;
    return loop || currentIndex > 0;
  }

  getNextIndex(): number {
    const { currentIndex, images, loop } = this.state;
    if (currentIndex === images.length - 1) {
      return loop ? 0 : currentIndex;
    }
    return currentIndex + 1;
  }

  getPreviousIndex(): number {
    const { currentIndex, images, loop } = this.state;
    if (currentIndex === 0) {
      return loop ? images.length - 1 : currentIndex;
    }
    return currentIndex - 1;
  }

  startTransition(toIndex: number): void {
    if (!this.state.isTransitioning) {
      const fromIndex = this.state.currentIndex;
      this.set('isTransitioning', true);
      this.emit('transitionStart', fromIndex, toIndex);
    }
  }

  endTransition(newIndex: number): void {
    if (this.state.isTransitioning) {
      this.set('isTransitioning', false);
      this.set('currentIndex', newIndex);
      this.emit('transitionEnd', newIndex);
    }
  }

  reset(): void {
    this.update({
      currentIndex: 0,
      isPlaying: false,
      isTransitioning: false,
    });
  }
}
