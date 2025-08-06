import { CSS_DEFAULTS } from '../constants/defaults';

/**
 * Navigation control styles
 */
export const getNavigationStyles = (): string => {
  const { NAVIGATION } = CSS_DEFAULTS;
  return `
    .webgl-carousel-prev,
    .webgl-carousel-next {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      font-size: ${NAVIGATION.fontSize};
      padding: ${NAVIGATION.padding};
      cursor: pointer;
      transition: background-color ${NAVIGATION.transitionDuration};
      z-index: ${NAVIGATION.zIndex};
      user-select: none;
      outline: none;
      border-radius: 4px;
    }
    
    .webgl-carousel-prev:hover,
    .webgl-carousel-next:hover {
      background: rgba(0, 0, 0, 0.7);
    }
    
    .webgl-carousel-prev:active,
    .webgl-carousel-next:active {
      background: rgba(0, 0, 0, 0.8);
    }
    
    .webgl-carousel-prev:disabled,
    .webgl-carousel-next:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .webgl-carousel-prev {
      left: ${NAVIGATION.offset};
    }
    
    .webgl-carousel-next {
      right: ${NAVIGATION.offset};
    }
    
    @media (max-width: 768px) {
      .webgl-carousel-prev,
      .webgl-carousel-next {
        font-size: 1.5rem;
        padding: 0.25rem 0.75rem;
      }
    }
  `;
};

/**
 * Pagination control styles
 */
export const getPaginationStyles = (): string => {
  const { PAGINATION } = CSS_DEFAULTS;
  return `
    .webgl-carousel-pagination {
      position: absolute;
      bottom: ${PAGINATION.bottomOffset};
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: ${PAGINATION.gap};
      z-index: ${PAGINATION.zIndex};
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
      backdrop-filter: blur(5px);
    }
    
    .webgl-carousel-dot {
      width: ${PAGINATION.dotSize};
      height: ${PAGINATION.dotSize};
      border-radius: 50%;
      border: ${PAGINATION.borderWidth} solid white;
      background: transparent;
      cursor: pointer;
      transition: all ${PAGINATION.transitionDuration};
      outline: none;
    }
    
    .webgl-carousel-dot:hover {
      background: rgba(255, 255, 255, 0.5);
      transform: scale(1.2);
    }
    
    .webgl-carousel-dot.active {
      background: white;
      transform: scale(1.2);
    }
    
    .webgl-carousel-dot:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
      .webgl-carousel-pagination {
        gap: 0.25rem;
        padding: 0.25rem;
      }
      
      .webgl-carousel-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-width: 1.5px;
      }
    }
  `;
};

/**
 * Combined carousel styles
 */
export const getCarouselStyles = (): string => {
  return `
    ${getNavigationStyles()}
    ${getPaginationStyles()}
  `;
};

/**
 * Style IDs for management
 */
export const STYLE_IDS = {
  NAVIGATION: 'webgl-carousel-nav-styles',
  PAGINATION: 'webgl-carousel-pagination-styles',
  COMBINED: 'webgl-carousel-styles',
} as const;
