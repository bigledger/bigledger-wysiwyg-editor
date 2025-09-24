import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { DebounceService } from '../../services/debounce.service';
import { LazyLoaderService } from '../../services/lazy-loader.service';
import { AssetOptimizerService } from '../../services/asset-optimizer.service';

@Component({
  template: '<div>Test Component</div>'
})
class TestComponent {}

describe('Performance Optimizations', () => {
  let performanceMonitor: PerformanceMonitorService;
  let debounceService: DebounceService;
  let lazyLoader: LazyLoaderService;
  let assetOptimizer: AssetOptimizerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [
        PerformanceMonitorService,
        DebounceService,
        LazyLoaderService,
        AssetOptimizerService
      ]
    }).compileComponents();

    performanceMonitor = TestBed.inject(PerformanceMonitorService);
    debounceService = TestBed.inject(DebounceService);
    lazyLoader = TestBed.inject(LazyLoaderService);
    assetOptimizer = TestBed.inject(AssetOptimizerService);
  });

  describe('PerformanceMonitorService', () => {
    it('should create', () => {
      expect(performanceMonitor).toBeTruthy();
    });

    it('should start and stop monitoring', () => {
      performanceMonitor.startMonitoring();
      expect(performanceMonitor['isMonitoring']).toBe(true);

      performanceMonitor.stopMonitoring();
      expect(performanceMonitor['isMonitoring']).toBe(false);
    });

    it('should measure benchmark duration', () => {
      const benchmarkName = 'test-benchmark';
      
      performanceMonitor.startBenchmark(benchmarkName);
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = performanceMonitor.endBenchmark(benchmarkName);
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be reasonable
    });

    it('should measure function execution time', () => {
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = performanceMonitor.measureFunction('test-function', testFunction);
      
      expect(result).toBe(499500); // Sum of 0 to 999
      
      const benchmarks = performanceMonitor.getBenchmarkResults();
      const testBenchmark = benchmarks.find(b => b.name === 'test-function');
      
      expect(testBenchmark).toBeTruthy();
      expect(testBenchmark?.duration).toBeGreaterThan(0);
    });

    it('should check performance thresholds', () => {
      // Mock metrics with good performance
      performanceMonitor['metricsSubject'].next({
        renderTime: 50,
        contentChangeLatency: 20,
        memoryUsage: 50,
        bundleSize: 100,
        componentLoadTime: 100,
        timestamp: Date.now()
      });

      const result = performanceMonitor.checkPerformanceThresholds();
      expect(result.passed).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect performance issues', () => {
      // Mock metrics with poor performance
      performanceMonitor['metricsSubject'].next({
        renderTime: 200, // Too high
        contentChangeLatency: 100, // Too high
        memoryUsage: 150, // Too high
        bundleSize: 500,
        componentLoadTime: 300, // Too high
        timestamp: Date.now()
      });

      const result = performanceMonitor.checkPerformanceThresholds();
      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('DebounceService', () => {
    it('should create', () => {
      expect(debounceService).toBeTruthy();
    });

    it('should debounce content changes', (done) => {
      let emissionCount = 0;
      
      debounceService.debouncedContentChange$.subscribe(() => {
        emissionCount++;
      });

      // Emit multiple rapid changes
      debounceService.emitContentChange('content1');
      debounceService.emitContentChange('content2');
      debounceService.emitContentChange('content3');

      // Should only emit once after debounce period
      setTimeout(() => {
        expect(emissionCount).toBe(1);
        done();
      }, 400); // Wait longer than debounce time (300ms)
    });

    it('should create debounced function', (done) => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = debounceService.debounce(testFunction, 100);

      // Call multiple times rapidly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should only execute once
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it('should create throttled function', () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const throttledFunction = debounceService.throttle(testFunction, 100);

      // Call multiple times rapidly
      throttledFunction();
      throttledFunction();
      throttledFunction();

      // Should execute immediately for first call
      expect(callCount).toBe(1);
    });
  });

  describe('LazyLoaderService', () => {
    it('should create', () => {
      expect(lazyLoader).toBeTruthy();
    });

    it('should track loaded components', () => {
      expect(lazyLoader.isComponentLoaded('test-component')).toBe(false);
      
      lazyLoader['loadedComponents'].set('test-component', TestComponent);
      
      expect(lazyLoader.isComponentLoaded('test-component')).toBe(true);
    });

    it('should clear component cache', () => {
      lazyLoader['loadedComponents'].set('test-component', TestComponent);
      expect(lazyLoader.isComponentLoaded('test-component')).toBe(true);
      
      lazyLoader.clearCache();
      expect(lazyLoader.isComponentLoaded('test-component')).toBe(false);
    });
  });

  describe('AssetOptimizerService', () => {
    it('should create', () => {
      expect(assetOptimizer).toBeTruthy();
    });

    it('should minify CSS', () => {
      const css = `
        /* Comment */
        .test {
          color: red;
          margin: 10px;
        }
        
        .another { padding: 5px; }
      `;

      const minified = assetOptimizer.minifyCSS(css);
      
      expect(minified).not.toContain('/* Comment */');
      expect(minified).not.toContain('\n');
      expect(minified.length).toBeLessThan(css.length);
    });

    it('should optimize CSS by removing unused rules', () => {
      const css = '.used{color:red}.unused{color:blue}.also-used{color:green}';
      const usedSelectors = ['used', 'also-used'];
      
      const optimized = assetOptimizer.optimizeCSS(css, usedSelectors);
      
      expect(optimized).toContain('used');
      expect(optimized).toContain('also-used');
      expect(optimized).not.toContain('unused');
    });

    it('should create responsive image srcset', () => {
      const baseUrl = 'https://example.com/image.jpg';
      const sizes = [320, 640, 1024];
      
      const srcset = assetOptimizer.createResponsiveImageSrcSet(baseUrl, sizes);
      
      expect(srcset).toContain('320w');
      expect(srcset).toContain('640w');
      expect(srcset).toContain('1024w');
      expect(srcset).toContain(baseUrl);
    });

    it('should track performance metrics', () => {
      assetOptimizer.loadStyles('test-style', '.test{color:red}');
      assetOptimizer.preloadAsset('test-asset.jpg', 'image');
      
      const metrics = assetOptimizer.getPerformanceMetrics();
      
      expect(metrics.loadedStyles).toBe(1);
      expect(metrics.preloadedAssets).toBe(1);
    });

    it('should cleanup loaded assets', () => {
      assetOptimizer.loadStyles('test-style', '.test{color:red}');
      
      let metrics = assetOptimizer.getPerformanceMetrics();
      expect(metrics.loadedStyles).toBe(1);
      
      assetOptimizer.cleanup();
      
      metrics = assetOptimizer.getPerformanceMetrics();
      expect(metrics.loadedStyles).toBe(0);
    });
  });

  describe('Integration Performance Tests', () => {
    it('should handle rapid content changes efficiently', (done) => {
      let changeCount = 0;
      
      debounceService.debouncedContentChange$.subscribe(() => {
        changeCount++;
      });

      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        debounceService.emitContentChange(`content-${i}`);
      }

      // Should debounce to single emission
      setTimeout(() => {
        expect(changeCount).toBe(1);
        done();
      }, 400);
    });

    it('should benchmark component operations', () => {
      const operations = [
        'bold-command',
        'italic-command',
        'link-creation',
        'image-insertion'
      ];

      operations.forEach(operation => {
        performanceMonitor.startBenchmark(operation);
        
        // Simulate operation work
        const start = performance.now();
        while (performance.now() - start < 5) {
          // Wait 5ms
        }
        
        performanceMonitor.endBenchmark(operation);
      });

      const results = performanceMonitor.getBenchmarkResults();
      expect(results.length).toBe(operations.length);
      
      results.forEach(result => {
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(50); // Should be fast
      });
    });
  });
});