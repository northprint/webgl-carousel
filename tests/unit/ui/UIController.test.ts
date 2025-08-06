import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { UIController } from '../../../src/ui/UIController';
import { StyleManager } from '../../../src/ui/StyleManager';
import { STYLE_IDS } from '../../../src/styles/carouselStyles';

describe('UIController', () => {
  let container: HTMLDivElement;
  let uiController: UIController;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    StyleManager.clearAllInstances();
  });

  afterEach(() => {
    if (uiController) {
      uiController.destroy();
    }
    document.body.removeChild(container);
    StyleManager.clearAllInstances();
  });

  describe('initialization', () => {
    it('should create navigation controls when navigation is enabled', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: false,
      });

      const prevButton = container.querySelector('.webgl-carousel-prev');
      const nextButton = container.querySelector('.webgl-carousel-next');

      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      expect(prevButton?.getAttribute('aria-label')).toBe('Previous image');
      expect(nextButton?.getAttribute('aria-label')).toBe('Next image');
    });

    it('should create pagination controls when pagination is enabled', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: true,
      });

      const pagination = container.querySelector('.webgl-carousel-pagination');
      const dots = container.querySelectorAll('.webgl-carousel-dot');

      expect(pagination).toBeTruthy();
      expect(dots.length).toBe(3);
      expect(dots[0]?.classList.contains('active')).toBe(true);
    });

    it('should set initial active dot based on startIndex', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: true,
        startIndex: 1,
      });

      const dots = container.querySelectorAll('.webgl-carousel-dot');
      expect(dots[1]?.classList.contains('active')).toBe(true);
      expect(dots[0]?.classList.contains('active')).toBe(false);
    });
  });

  describe('navigation events', () => {
    it('should emit navigationClick event when prev button is clicked', (done) => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
      });

      uiController.on('navigationClick', (direction) => {
        expect(direction).toBe('prev');
        done();
      });

      const prevButton = container.querySelector('.webgl-carousel-prev') as HTMLButtonElement;
      prevButton.click();
    });

    it('should emit navigationClick event when next button is clicked', (done) => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
      });

      uiController.on('navigationClick', (direction) => {
        expect(direction).toBe('next');
        done();
      });

      const nextButton = container.querySelector('.webgl-carousel-next') as HTMLButtonElement;
      nextButton.click();
    });
  });

  describe('pagination events', () => {
    it('should emit paginationClick event when dot is clicked', (done) => {
      uiController = new UIController({
        container,
        imageCount: 3,
        pagination: true,
      });

      uiController.on('paginationClick', (index) => {
        expect(index).toBe(2);
        done();
      });

      const dots = container.querySelectorAll('.webgl-carousel-dot');
      (dots[2] as HTMLButtonElement).click();
    });
  });

  describe('updatePagination', () => {
    it('should update active dot when updatePagination is called', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        pagination: true,
      });

      uiController.updatePagination(2);

      const dots = container.querySelectorAll('.webgl-carousel-dot');
      expect(dots[2]?.classList.contains('active')).toBe(true);
      expect(dots[0]?.classList.contains('active')).toBe(false);
      expect(dots[1]?.classList.contains('active')).toBe(false);
    });
  });

  describe('updateImageCount', () => {
    it('should recreate pagination with new image count', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        pagination: true,
      });

      uiController.updateImageCount(5);

      const dots = container.querySelectorAll('.webgl-carousel-dot');
      expect(dots.length).toBe(5);
    });

    it('should preserve current index when updating image count', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        pagination: true,
        startIndex: 1,
      });

      uiController.updateImageCount(5);

      const dots = container.querySelectorAll('.webgl-carousel-dot');
      expect(dots[1]?.classList.contains('active')).toBe(true);
    });
  });

  describe('styles', () => {
    it('should inject combined styles when both navigation and pagination are enabled', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: true,
      });

      const styleElement = document.getElementById(STYLE_IDS.COMBINED);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.webgl-carousel-prev');
      expect(styleElement?.textContent).toContain('.webgl-carousel-pagination');
    });

    it('should inject only navigation styles when pagination is disabled', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: false,
      });

      const navStyle = document.getElementById(STYLE_IDS.NAVIGATION);
      const combinedStyle = document.getElementById(STYLE_IDS.COMBINED);
      
      expect(navStyle).toBeTruthy();
      expect(combinedStyle).toBeNull();
    });

    it('should inject only pagination styles when navigation is disabled', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: true,
      });

      const paginationStyle = document.getElementById(STYLE_IDS.PAGINATION);
      const combinedStyle = document.getElementById(STYLE_IDS.COMBINED);
      
      expect(paginationStyle).toBeTruthy();
      expect(combinedStyle).toBeNull();
    });

    it('should share styles between multiple instances', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: true,
      });

      const controller2 = new UIController({
        container: container2,
        imageCount: 3,
        navigation: true,
        pagination: true,
      });

      // Should only have one style element
      const styleElements = document.querySelectorAll(`#${STYLE_IDS.COMBINED}`);
      expect(styleElements.length).toBe(1);

      // Style should remain after destroying one controller
      uiController.destroy();
      uiController = null as any;
      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeTruthy();

      // Style should be removed after destroying both
      controller2.destroy();
      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeNull();

      document.body.removeChild(container2);
    });
  });

  describe('dynamic control toggling', () => {
    it('should enable navigation dynamically', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: false,
      });

      expect(container.querySelector('.webgl-carousel-prev')).toBeNull();
      expect(container.querySelector('.webgl-carousel-next')).toBeNull();

      uiController.setNavigationEnabled(true);

      expect(container.querySelector('.webgl-carousel-prev')).toBeTruthy();
      expect(container.querySelector('.webgl-carousel-next')).toBeTruthy();
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
    });

    it('should disable navigation dynamically', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: false,
      });

      expect(container.querySelector('.webgl-carousel-prev')).toBeTruthy();

      uiController.setNavigationEnabled(false);

      expect(container.querySelector('.webgl-carousel-prev')).toBeNull();
      expect(container.querySelector('.webgl-carousel-next')).toBeNull();
    });

    it('should enable pagination dynamically', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: false,
      });

      expect(container.querySelector('.webgl-carousel-pagination')).toBeNull();

      uiController.setPaginationEnabled(true);

      expect(container.querySelector('.webgl-carousel-pagination')).toBeTruthy();
      expect(container.querySelectorAll('.webgl-carousel-dot').length).toBe(3);
      expect(document.getElementById(STYLE_IDS.PAGINATION)).toBeTruthy();
    });

    it('should disable pagination dynamically', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: false,
        pagination: true,
      });

      expect(container.querySelector('.webgl-carousel-pagination')).toBeTruthy();

      uiController.setPaginationEnabled(false);

      expect(container.querySelector('.webgl-carousel-pagination')).toBeNull();
    });

    it('should update styles when toggling controls', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: false,
      });

      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeNull();

      uiController.setPaginationEnabled(true);

      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeTruthy();
    });
  });

  describe('destroy', () => {
    it('should remove all UI elements', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: true,
      });

      uiController.destroy();

      expect(container.querySelector('.webgl-carousel-prev')).toBeNull();
      expect(container.querySelector('.webgl-carousel-next')).toBeNull();
      expect(container.querySelector('.webgl-carousel-pagination')).toBeNull();
    });

    it('should remove styles if no other instances exist', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
        pagination: true,
      });

      uiController.destroy();

      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeNull();
    });

    it('should remove all event listeners', () => {
      uiController = new UIController({
        container,
        imageCount: 3,
        navigation: true,
      });

      const spy = vi.fn();
      uiController.on('navigationClick', spy);

      uiController.destroy();

      const prevButton = document.createElement('button');
      prevButton.className = 'webgl-carousel-prev';
      container.appendChild(prevButton);
      prevButton.click();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});