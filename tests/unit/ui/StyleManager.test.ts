import { StyleManager } from '../../../src/ui/StyleManager';
import { STYLE_IDS } from '../../../src/styles/carouselStyles';

describe('StyleManager', () => {
  let styleManager: StyleManager;

  beforeEach(() => {
    // Clear any existing styles before each test
    StyleManager.clearAllInstances();
    styleManager = new StyleManager();
  });

  afterEach(() => {
    // Clean up after each test
    if (styleManager) {
      styleManager.cleanup();
    }
    StyleManager.clearAllInstances();
  });

  describe('injectStyles', () => {
    it('should inject navigation styles', () => {
      styleManager.injectStyles('navigation');
      
      const styleElement = document.getElementById(STYLE_IDS.NAVIGATION);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
      expect(styleElement?.textContent).toContain('.webgl-carousel-prev');
      expect(styleElement?.textContent).toContain('.webgl-carousel-next');
    });

    it('should inject pagination styles', () => {
      styleManager.injectStyles('pagination');
      
      const styleElement = document.getElementById(STYLE_IDS.PAGINATION);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
      expect(styleElement?.textContent).toContain('.webgl-carousel-pagination');
      expect(styleElement?.textContent).toContain('.webgl-carousel-dot');
    });

    it('should inject combined styles', () => {
      styleManager.injectStyles('combined');
      
      const styleElement = document.getElementById(STYLE_IDS.COMBINED);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.webgl-carousel-prev');
      expect(styleElement?.textContent).toContain('.webgl-carousel-pagination');
    });

    it('should not inject duplicate styles', () => {
      styleManager.injectStyles('navigation');
      const firstElement = document.getElementById(STYLE_IDS.NAVIGATION);
      
      styleManager.injectStyles('navigation');
      const secondElement = document.getElementById(STYLE_IDS.NAVIGATION);
      
      expect(firstElement).toBe(secondElement);
      expect(document.querySelectorAll(`#${STYLE_IDS.NAVIGATION}`).length).toBe(1);
    });

    it('should default to combined styles when no type specified', () => {
      styleManager.injectStyles();
      
      const styleElement = document.getElementById(STYLE_IDS.COMBINED);
      expect(styleElement).toBeTruthy();
    });
  });

  describe('removeStyles', () => {
    it('should remove injected styles', () => {
      styleManager.injectStyles('navigation');
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
      
      styleManager.removeStyles('navigation');
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
    });

    it('should only remove styles when no other instances are using them', () => {
      const manager1 = new StyleManager();
      const manager2 = new StyleManager();
      
      manager1.injectStyles('navigation');
      manager2.injectStyles('navigation');
      
      expect(StyleManager.getInstanceCount('navigation')).toBe(2);
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
      
      manager1.removeStyles('navigation');
      expect(StyleManager.getInstanceCount('navigation')).toBe(1);
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
      
      manager2.removeStyles('navigation');
      expect(StyleManager.getInstanceCount('navigation')).toBe(0);
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
    });

    it('should remove all styles when no type specified', () => {
      styleManager.injectStyles('navigation');
      styleManager.injectStyles('pagination');
      
      styleManager.removeStyles();
      
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
      expect(document.getElementById(STYLE_IDS.PAGINATION)).toBeNull();
    });

    it('should not throw when removing styles that were not injected', () => {
      expect(() => styleManager.removeStyles('navigation')).not.toThrow();
    });
  });

  describe('updateStyles', () => {
    it('should update existing styles', () => {
      styleManager.injectStyles('navigation');
      const originalElement = document.getElementById(STYLE_IDS.NAVIGATION);
      const originalContent = originalElement?.textContent;
      
      styleManager.updateStyles('navigation');
      const updatedElement = document.getElementById(STYLE_IDS.NAVIGATION);
      
      expect(updatedElement).toBeTruthy();
      expect(updatedElement?.textContent).toBe(originalContent);
    });

    it('should inject styles if they do not exist', () => {
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
      
      styleManager.updateStyles('navigation');
      
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeTruthy();
    });
  });

  describe('hasStyles', () => {
    it('should return true when styles are injected', () => {
      styleManager.injectStyles('navigation');
      expect(styleManager.hasStyles('navigation')).toBe(true);
    });

    it('should return false when styles are not injected', () => {
      expect(styleManager.hasStyles('navigation')).toBe(false);
    });

    it('should return false after styles are removed', () => {
      styleManager.injectStyles('navigation');
      styleManager.removeStyles('navigation');
      expect(styleManager.hasStyles('navigation')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove all injected styles', () => {
      styleManager.injectStyles('navigation');
      styleManager.injectStyles('pagination');
      styleManager.injectStyles('combined');
      
      styleManager.cleanup();
      
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
      expect(document.getElementById(STYLE_IDS.PAGINATION)).toBeNull();
      expect(document.getElementById(STYLE_IDS.COMBINED)).toBeNull();
      expect(styleManager.hasStyles('navigation')).toBe(false);
      expect(styleManager.hasStyles('pagination')).toBe(false);
      expect(styleManager.hasStyles('combined')).toBe(false);
    });
  });

  describe('instance management', () => {
    it('should track instance count correctly', () => {
      const manager1 = new StyleManager();
      const manager2 = new StyleManager();
      const manager3 = new StyleManager();
      
      expect(StyleManager.getInstanceCount('navigation')).toBe(0);
      
      manager1.injectStyles('navigation');
      expect(StyleManager.getInstanceCount('navigation')).toBe(1);
      
      manager2.injectStyles('navigation');
      expect(StyleManager.getInstanceCount('navigation')).toBe(2);
      
      manager3.injectStyles('navigation');
      expect(StyleManager.getInstanceCount('navigation')).toBe(3);
      
      manager2.cleanup();
      expect(StyleManager.getInstanceCount('navigation')).toBe(2);
      
      manager1.cleanup();
      manager3.cleanup();
      expect(StyleManager.getInstanceCount('navigation')).toBe(0);
    });
  });

  describe('clearAllInstances', () => {
    it('should remove all style elements and reset instance counts', () => {
      const manager1 = new StyleManager();
      const manager2 = new StyleManager();
      
      manager1.injectStyles('navigation');
      manager2.injectStyles('pagination');
      
      StyleManager.clearAllInstances();
      
      expect(document.getElementById(STYLE_IDS.NAVIGATION)).toBeNull();
      expect(document.getElementById(STYLE_IDS.PAGINATION)).toBeNull();
      expect(StyleManager.getInstanceCount('navigation')).toBe(0);
      expect(StyleManager.getInstanceCount('pagination')).toBe(0);
    });
  });

  describe('responsive styles', () => {
    it('should include media queries in navigation styles', () => {
      styleManager.injectStyles('navigation');
      const styleElement = document.getElementById(STYLE_IDS.NAVIGATION);
      
      expect(styleElement?.textContent).toContain('@media');
      expect(styleElement?.textContent).toContain('max-width: 768px');
    });

    it('should include media queries in pagination styles', () => {
      styleManager.injectStyles('pagination');
      const styleElement = document.getElementById(STYLE_IDS.PAGINATION);
      
      expect(styleElement?.textContent).toContain('@media');
      expect(styleElement?.textContent).toContain('max-width: 768px');
    });
  });
});