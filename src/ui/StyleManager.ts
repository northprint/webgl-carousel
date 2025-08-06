import {
  getNavigationStyles,
  getPaginationStyles,
  getCarouselStyles,
  STYLE_IDS,
} from '../styles/carouselStyles';

export type StyleType = 'navigation' | 'pagination' | 'combined';

/**
 * Manages dynamic style injection and removal for carousel UI components
 */
export class StyleManager {
  private static instances = new Map<string, number>();
  private injectedStyles = new Set<string>();

  /**
   * Inject styles into the document head
   */
  public injectStyles(type: StyleType = 'combined'): void {
    const styleId = this.getStyleId(type);

    // If already injected by this instance, skip
    if (this.injectedStyles.has(styleId)) {
      return;
    }

    // Check if style element already exists
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = this.getStyleContent(type);
      document.head.appendChild(style);
    }

    // Track instance count
    const currentCount = StyleManager.instances.get(styleId) || 0;
    StyleManager.instances.set(styleId, currentCount + 1);

    // Track this instance's injected styles
    this.injectedStyles.add(styleId);
  }

  /**
   * Remove styles from the document
   */
  public removeStyles(type?: StyleType): void {
    const styleIds = type ? [this.getStyleId(type)] : Array.from(this.injectedStyles);

    styleIds.forEach((styleId) => {
      if (!this.injectedStyles.has(styleId)) {
        return;
      }

      // Decrement instance count
      const currentCount = StyleManager.instances.get(styleId) || 0;
      const newCount = Math.max(0, currentCount - 1);

      if (newCount === 0) {
        // Remove style element if no other instances are using it
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
        }
        StyleManager.instances.delete(styleId);
      } else {
        StyleManager.instances.set(styleId, newCount);
      }

      this.injectedStyles.delete(styleId);
    });
  }

  /**
   * Update existing styles
   */
  public updateStyles(type: StyleType = 'combined'): void {
    const styleId = this.getStyleId(type);
    const styleElement = document.getElementById(styleId);

    if (styleElement) {
      styleElement.textContent = this.getStyleContent(type);
    } else {
      this.injectStyles(type);
    }
  }

  /**
   * Check if styles are currently injected
   */
  public hasStyles(type: StyleType): boolean {
    const styleId = this.getStyleId(type);
    return this.injectedStyles.has(styleId);
  }

  /**
   * Clean up all styles injected by this instance
   */
  public cleanup(): void {
    this.removeStyles();
    this.injectedStyles.clear();
  }

  /**
   * Get the style ID for a given type
   */
  private getStyleId(type: StyleType): string {
    switch (type) {
      case 'navigation':
        return STYLE_IDS.NAVIGATION;
      case 'pagination':
        return STYLE_IDS.PAGINATION;
      case 'combined':
        return STYLE_IDS.COMBINED;
      default:
        return STYLE_IDS.COMBINED;
    }
  }

  /**
   * Get the style content for a given type
   */
  private getStyleContent(type: StyleType): string {
    switch (type) {
      case 'navigation':
        return getNavigationStyles();
      case 'pagination':
        return getPaginationStyles();
      case 'combined':
        return getCarouselStyles();
      default:
        return getCarouselStyles();
    }
  }

  /**
   * Get the current instance count for a style type
   */
  public static getInstanceCount(type: StyleType): number {
    const styleId =
      type === 'navigation'
        ? STYLE_IDS.NAVIGATION
        : type === 'pagination'
          ? STYLE_IDS.PAGINATION
          : STYLE_IDS.COMBINED;

    return StyleManager.instances.get(styleId) || 0;
  }

  /**
   * Clear all style instances (useful for testing)
   */
  public static clearAllInstances(): void {
    StyleManager.instances.clear();

    // Remove all style elements
    Object.values(STYLE_IDS).forEach((styleId) => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    });
  }
}
