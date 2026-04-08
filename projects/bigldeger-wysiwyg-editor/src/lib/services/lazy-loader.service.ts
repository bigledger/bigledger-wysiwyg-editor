import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';

/**
 * Service for lazy loading components
 */
@Injectable({
  providedIn: 'root'
})
export class LazyLoaderService {
  private loadedComponents = new Map<string, Type<any>>();

  /**
   * Lazy load a dialog component
   */
  async loadDialogComponent(
    componentName: 'link' | 'image' | 'video' | 'color' | 'table',
    viewContainer: ViewContainerRef
  ): Promise<ComponentRef<any> | null> {
    try {
      let componentType = this.loadedComponents.get(componentName);

      if (!componentType) {
        // Dynamically import the component
        if (componentName === 'link') {
          const { LinkDialogComponent } = await import('../components/dialogs/link-dialog/link-dialog.component');
          componentType = LinkDialogComponent;
        } else if (componentName === 'image') {
          const { ImageDialogComponent } = await import('../components/dialogs/image-dialog/image-dialog.component');
          componentType = ImageDialogComponent;
        } else if (componentName === 'video') {
          const { VideoDialogComponent } = await import('../components/dialogs/video-dialog/video-dialog.component');
          componentType = VideoDialogComponent;
        } else if (componentName === 'color') {
          const { ColorPickerDialogComponent } = await import('../components/dialogs/color-picker-dialog/color-picker-dialog.component');
          componentType = ColorPickerDialogComponent;
        } else if (componentName === 'table') {
          const { TableDialogComponent } = await import('../components/dialogs/table-dialog/table-dialog.component');
          componentType = TableDialogComponent;
        }

        if (componentType) {
          this.loadedComponents.set(componentName, componentType);
        }
      }

      if (componentType) {
        return viewContainer.createComponent(componentType);
      }

      return null;
    } catch (error) {
      console.error(`Failed to lazy load ${componentName} dialog:`, error);
      return null;
    }
  }

  /**
   * Clear loaded components cache
   */
  clearCache(): void {
    this.loadedComponents.clear();
  }

  /**
   * Check if component is already loaded
   */
  isComponentLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }
}
