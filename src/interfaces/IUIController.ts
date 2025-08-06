/**
 * Internal interface for UIController
 * Defines internal API for UI controls
 */

/**
 * UI Controller operations
 */
export interface IUIController {
  /**
   * Update pagination to show current index
   * @internal
   */
  updatePagination(index: number): void;

  /**
   * Update total image count
   * @internal
   */
  updateImageCount(count: number): void;

  /**
   * Enable or disable navigation controls
   * @internal
   */
  setNavigationEnabled(enabled: boolean): void;

  /**
   * Enable or disable pagination controls
   * @internal
   */
  setPaginationEnabled(enabled: boolean): void;

  /**
   * Destroy UI controller and clean up resources
   * @internal
   */
  destroy(): void;
}
