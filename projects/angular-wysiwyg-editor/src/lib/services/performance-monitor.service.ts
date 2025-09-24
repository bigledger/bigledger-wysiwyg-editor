import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface for performance metrics
 */
export interface PerformanceMetrics {
  renderTime: number;
  contentChangeLatency: number;
  memoryUsage: number;
  bundleSize: number;
  componentLoadTime: number;
  timestamp: number;
}

/**
 * Interface for performance benchmarks
 */
export interface PerformanceBenchmark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

/**
 * Service for monitoring and benchmarking performance
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics | null>(null);
  private benchmarks = new Map<string, PerformanceBenchmark>();
  private isMonitoring = false;

  /**
   * Observable for performance metrics
   */
  get metrics$(): Observable<PerformanceMetrics | null> {
    return this.metricsSubject.asObservable();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.collectMetrics();

    // Collect metrics periodically
    setInterval(() => {
      if (this.isMonitoring) {
        this.collectMetrics();
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Start a performance benchmark
   */
  startBenchmark(name: string, metadata?: any): void {
    const benchmark: PerformanceBenchmark = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.benchmarks.set(name, benchmark);
  }

  /**
   * End a performance benchmark
   */
  endBenchmark(name: string): number | null {
    const benchmark = this.benchmarks.get(name);
    
    if (!benchmark) {
      console.warn(`Benchmark '${name}' not found`);
      return null;
    }

    benchmark.endTime = performance.now();
    benchmark.duration = benchmark.endTime - benchmark.startTime;

    console.log(`Benchmark '${name}': ${benchmark.duration.toFixed(2)}ms`, benchmark.metadata);
    
    return benchmark.duration;
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    this.startBenchmark(name);
    const result = fn();
    this.endBenchmark(name);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startBenchmark(name);
    const result = await fn();
    this.endBenchmark(name);
    return result;
  }

  /**
   * Get all benchmark results
   */
  getBenchmarkResults(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values())
      .filter(benchmark => benchmark.duration !== undefined);
  }

  /**
   * Clear all benchmarks
   */
  clearBenchmarks(): void {
    this.benchmarks.clear();
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      renderTime: this.measureRenderTime(),
      contentChangeLatency: this.getAverageLatency('contentChange'),
      memoryUsage: this.getMemoryUsage(),
      bundleSize: this.getBundleSize(),
      componentLoadTime: this.getAverageLatency('componentLoad'),
      timestamp: Date.now()
    };

    this.metricsSubject.next(metrics);
  }

  /**
   * Measure render time using Performance Observer
   */
  private measureRenderTime(): number {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstContentfulPaint = paintEntries.find(entry => 
        entry.name === 'first-contentful-paint'
      );
      
      return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get average latency for a specific operation
   */
  private getAverageLatency(operation: string): number {
    const operationBenchmarks = Array.from(this.benchmarks.values())
      .filter(benchmark => 
        benchmark.name.includes(operation) && 
        benchmark.duration !== undefined
      );

    if (operationBenchmarks.length === 0) {
      return 0;
    }

    const totalDuration = operationBenchmarks.reduce(
      (sum, benchmark) => sum + (benchmark.duration || 0), 
      0
    );

    return totalDuration / operationBenchmarks.length;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    try {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate bundle size (simplified)
   */
  private getBundleSize(): number {
    try {
      // This is a simplified estimation
      // In a real implementation, you'd get this from build tools
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;

      scripts.forEach(script => {
        // Estimate based on script count and average size
        totalSize += 50; // KB estimate per script
      });

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    const metrics = this.metricsSubject.value;
    const benchmarks = this.getBenchmarkResults();

    console.group('🚀 WYSIWYG Editor Performance Summary');
    
    if (metrics) {
      console.log('📊 Current Metrics:');
      console.table(metrics);
    }

    if (benchmarks.length > 0) {
      console.log('⏱️ Benchmark Results:');
      console.table(benchmarks.map(b => ({
        name: b.name,
        duration: `${b.duration?.toFixed(2)}ms`,
        metadata: JSON.stringify(b.metadata || {})
      })));
    }

    console.groupEnd();
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  checkPerformanceThresholds(): {
    passed: boolean;
    issues: string[];
  } {
    const metrics = this.metricsSubject.value;
    const issues: string[] = [];

    if (!metrics) {
      return { passed: false, issues: ['No metrics available'] };
    }

    // Define thresholds
    const thresholds = {
      renderTime: 100, // ms
      contentChangeLatency: 50, // ms
      memoryUsage: 100, // MB
      componentLoadTime: 200 // ms
    };

    if (metrics.renderTime > thresholds.renderTime) {
      issues.push(`Render time too high: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.contentChangeLatency > thresholds.contentChangeLatency) {
      issues.push(`Content change latency too high: ${metrics.contentChangeLatency.toFixed(2)}ms`);
    }

    if (metrics.memoryUsage > thresholds.memoryUsage) {
      issues.push(`Memory usage too high: ${metrics.memoryUsage.toFixed(2)}MB`);
    }

    if (metrics.componentLoadTime > thresholds.componentLoadTime) {
      issues.push(`Component load time too high: ${metrics.componentLoadTime.toFixed(2)}ms`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    metrics: PerformanceMetrics | null;
    benchmarks: PerformanceBenchmark[];
    timestamp: number;
  } {
    return {
      metrics: this.metricsSubject.value,
      benchmarks: this.getBenchmarkResults(),
      timestamp: Date.now()
    };
  }
}