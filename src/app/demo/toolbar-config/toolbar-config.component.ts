import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-toolbar-config',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Toolbar Configuration</h1>
        <p>Customize the editor toolbar with different tool configurations</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>Minimal Toolbar</h2>
        <p>A simple toolbar with only essential formatting tools</p>
        
        <div class="demo-result">
          <div class="mock-editor">
            <div class="mock-toolbar">
              <button class="mock-btn active">B</button>
              <button class="mock-btn">I</button>
              <button class="mock-btn">🔗</button>
            </div>
            <div class="mock-content">
              <p>Minimal toolbar editor...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Standard Toolbar</h2>
        <p>A comprehensive toolbar with common formatting options</p>
        
        <div class="demo-result">
          <div class="mock-editor">
            <div class="mock-toolbar">
              <button class="mock-btn">B</button>
              <button class="mock-btn active">I</button>
              <button class="mock-btn">U</button>
              <div class="separator"></div>
              <select class="mock-select">
                <option>Paragraph</option>
                <option>Heading 1</option>
              </select>
              <div class="separator"></div>
              <button class="mock-btn">•</button>
              <button class="mock-btn">1.</button>
              <div class="separator"></div>
              <button class="mock-btn">🔗</button>
              <button class="mock-btn">📷</button>
            </div>
            <div class="mock-content">
              <p>Standard toolbar editor...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Full-Featured Toolbar</h2>
        <p>A complete toolbar with all available formatting tools</p>
        
        <div class="demo-result">
          <div class="mock-editor">
            <div class="mock-toolbar full">
              <button class="mock-btn">↶</button>
              <button class="mock-btn">↷</button>
              <div class="separator"></div>
              <button class="mock-btn">B</button>
              <button class="mock-btn">I</button>
              <button class="mock-btn">U</button>
              <button class="mock-btn">S</button>
              <div class="separator"></div>
              <select class="mock-select small">
                <option>Arial</option>
              </select>
              <select class="mock-select small">
                <option>14px</option>
              </select>
              <div class="separator"></div>
              <button class="mock-btn">A</button>
              <button class="mock-btn">🎨</button>
              <div class="separator"></div>
              <button class="mock-btn">⬅</button>
              <button class="mock-btn">⬌</button>
              <button class="mock-btn">➡</button>
              <div class="separator"></div>
              <button class="mock-btn">•</button>
              <button class="mock-btn">1.</button>
              <div class="separator"></div>
              <button class="mock-btn">🔗</button>
              <button class="mock-btn">📷</button>
              <button class="mock-btn">⊞</button>
            </div>
            <div class="mock-content">
              <p>Full-featured toolbar editor...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/basic" class="next-card">
            <h4>Basic Usage</h4>
            <p>Learn the fundamentals of the editor</p>
          </a>
          <a routerLink="/forms" class="next-card">
            <h4>Forms Integration</h4>
            <p>Integrate with Angular forms</p>
          </a>
          <a routerLink="/events" class="next-card">
            <h4>Event Handling</h4>
            <p>Handle editor events and interactions</p>
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

    .mock-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .mock-toolbar {
      background: #f8f9fa;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .mock-toolbar.full {
      padding: 10px;
      gap: 6px;
      flex-wrap: wrap;
    }

    .mock-btn {
      padding: 6px 10px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mock-btn:hover {
      background: #e9ecef;
    }

    .mock-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .mock-select {
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: white;
      font-size: 12px;
      min-width: 80px;
    }

    .mock-select.small {
      min-width: 60px;
      font-size: 11px;
    }

    .separator {
      width: 1px;
      height: 20px;
      background: #ddd;
      margin: 0 4px;
    }

    .mock-content {
      min-height: 120px;
      padding: 12px;
      outline: none;
      color: #666;
      font-style: italic;
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
      
      .mock-toolbar.full {
        flex-direction: column;
        align-items: stretch;
      }
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ToolbarConfigComponent {
}