import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { BrowserInfo } from '../models/error.interface';

/**
 * Service for handling browser compatibility and feature detection
 * Provides fallback mechanisms for unsupported browser features
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserCompatibilityService {
  private readonly compatibilityStatus = new BehaviorSubject<CompatibilityStatus>({
    supported: true,
    missingFeatures: [],
    warnings: []
  });

  private browserInfo: BrowserInfo | null = null;
  private featureCache = new Map<string, boolean>();
  private polyfillsLoaded = new Set<string>();

  constructor(private errorHandler: ErrorHandlerService) {
    this.initializeCompatibilityCheck();
  }

  /**
   * Observable for compatibility status changes
   */
  get compatibilityStatus$(): Observable<CompatibilityStatus> {
    return this.compatibilityStatus.asObservable();
  }

  /**
   * Get current browser information
   */
  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  /**
   * Check if the current browser is fully supported
   */
  isFullySupported(): boolean {
    return this.compatibilityStatus.value.supported;
  }

  /**
   * Get list of missing features
   */
  getMissingFeatures(): string[] {
    return this.compatibilityStatus.value.missingFeatures;
  }

  /**
   * Get compatibility warnings
   */
  getWarnings(): string[] {
    return this.compatibilityStatus.value.warnings;
  }

  /**
   * Check if a specific feature is supported
   */
  isFeatureSupported(feature: string): boolean {
    if (this.featureCache.has(feature)) {
      return this.featureCache.get(feature)!;
    }

    const supported = this.checkFeatureSupport(feature);
    this.featureCache.set(feature, supported);
    return supported;
  }

  /**
   * Load polyfill for a specific feature
   */
  async loadPolyfill(feature: string): Promise<boolean> {
    if (this.polyfillsLoaded.has(feature)) {
      return true;
    }

    try {
      const loaded = await this.loadFeaturePolyfill(feature);
      if (loaded) {
        this.polyfillsLoaded.add(feature);
        // Re-check feature support after loading polyfill
        this.featureCache.delete(feature);
        this.isFeatureSupported(feature);
      }
      return loaded;
    } catch (error) {
      this.errorHandler.handleBrowserError(
        `polyfill-${feature}`,
        `Failed to load polyfill: ${(error as Error).message}`
      );
      return false;
    }
  }

  /**
   * Get fallback implementation for a feature
   */
  getFallbackImplementation(feature: string): any {
    switch (feature) {
      case 'execCommand':
        return this.getExecCommandFallback();
      case 'getSelection':
        return this.getSelectionFallback();
      case 'createRange':
        return this.getRangeFallback();
      case 'clipboardAPI':
        return this.getClipboardFallback();
      case 'fileAPI':
        return this.getFileAPIFallback();
      default:
        return null;
    }
  }

  /**
   * Apply compatibility fixes for the current browser
   */
  applyCompatibilityFixes(): void {
    const missingFeatures = this.getMissingFeatures();
    
    missingFeatures.forEach(feature => {
      const fallback = this.getFallbackImplementation(feature);
      if (fallback) {
        this.applyFallback(feature, fallback);
      }
    });
  }

  /**
   * Initialize compatibility checking
   */
  private initializeCompatibilityCheck(): void {
    this.detectBrowser();
    this.checkAllFeatures();
    this.updateCompatibilityStatus();
  }

  /**
   * Detect browser information
   */
  private detectBrowser(): void {
    if (typeof navigator === 'undefined') {
      return;
    }

    const userAgent = navigator.userAgent;
    const browserData = this.parseBrowserInfo(userAgent);
    
    this.browserInfo = {
      name: browserData.name,
      version: browserData.version,
      os: this.detectOS(userAgent),
      mobile: this.isMobile(userAgent)
    };
  }

  /**
   * Parse browser information from user agent
   */
  private parseBrowserInfo(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
      { name: 'Edge', pattern: /Edge\/(\d+)/ },
      { name: 'IE', pattern: /MSIE (\d+)|Trident.*rv:(\d+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return {
          name: browser.name,
          version: match[1] || match[2] || 'Unknown'
        };
      }
    }

    return { name: 'Unknown', version: 'Unknown' };
  }

  /**
   * Detect operating system
   */
  private detectOS(userAgent: string): string {
    const osPatterns = [
      { name: 'Windows', pattern: /Windows/ },
      { name: 'macOS', pattern: /Mac OS X/ },
      { name: 'Linux', pattern: /Linux/ },
      { name: 'Android', pattern: /Android/ },
      { name: 'iOS', pattern: /iPhone|iPad/ }
    ];

    for (const os of osPatterns) {
      if (os.pattern.test(userAgent)) {
        return os.name;
      }
    }

    return 'Unknown';
  }

  /**
   * Check if device is mobile
   */
  private isMobile(userAgent: string): boolean {
    return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  /**
   * Check support for all required features
   */
  private checkAllFeatures(): void {
    const requiredFeatures = [
      'execCommand',
      'queryCommandSupported',
      'getSelection',
      'createRange',
      'contentEditable'
    ];

    const optionalFeatures = [
      'clipboardAPI',
      'fileAPI',
      'dragAndDrop',
      'mutationObserver',
      'intersectionObserver'
    ];

    // Check required features
    requiredFeatures.forEach(feature => {
      this.isFeatureSupported(feature);
    });

    // Check optional features
    optionalFeatures.forEach(feature => {
      this.isFeatureSupported(feature);
    });
  }

  /**
   * Check support for a specific feature
   */
  private checkFeatureSupport(feature: string): boolean {
    try {
      switch (feature) {
        case 'execCommand':
          return typeof document.execCommand === 'function';
        
        case 'queryCommandSupported':
          return typeof document.queryCommandSupported === 'function';
        
        case 'getSelection':
          return typeof window.getSelection === 'function';
        
        case 'createRange':
          return typeof document.createRange === 'function';
        
        case 'contentEditable':
          return 'contentEditable' in document.createElement('div');
        
        case 'clipboardAPI':
          return 'clipboard' in navigator && typeof navigator.clipboard.writeText === 'function';
        
        case 'fileAPI':
          return typeof FileReader !== 'undefined' && typeof File !== 'undefined';
        
        case 'dragAndDrop':
          return 'draggable' in document.createElement('div') && 
                 typeof DragEvent !== 'undefined';
        
        case 'mutationObserver':
          return typeof MutationObserver !== 'undefined';
        
        case 'intersectionObserver':
          return typeof IntersectionObserver !== 'undefined';
        
        case 'resizeObserver':
          return typeof ResizeObserver !== 'undefined';
        
        case 'customElements':
          return 'customElements' in window;
        
        case 'shadowDOM':
          return 'attachShadow' in Element.prototype;
        
        default:
          return false;
      }
    } catch (error) {
      this.errorHandler.handleBrowserError(feature, `Feature detection failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Update compatibility status based on feature checks
   */
  private updateCompatibilityStatus(): void {
    const requiredFeatures = ['execCommand', 'getSelection', 'createRange', 'contentEditable'];
    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    // Check required features
    requiredFeatures.forEach(feature => {
      if (!this.isFeatureSupported(feature)) {
        missingFeatures.push(feature);
      }
    });

    // Check for browser-specific issues
    if (this.browserInfo) {
      const browserWarnings = this.getBrowserSpecificWarnings(this.browserInfo);
      warnings.push(...browserWarnings);
    }

    const supported = missingFeatures.length === 0;

    this.compatibilityStatus.next({
      supported,
      missingFeatures,
      warnings
    });
  }

  /**
   * Get browser-specific warnings
   */
  private getBrowserSpecificWarnings(browserInfo: BrowserInfo): string[] {
    const warnings: string[] = [];
    const version = parseInt(browserInfo.version);

    switch (browserInfo.name) {
      case 'IE':
        warnings.push('Internet Explorer is not fully supported. Consider upgrading to a modern browser.');
        break;
      
      case 'Chrome':
        if (version < 80) {
          warnings.push('Chrome version is outdated. Some features may not work correctly.');
        }
        break;
      
      case 'Firefox':
        if (version < 75) {
          warnings.push('Firefox version is outdated. Some features may not work correctly.');
        }
        break;
      
      case 'Safari':
        if (version < 13) {
          warnings.push('Safari version is outdated. Some features may not work correctly.');
        }
        if (browserInfo.mobile) {
          warnings.push('Mobile Safari has limited clipboard API support.');
        }
        break;
    }

    return warnings;
  }

  /**
   * Load polyfill for a specific feature
   */
  private async loadFeaturePolyfill(feature: string): Promise<boolean> {
    // This is a simplified implementation
    // In a real application, you would load actual polyfill scripts
    switch (feature) {
      case 'mutationObserver':
        return this.loadMutationObserverPolyfill();
      
      case 'intersectionObserver':
        return this.loadIntersectionObserverPolyfill();
      
      case 'resizeObserver':
        return this.loadResizeObserverPolyfill();
      
      default:
        return false;
    }
  }

  /**
   * Load MutationObserver polyfill
   */
  private async loadMutationObserverPolyfill(): Promise<boolean> {
    if (typeof MutationObserver !== 'undefined') {
      return true;
    }

    try {
      // In a real implementation, you would load the actual polyfill
      // For now, we'll just return false to indicate it's not available
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load IntersectionObserver polyfill
   */
  private async loadIntersectionObserverPolyfill(): Promise<boolean> {
    if (typeof IntersectionObserver !== 'undefined') {
      return true;
    }

    try {
      // In a real implementation, you would load the actual polyfill
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load ResizeObserver polyfill
   */
  private async loadResizeObserverPolyfill(): Promise<boolean> {
    if (typeof ResizeObserver !== 'undefined') {
      return true;
    }

    try {
      // In a real implementation, you would load the actual polyfill
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get execCommand fallback implementation
   */
  private getExecCommandFallback(): any {
    return {
      execute: (command: string, showUI: boolean, value?: string) => {
        // Simplified fallback - would need full implementation
        console.warn(`execCommand fallback not fully implemented for: ${command}`);
        return false;
      }
    };
  }

  /**
   * Get Selection API fallback
   */
  private getSelectionFallback(): any {
    return {
      getSelection: () => {
        // Simplified fallback for older browsers
        if (document.getSelection) {
          return document.getSelection();
        }
        return null;
      }
    };
  }

  /**
   * Get Range API fallback
   */
  private getRangeFallback(): any {
    return {
      createRange: () => {
        if (document.createRange) {
          return document.createRange();
        }
        return null;
      }
    };
  }

  /**
   * Get Clipboard API fallback
   */
  private getClipboardFallback(): any {
    return {
      writeText: async (text: string) => {
        // Fallback to execCommand for older browsers
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          return success;
        } catch (error) {
          throw new Error('Clipboard operation failed');
        }
      },
      readText: async () => {
        throw new Error('Reading from clipboard not supported in fallback mode');
      }
    };
  }

  /**
   * Get File API fallback
   */
  private getFileAPIFallback(): any {
    return {
      readAsDataURL: (file: File) => {
        return new Promise((resolve, reject) => {
          // Simplified fallback - would need more robust implementation
          reject(new Error('File API not supported'));
        });
      }
    };
  }

  /**
   * Apply fallback implementation for a feature
   */
  private applyFallback(feature: string, fallback: any): void {
    try {
      switch (feature) {
        case 'execCommand':
          if (!document.execCommand) {
            (document as any).execCommand = fallback.execute;
          }
          break;
        
        case 'getSelection':
          if (!window.getSelection) {
            (window as any).getSelection = fallback.getSelection;
          }
          break;
        
        case 'createRange':
          if (!document.createRange) {
            (document as any).createRange = fallback.createRange;
          }
          break;
        
        case 'clipboardAPI':
          if (!navigator.clipboard) {
            (navigator as any).clipboard = fallback;
          }
          break;
      }
    } catch (error) {
      this.errorHandler.handleBrowserError(
        `fallback-${feature}`,
        `Failed to apply fallback: ${(error as Error).message}`
      );
    }
  }
}

/**
 * Interface for compatibility status
 */
export interface CompatibilityStatus {
  supported: boolean;
  missingFeatures: string[];
  warnings: string[];
}