#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Performance benchmark script for the WYSIWYG editor
 */
class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      buildTime: {},
      testPerformance: {},
      memoryUsage: {}
    };
  }

  /**
   * Run all performance benchmarks
   */
  async runAll() {
    console.log('🚀 Starting Performance Benchmarks...\n');

    try {
      await this.measureBuildTime();
      await this.measureBundleSize();
      await this.runPerformanceTests();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Measure build time
   */
  async measureBuildTime() {
    console.log('⏱️  Measuring build time...');
    
    const startTime = Date.now();
    
    try {
      execSync('npm run build:lib', { stdio: 'pipe' });
      const buildTime = Date.now() - startTime;
      
      this.results.buildTime = {
        total: buildTime,
        status: buildTime < 30000 ? 'PASS' : 'WARN', // 30 seconds threshold
        threshold: 30000
      };
      
      console.log(`   Build completed in ${buildTime}ms`);
    } catch (error) {
      this.results.buildTime = {
        total: -1,
        status: 'FAIL',
        error: error.message
      };
    }
  }

  /**
   * Measure bundle size
   */
  async measureBundleSize() {
    console.log('📦 Measuring bundle size...');
    
    const distPath = path.join(__dirname, '../dist/bigldeger-wysiwyg-editor');
    
    if (!fs.existsSync(distPath)) {
      console.log('   No build found, skipping bundle size check');
      return;
    }

    try {
      const bundleFiles = this.getBundleFiles(distPath);
      const totalSize = this.calculateTotalSize(bundleFiles);
      
      this.results.bundleSize = {
        total: totalSize,
        files: bundleFiles,
        status: totalSize < 250000 ? 'PASS' : 'WARN', // 250KB threshold
        threshold: 250000
      };
      
      console.log(`   Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
      
      // Log individual file sizes
      bundleFiles.forEach(file => {
        console.log(`   - ${file.name}: ${(file.size / 1024).toFixed(2)}KB`);
      });
      
    } catch (error) {
      this.results.bundleSize = {
        total: -1,
        status: 'FAIL',
        error: error.message
      };
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('🧪 Running performance tests...');
    
    try {
      const testOutput = execSync('npm run perf:test', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse test results (simplified)
      const testsPassed = testOutput.includes('✓') || testOutput.includes('PASS');
      const testsCount = (testOutput.match(/✓/g) || []).length;
      
      this.results.testPerformance = {
        passed: testsPassed,
        count: testsCount,
        status: testsPassed ? 'PASS' : 'FAIL',
        output: testOutput.substring(0, 500) // Truncate for report
      };
      
      console.log(`   Performance tests: ${testsPassed ? 'PASSED' : 'FAILED'} (${testsCount} tests)`);
      
    } catch (error) {
      this.results.testPerformance = {
        passed: false,
        status: 'FAIL',
        error: error.message
      };
    }
  }

  /**
   * Get bundle files information
   */
  getBundleFiles(distPath) {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else if (item.endsWith('.js') || item.endsWith('.mjs') || item.endsWith('.css')) {
          files.push({
            name: path.relative(distPath, itemPath),
            size: stat.size,
            type: path.extname(item)
          });
        }
      });
    };
    
    scanDirectory(distPath);
    return files;
  }

  /**
   * Calculate total bundle size
   */
  calculateTotalSize(files) {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    console.log('\n📊 Generating Performance Report...\n');
    
    const report = this.createTextReport();
    const jsonReport = JSON.stringify(this.results, null, 2);
    
    // Write reports
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(reportsDir, 'performance-report.txt'), report);
    fs.writeFileSync(path.join(reportsDir, 'performance-report.json'), jsonReport);
    
    console.log(report);
    console.log(`\n📁 Reports saved to: ${reportsDir}`);
    
    // Exit with appropriate code
    const hasFailures = Object.values(this.results).some(result => 
      result.status === 'FAIL'
    );
    
    if (hasFailures) {
      console.log('\n❌ Some benchmarks failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All benchmarks passed!');
    }
  }

  /**
   * Create text report
   */
  createTextReport() {
    const { buildTime, bundleSize, testPerformance } = this.results;
    
    return `
🚀 WYSIWYG Editor Performance Report
Generated: ${this.results.timestamp}

📊 BUILD PERFORMANCE
Status: ${buildTime.status}
Build Time: ${buildTime.total > 0 ? `${buildTime.total}ms` : 'FAILED'}
Threshold: ${buildTime.threshold}ms
${buildTime.error ? `Error: ${buildTime.error}` : ''}

📦 BUNDLE SIZE
Status: ${bundleSize.status}
Total Size: ${bundleSize.total > 0 ? `${(bundleSize.total / 1024).toFixed(2)}KB` : 'FAILED'}
Threshold: ${(bundleSize.threshold / 1024).toFixed(2)}KB
Files: ${bundleSize.files ? bundleSize.files.length : 0}
${bundleSize.error ? `Error: ${bundleSize.error}` : ''}

🧪 PERFORMANCE TESTS
Status: ${testPerformance.status}
Tests Passed: ${testPerformance.passed ? 'YES' : 'NO'}
Test Count: ${testPerformance.count || 0}
${testPerformance.error ? `Error: ${testPerformance.error}` : ''}

📈 RECOMMENDATIONS
${this.generateRecommendations()}
`;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.buildTime.status === 'WARN') {
      recommendations.push('- Consider optimizing build process or reducing dependencies');
    }
    
    if (this.results.bundleSize.status === 'WARN') {
      recommendations.push('- Bundle size is large, consider code splitting or tree shaking');
    }
    
    if (this.results.testPerformance.status === 'FAIL') {
      recommendations.push('- Performance tests are failing, review test results');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Performance looks good! 🎉');
    }
    
    return recommendations.join('\n');
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAll().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceBenchmark;