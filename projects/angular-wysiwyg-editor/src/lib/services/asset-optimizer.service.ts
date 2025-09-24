import { Injectable } from '@angular/core';

/**
 * Service for optimizing CSS and asset loading
 */
@Injectable({
  providedIn: 'root'
})
export class AssetOptimizerService {
  private loadedStyles = new Set<string>();
  private preloadedAssets = new Set<string>();

  /**
   * Lazy load CSS styles
   */
  loadStyles(styleId: string, cssContent: string): void {
    if (this.loadedStyles.has(styleId)) {
      return; // Already loaded
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssContent;
    document.head.appendChild(style);
    
    this.loadedStyles.add(styleId);
  }

  /**
   * Preload critical assets
   */
  preloadAsset(url: string, type: 'image' | 'font' | 'style' = 'image'): void {
    if (this.preloadedAssets.has(url)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
      case 'style':
        link.as = 'style';
        break;
    }

    document.head.appendChild(link);
    this.preloadedAssets.add(url);
  }

  /**
   * Load image with optimization
   */
  loadOptimizedImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set loading attribute for lazy loading
      img.loading = 'lazy';
      
      // Set decode attribute for better performance
      img.decoding = 'async';
      
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Optimize CSS by removing unused rules (basic implementation)
   */
  optimizeCSS(css: string, usedSelectors: string[]): string {
    if (!usedSelectors.length) {
      return css;
    }

    // Basic CSS optimization - remove rules not in usedSelectors
    const rules = css.split('}');
    const optimizedRules = rules.filter(rule => {
      if (!rule.trim()) return false;
      
      const selector = rule.split('{')[0]?.trim();
      if (!selector) return false;
      
      return usedSelectors.some(used => 
        selector.includes(used) || used.includes(selector)
      );
    });

    return optimizedRules.join('}');
  }

  /**
   * Create CSS with critical styles inline and non-critical lazy loaded
   */
  loadCriticalCSS(criticalCSS: string, nonCriticalCSS: string, styleId: string): void {
    // Load critical CSS immediately
    if (criticalCSS) {
      this.loadStyles(`${styleId}-critical`, criticalCSS);
    }

    // Load non-critical CSS after page load
    if (nonCriticalCSS) {
      if (document.readyState === 'complete') {
        this.loadStyles(`${styleId}-non-critical`, nonCriticalCSS);
      } else {
        window.addEventListener('load', () => {
          this.loadStyles(`${styleId}-non-critical`, nonCriticalCSS);
        });
      }
    }
  }

  /**
   * Minify CSS (basic implementation)
   */
  minifyCSS(css: string): string {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around certain characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      .trim();
  }

  /**
   * Create responsive image srcset
   */
  createResponsiveImageSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }

  /**
   * Cleanup loaded assets
   */
  cleanup(): void {
    // Remove dynamically loaded styles
    this.loadedStyles.forEach(styleId => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    });

    this.loadedStyles.clear();
    this.preloadedAssets.clear();
  }

  /**
   * Get performance metrics for loaded assets
   */
  getPerformanceMetrics(): {
    loadedStyles: number;
    preloadedAssets: number;
    memoryUsage?: number;
  } {
    return {
      loadedStyles: this.loadedStyles.size,
      preloadedAssets: this.preloadedAssets.size,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }
}