import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { StateManager } from '../../../src/core/StateManager';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager({
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const sm = new StateManager();
      const state = sm.getState();

      expect(state.currentIndex).toBe(0);
      expect(state.images).toEqual([]);
      expect(state.isPlaying).toBe(false);
      expect(state.isTransitioning).toBe(false);
      expect(state.effect).toBe('fade');
      expect(state.transitionDuration).toBe(1000);
      expect(state.autoplayInterval).toBe(3000);
      expect(state.loop).toBe(true);
    });

    it('should initialize with custom state', () => {
      const customState = {
        currentIndex: 1,
        effect: 'slide',
        loop: false,
      };
      const sm = new StateManager(customState);
      const state = sm.getState();

      expect(state.currentIndex).toBe(1);
      expect(state.effect).toBe('slide');
      expect(state.loop).toBe(false);
    });
  });

  describe('get/set', () => {
    it('should get specific state value', () => {
      expect(stateManager.get('currentIndex')).toBe(0);
      expect(stateManager.get('images')).toEqual(['img1.jpg', 'img2.jpg', 'img3.jpg']);
    });

    it('should set state value and emit event', () => {
      const stateChangeHandler = vi.fn();
      const indexChangeHandler = vi.fn();

      stateManager.on('stateChange', stateChangeHandler);
      stateManager.on('indexChange', indexChangeHandler);

      stateManager.set('currentIndex', 2);

      expect(stateManager.get('currentIndex')).toBe(2);
      expect(stateChangeHandler).toHaveBeenCalledWith('currentIndex', 0, 2);
      expect(indexChangeHandler).toHaveBeenCalledWith(0, 2);
    });

    it('should not emit event if value unchanged', () => {
      const handler = vi.fn();
      stateManager.on('stateChange', handler);

      stateManager.set('currentIndex', 0);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit playStateChange event', () => {
      const handler = vi.fn();
      stateManager.on('playStateChange', handler);

      stateManager.set('isPlaying', true);
      expect(handler).toHaveBeenCalledWith(true);
    });
  });

  describe('update', () => {
    it('should update multiple state values', () => {
      const handler = vi.fn();
      stateManager.on('stateChange', handler);

      stateManager.update({
        currentIndex: 1,
        effect: 'wave',
        isPlaying: true,
      });

      expect(stateManager.get('currentIndex')).toBe(1);
      expect(stateManager.get('effect')).toBe('wave');
      expect(stateManager.get('isPlaying')).toBe(true);
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('navigation helpers', () => {
    describe('with loop enabled', () => {
      it('should always allow next/previous', () => {
        stateManager.set('currentIndex', 0);
        expect(stateManager.canGoPrevious()).toBe(true);
        expect(stateManager.canGoNext()).toBe(true);

        stateManager.set('currentIndex', 2);
        expect(stateManager.canGoPrevious()).toBe(true);
        expect(stateManager.canGoNext()).toBe(true);
      });

      it('should get correct next index', () => {
        stateManager.set('currentIndex', 0);
        expect(stateManager.getNextIndex()).toBe(1);

        stateManager.set('currentIndex', 2);
        expect(stateManager.getNextIndex()).toBe(0); // loops to start
      });

      it('should get correct previous index', () => {
        stateManager.set('currentIndex', 2);
        expect(stateManager.getPreviousIndex()).toBe(1);

        stateManager.set('currentIndex', 0);
        expect(stateManager.getPreviousIndex()).toBe(2); // loops to end
      });
    });

    describe('with loop disabled', () => {
      beforeEach(() => {
        stateManager.set('loop', false);
      });

      it('should respect boundaries', () => {
        stateManager.set('currentIndex', 0);
        expect(stateManager.canGoPrevious()).toBe(false);
        expect(stateManager.canGoNext()).toBe(true);

        stateManager.set('currentIndex', 2);
        expect(stateManager.canGoPrevious()).toBe(true);
        expect(stateManager.canGoNext()).toBe(false);
      });

      it('should not go beyond boundaries', () => {
        stateManager.set('currentIndex', 0);
        expect(stateManager.getPreviousIndex()).toBe(0);

        stateManager.set('currentIndex', 2);
        expect(stateManager.getNextIndex()).toBe(2);
      });
    });
  });

  describe('transitions', () => {
    it('should handle transition start', () => {
      const handler = vi.fn();
      stateManager.on('transitionStart', handler);

      stateManager.startTransition(2);

      expect(stateManager.get('isTransitioning')).toBe(true);
      expect(handler).toHaveBeenCalledWith(0, 2);
    });

    it('should not start transition if already transitioning', () => {
      const handler = vi.fn();
      stateManager.on('transitionStart', handler);

      stateManager.set('isTransitioning', true);
      stateManager.startTransition(2);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle transition end', () => {
      const handler = vi.fn();
      stateManager.on('transitionEnd', handler);

      stateManager.set('isTransitioning', true);
      stateManager.endTransition(2);

      expect(stateManager.get('isTransitioning')).toBe(false);
      expect(stateManager.get('currentIndex')).toBe(2);
      expect(handler).toHaveBeenCalledWith(2);
    });

    it('should not end transition if not transitioning', () => {
      const handler = vi.fn();
      stateManager.on('transitionEnd', handler);

      stateManager.endTransition(2);

      expect(handler).not.toHaveBeenCalled();
      expect(stateManager.get('currentIndex')).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      stateManager.update({
        currentIndex: 2,
        isPlaying: true,
        isTransitioning: true,
      });

      stateManager.reset();

      expect(stateManager.get('currentIndex')).toBe(0);
      expect(stateManager.get('isPlaying')).toBe(false);
      expect(stateManager.get('isTransitioning')).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return a copy of state', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);

      state1.currentIndex = 99;
      expect(stateManager.get('currentIndex')).toBe(0);
    });
  });
});