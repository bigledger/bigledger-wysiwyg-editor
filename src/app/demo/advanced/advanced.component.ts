import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';

@Component({
  selector: 'app-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Advanced Features</h1>
        <p>Performance optimization, security, and advanced functionality</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>Performance Monitoring</h2>
        <p>Monitor editor performance and optimize for better user experience:</p>
        
        <div class="demo-result">
          <div class="performance-dashboard">
            <div class="metric-card">
              <h4>Render Performance</h4>
              <div class="metric-value">{{ renderTime.toFixed(2) }}ms</div>
              <div class="metric-label">Average render time</div>
            </div>
            
            <div class="metric-card">
              <h4>Memory Usage</h4>
              <div class="metric-value">{{ memoryUsage.toFixed(1) }}MB</div>
              <div class="metric-label">Current memory usage</div>
            </div>
            
            <div class="metric-card">
              <h4>Operations/sec</h4>
              <div class="metric-value">{{ operationsPerSecond }}</div>
              <div class="metric-label">Editor operations</div>
            </div>
            
            <div class="metric-card">
              <h4>Bundle Size</h4>
              <div class="metric-value">{{ bundleSize }}KB</div>
              <div class="metric-label">Optimized bundle</div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Content Security & Sanitization</h2>
        <p>Protect against XSS attacks with built-in HTML sanitization:</p>
        
        <div class="demo-result">
          <div class="security-demo">
            <div class="security-test">
              <h4>Security Test</h4>
              <p>Try pasting potentially dangerous HTML:</p>
              <textarea 
                [(ngModel)]="dangerousHtml" 
                placeholder="Paste HTML with scripts, iframes, etc."
                class="security-input">
              </textarea>
              <button (click)="testSecurity()" class="test-btn">Test Security</button>
            </div>
            
            <div class="security-results">
              <div class="result-section">
                <h5>Original HTML:</h5>
                <pre class="code-block dangerous">{{ dangerousHtml || 'No input' }}</pre>
              </div>
              
              <div class="result-section">
                <h5>Sanitized HTML:</h5>
                <pre class="code-block safe">{{ sanitizedHtml || 'No output' }}</pre>
              </div>
              
              <div class="security-status" [class]="securityStatusClass">
                <strong>{{ securityStatus }}</strong>
                <ul *ngIf="securityIssues.length > 0">
                  <li *ngFor="let issue of securityIssues">{{ issue }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Memory Management</h2>
        <p>Prevent memory leaks and optimize resource usage:</p>
        
        <div class="demo-result">
          <div class="memory-monitor">
            <div class="memory-stats">
              <div class="memory-gauge">
                <div class="gauge-container">
                  <div class="gauge-fill" [style.width.%]="memoryUsagePercent"></div>
                </div>
                <div class="gauge-label">Memory Usage: {{ memoryUsage.toFixed(1) }}MB</div>
              </div>
              
              <div class="memory-actions">
                <button (click)="simulateMemoryLoad()" class="action-btn">Simulate Load</button>
                <button (click)="cleanupMemory()" class="action-btn cleanup">Cleanup</button>
                <button (click)="forceGC()" class="action-btn gc">Force GC</button>
              </div>
            </div>
            
            <div class="memory-tips">
              <h5>Memory Optimization Tips:</h5>
              <ul>
                <li>Limit content history size</li>
                <li>Use OnPush change detection</li>
                <li>Unsubscribe from observables</li>
                <li>Clear DOM references</li>
                <li>Lazy load heavy components</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Plugin Architecture</h2>
        <p>Extend editor functionality with custom plugins:</p>
        
        <div class="demo-result">
          <div class="plugin-demo">
            <div class="plugin-manager">
              <h4>Available Plugins</h4>
              <div class="plugin-list">
                <div *ngFor="let plugin of availablePlugins" class="plugin-item">
                  <div class="plugin-info">
                    <span class="plugin-name">{{ plugin.name }}</span>
                    <span class="plugin-version">v{{ plugin.version }}</span>
                  </div>
                  <div class="plugin-controls">
                    <button 
                      (click)="togglePlugin(plugin)"
                      [class.active]="plugin.enabled"
                      class="plugin-toggle">
                      {{ plugin.enabled ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="plugin-output">
              <h4>Plugin Output</h4>
              <div class="output-item" *ngFor="let output of pluginOutputs">
                <span class="output-label">{{ output.label }}:</span>
                <span class="output-value">{{ output.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/basic" class="next-card">
            <h4>Basic Usage</h4>
            <p>Start with simple editor implementation</p>
          </a>
          <a routerLink="/forms" class="next-card">
            <h4>Forms Integration</h4>
            <p>Integrate with Angular forms</p>
          </a>
          <a routerLink="/styling" class="next-card">
            <h4>Styling & Theming</h4>
            <p>Customize editor appearance</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .demo-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .demo-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .demo-nav {
      margin-top: 1rem;
    }

    .nav-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .nav-link:hover {
      text-decoration: underline;
    }

    .demo-section {
      margin-bottom: 3rem;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .demo-section h2 {
      color: #333;
      margin-bottom: 1rem;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .demo-section p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .demo-result {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1.5rem;
      background: #f8f9fa;
    }

    .performance-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .metric-card h4 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #666;
    }

    .security-demo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .security-test {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .security-test h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .security-input {
      width: 100%;
      height: 100px;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.875rem;
      resize: vertical;
    }

    .test-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .security-results {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .result-section {
      margin-bottom: 1.5rem;
    }

    .result-section h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 0.875rem;
    }

    .code-block {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 100px;
      overflow-y: auto;
    }

    .code-block.dangerous {
      border-left: 4px solid #dc3545;
    }

    .code-block.safe {
      border-left: 4px solid #28a745;
    }

    .security-status {
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .security-status.safe {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .security-status.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .security-status.danger {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .memory-monitor {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .memory-stats {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .memory-gauge {
      margin-bottom: 2rem;
    }

    .gauge-container {
      width: 100%;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .gauge-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745 0%, #ffc107 50%, #dc3545 100%);
      transition: width 0.3s ease;
    }

    .gauge-label {
      text-align: center;
      font-size: 0.875rem;
      color: #666;
    }

    .memory-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .action-btn.cleanup {
      background: #ffc107;
      border-color: #ffc107;
      color: white;
    }

    .action-btn.gc {
      background: #dc3545;
      border-color: #dc3545;
      color: white;
    }

    .memory-tips {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .memory-tips h5 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .memory-tips ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .memory-tips li {
      margin-bottom: 0.5rem;
      color: #666;
    }

    .plugin-demo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .plugin-manager {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .plugin-manager h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .plugin-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .plugin-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }

    .plugin-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .plugin-name {
      font-weight: 500;
      color: #333;
    }

    .plugin-version {
      font-size: 0.75rem;
      color: #666;
    }

    .plugin-toggle {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .plugin-toggle.active {
      background: #28a745;
      color: white;
      border-color: #28a745;
    }

    .plugin-output {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
    }

    .plugin-output h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .output-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .output-label {
      font-weight: 500;
      color: #333;
    }

    .output-value {
      font-family: monospace;
      color: #666;
    }

    .next-steps {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      margin-top: 3rem;
    }

    .next-steps h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .next-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .next-card {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .next-card:hover {
      transform: translateY(-2px);
    }

    .next-card h4 {
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .next-card p {
      color: #666;
      margin: 0;
    }

    @media (max-width: 768px) {
      .demo-section {
        padding: 1rem;
      }
      
      .performance-dashboard {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      
      .security-demo {
        grid-template-columns: 1fr;
      }
      
      .memory-monitor {
        grid-template-columns: 1fr;
      }
      
      .plugin-demo {
        grid-template-columns: 1fr;
      }
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdvancedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Performance metrics
  renderTime = 15.2;
  memoryUsage = 42.5;
  memoryUsagePercent = 42.5;
  operationsPerSecond = 58;
  bundleSize = 75;

  // Security demo
  dangerousHtml = '';
  sanitizedHtml = '';
  securityStatus = 'No input to test';
  securityStatusClass = 'safe';
  securityIssues: string[] = [];

  // Plugin demo
  availablePlugins = [
    { name: 'Word Count', version: '1.0.0', enabled: true },
    { name: 'Auto Save', version: '1.2.1', enabled: true },
    { name: 'Spell Check', version: '2.0.0', enabled: false },
    { name: 'Grammar Check', version: '1.5.0', enabled: false },
    { name: 'Export PDF', version: '1.1.0', enabled: false }
  ];

  pluginOutputs = [
    { label: 'Word Count', value: '247 words' },
    { label: 'Character Count', value: '1,423 characters' },
    { label: 'Last Saved', value: '2 minutes ago' }
  ];

  ngOnInit() {
    this.startPerformanceMonitoring();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPerformanceMonitoring() {
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePerformanceMetrics();
      });
  }

  private updatePerformanceMetrics() {
    this.renderTime = Math.random() * 20 + 10;
    
    if ((performance as any).memory) {
      this.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    } else {
      this.memoryUsage = Math.random() * 50 + 20;
    }
    this.memoryUsagePercent = Math.min((this.memoryUsage / 100) * 100, 100);
    
    this.operationsPerSecond = Math.floor(Math.random() * 20) + 40;
  }

  testSecurity() {
    if (!this.dangerousHtml.trim()) {
      this.securityStatus = 'No input to test';
      this.securityStatusClass = 'safe';
      this.sanitizedHtml = '';
      this.securityIssues = [];
      return;
    }

    this.securityIssues = [];
    let sanitized = this.dangerousHtml;

    const dangerousPatterns = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, issue: 'Script tags removed' },
      { pattern: /<iframe\b[^>]*>/gi, issue: 'Iframe tags removed' },
      { pattern: /javascript:/gi, issue: 'JavaScript URLs removed' },
      { pattern: /on\w+\s*=/gi, issue: 'Event handlers removed' },
      { pattern: /<object\b[^>]*>/gi, issue: 'Object tags removed' },
      { pattern: /<embed\b[^>]*>/gi, issue: 'Embed tags removed' }
    ];

    dangerousPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(sanitized)) {
        this.securityIssues.push(issue);
        sanitized = sanitized.replace(pattern, '');
      }
    });

    this.sanitizedHtml = sanitized;

    if (this.securityIssues.length > 0) {
      this.securityStatus = `${this.securityIssues.length} security issue(s) found and resolved`;
      this.securityStatusClass = 'warning';
    } else {
      this.securityStatus = 'Content is safe';
      this.securityStatusClass = 'safe';
    }
  }

  simulateMemoryLoad() {
    this.memoryUsage += Math.random() * 10 + 5;
    this.memoryUsagePercent = Math.min((this.memoryUsage / 100) * 100, 100);
  }

  cleanupMemory() {
    this.memoryUsage = Math.max(this.memoryUsage - Math.random() * 15 - 5, 10);
    this.memoryUsagePercent = Math.min((this.memoryUsage / 100) * 100, 100);
  }

  forceGC() {
    if ((window as any).gc) {
      (window as any).gc();
    }
    this.memoryUsage = Math.max(this.memoryUsage - Math.random() * 20 - 10, 5);
    this.memoryUsagePercent = Math.min((this.memoryUsage / 100) * 100, 100);
  }

  togglePlugin(plugin: any) {
    plugin.enabled = !plugin.enabled;
    this.updatePluginOutputs();
  }

  private updatePluginOutputs() {
    this.pluginOutputs = [];
    
    this.availablePlugins.forEach(plugin => {
      if (plugin.enabled) {
        switch (plugin.name) {
          case 'Word Count':
            this.pluginOutputs.push({ label: 'Word Count', value: `${Math.floor(Math.random() * 500) + 100} words` });
            this.pluginOutputs.push({ label: 'Character Count', value: `${Math.floor(Math.random() * 3000) + 500} characters` });
            break;
          case 'Auto Save':
            this.pluginOutputs.push({ label: 'Last Saved', value: `${Math.floor(Math.random() * 10) + 1} minutes ago` });
            break;
          case 'Spell Check':
            this.pluginOutputs.push({ label: 'Spelling Errors', value: `${Math.floor(Math.random() * 5)} found` });
            break;
          case 'Grammar Check':
            this.pluginOutputs.push({ label: 'Grammar Issues', value: `${Math.floor(Math.random() * 3)} found` });
            break;
          case 'Export PDF':
            this.pluginOutputs.push({ label: 'Export Status', value: 'Ready' });
            break;
        }
      }
    });
  }
}