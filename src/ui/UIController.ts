import { EventEmitter } from '../core/EventEmitter';
import { StyleManager } from './StyleManager';
import { EventManager } from '../utils/EventManager';
import type { IUIController } from '../interfaces/IUIController';

export interface UIControllerOptions {
  container: HTMLElement;
  imageCount: number;
  navigation?: boolean;
  pagination?: boolean;
  startIndex?: number;
}

export interface UIControllerEvents {
  navigationClick: [direction: 'prev' | 'next'];
  paginationClick: [index: number];
  [event: string]: unknown[];
}

export class UIController extends EventEmitter<UIControllerEvents> implements IUIController {
  private container: HTMLElement;
  private imageCount: number;
  private navigation: boolean;
  private pagination: boolean;
  private currentIndex: number;
  private navigationElements: {
    prevButton?: HTMLButtonElement;
    nextButton?: HTMLButtonElement;
  } = {};
  private paginationElement?: HTMLDivElement;
  private styleManager: StyleManager;
  private eventManager: EventManager;

  constructor(options: UIControllerOptions) {
    super();
    this.container = options.container;
    this.imageCount = options.imageCount;
    this.navigation = options.navigation ?? true;
    this.pagination = options.pagination ?? true;
    this.currentIndex = options.startIndex ?? 0;
    this.styleManager = new StyleManager();
    this.eventManager = new EventManager();

    this.initialize();
  }

  private initialize(): void {
    // Inject styles based on what's enabled
    if (this.navigation && this.pagination) {
      this.styleManager.injectStyles('combined');
    } else if (this.navigation) {
      this.styleManager.injectStyles('navigation');
    } else if (this.pagination) {
      this.styleManager.injectStyles('pagination');
    }

    if (this.navigation) {
      this.createNavigationControls();
    }

    if (this.pagination) {
      this.createPaginationControls();
      this.updatePagination(this.currentIndex);
    }
  }

  private createNavigationControls(): void {
    const prevButton = document.createElement('button');
    prevButton.className = 'webgl-carousel-prev';
    prevButton.innerHTML = '&lsaquo;';
    prevButton.setAttribute('aria-label', 'Previous image');
    this.eventManager.addEventListener(prevButton, 'click', () => {
      this.emit('navigationClick', 'prev');
    });

    const nextButton = document.createElement('button');
    nextButton.className = 'webgl-carousel-next';
    nextButton.innerHTML = '&rsaquo;';
    nextButton.setAttribute('aria-label', 'Next image');
    this.eventManager.addEventListener(nextButton, 'click', () => {
      this.emit('navigationClick', 'next');
    });

    this.container.appendChild(prevButton);
    this.container.appendChild(nextButton);

    this.navigationElements = { prevButton, nextButton };
  }

  private createPaginationControls(): void {
    const pagination = document.createElement('div');
    pagination.className = 'webgl-carousel-pagination';

    for (let i = 0; i < this.imageCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'webgl-carousel-dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      this.eventManager.addEventListener(dot, 'click', () => {
        this.emit('paginationClick', i);
      });

      if (i === this.currentIndex) {
        dot.classList.add('active');
      }

      pagination.appendChild(dot);
    }

    this.container.appendChild(pagination);
    this.paginationElement = pagination;
  }

  public updatePagination(index: number): void {
    this.currentIndex = index;
    const dots = this.container.querySelectorAll('.webgl-carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  public updateImageCount(count: number): void {
    this.imageCount = count;

    if (this.pagination && this.paginationElement) {
      this.paginationElement.remove();
      this.createPaginationControls();
      this.updatePagination(this.currentIndex);
    }
  }

  public setNavigationEnabled(enabled: boolean): void {
    if (enabled && !this.navigation) {
      this.navigation = true;
      this.createNavigationControls();
      this.updateStyles();
    } else if (!enabled && this.navigation) {
      this.navigation = false;
      if (this.navigationElements.prevButton) {
        this.navigationElements.prevButton.remove();
      }
      if (this.navigationElements.nextButton) {
        this.navigationElements.nextButton.remove();
      }
      this.navigationElements = {};
      this.updateStyles();
    }
  }

  public setPaginationEnabled(enabled: boolean): void {
    if (enabled && !this.pagination) {
      this.pagination = true;
      this.createPaginationControls();
      this.updatePagination(this.currentIndex);
      this.updateStyles();
    } else if (!enabled && this.pagination) {
      this.pagination = false;
      if (this.paginationElement) {
        this.paginationElement.remove();
        this.paginationElement = undefined;
      }
      this.updateStyles();
    }
  }

  private updateStyles(): void {
    // Clear existing styles
    this.styleManager.cleanup();

    // Re-inject based on current state
    if (this.navigation && this.pagination) {
      this.styleManager.injectStyles('combined');
    } else if (this.navigation) {
      this.styleManager.injectStyles('navigation');
    } else if (this.pagination) {
      this.styleManager.injectStyles('pagination');
    }
  }

  public destroy(): void {
    // Clean up all event listeners
    this.eventManager.destroy();

    if (this.navigationElements.prevButton) {
      this.navigationElements.prevButton.remove();
    }
    if (this.navigationElements.nextButton) {
      this.navigationElements.nextButton.remove();
    }
    if (this.paginationElement) {
      this.paginationElement.remove();
    }

    // Clean up styles
    this.styleManager.cleanup();

    this.removeAllListeners();
  }
}
