import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-styling',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Styling & Theming</h1>
        <p>Customize the editor appearance with CSS variables and themes</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>CSS Variables</h2>
        <p>Use CSS variables to customize the editor appearance:</p>
        
        <div class="demo-result">
          <div class="mock-editor custom-border">
            <div class="mock-toolbar gradient">
              <button class="mock-btn">B</button>
              <button class="mock-btn">I</button>
              <button class="mock-btn">U</button>
              <button class="mock-btn">🔗</button>
              <button class="mock-btn">📷</button>
            </div>
            <div class="mock-content">
              <p>Editor with custom CSS variables</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Dark Theme</h2>
        <p>Create a dark theme using CSS variables:</p>
        
        <div class="demo-result">
          <div class="mock-editor dark-theme">
            <div class="mock-toolbar dark">
              <button class="mock-btn dark">B</button>
              <button class="mock-btn dark">I</button>
              <button class="mock-btn dark">U</button>
              <button class="mock-btn dark">🔗</button>
              <button class="mock-btn dark">📷</button>
            </div>
            <div class="mock-content">
              <p>Dark theme editor</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Theme Switcher</h2>
        <p>Allow users to switch between different themes:</p>
        
        <div class="demo-result">
          <div class="theme-switcher-demo">
            <div class="theme-controls">
              <h4>Choose Theme:</h4>
              <div class="theme-options">
                <button 
                  *ngFor="let theme of themes" 
                  (click)="currentTheme = theme.name"
                  [class.active]="currentTheme === theme.name"
                  class="theme-btn">
                  <div class="theme-preview" [ngStyle]="theme.preview"></div>
                  {{ theme.label }}
                </button>
              </div>
            </div>
            
            <div class="mock-editor" [ngClass]="getThemeClass()">
              <div class="mock-toolbar" [ngClass]="getToolbarClass()">
                <button class="mock-btn" [ngClass]="getButtonClass()">B</button>
                <button class="mock-btn" [ngClass]="getButtonClass()">I</button>
                <button class="mock-btn" [ngClass]="getButtonClass()">U</button>
              </div>
              <div class="mock-content">
                <p>Switch themes using the buttons above</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/advanced" class="next-card">
            <h4>Advanced Features</h4>
            <p>Performance optimization and security</p>
          </a>
          <a routerLink="/events" class="next-card">
            <h4>Event Handling</h4>
            <p>Handle editor events and interactions</p>
          </a>
          <a routerLink="/forms" class="next-card">
            <h4>Forms Integration</h4>
            <p>Integrate with Angular forms</p>
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
      transition: all 0.2s ease;
    }

    .mock-editor.custom-border {
      border: 2px solid #007bff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .mock-editor.dark-theme {
      background: #2d3748;
      border-color: #4a5568;
    }

    .mock-editor.dark-theme .mock-content {
      background: #2d3748;
      color: white;
    }

    .mock-toolbar {
      background: #f8f9fa;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
    }

    .mock-toolbar.gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom-color: #5a67d8;
    }

    .mock-toolbar.dark {
      background: #1a202c;
      border-bottom-color: #2d3748;
    }

    .mock-btn {
      padding: 6px 10px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      transition: all 0.2s ease;
    }

    .mock-toolbar.gradient .mock-btn {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.3);
      color: #333;
    }

    .mock-btn.dark {
      background: #4a5568;
      border-color: #718096;
      color: white;
    }

    .mock-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .mock-content {
      min-height: 120px;
      padding: 12px;
      outline: none;
      background: white;
    }

    .theme-switcher-demo {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .theme-controls h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .theme-options {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .theme-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
    }

    .theme-btn.active {
      border-color: #007bff;
      background: #f0f8ff;
    }

    .theme-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .theme-preview {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
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
      
      .theme-options {
        justify-content: center;
      }
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StylingComponent {
  currentTheme = 'light';

  themes = [
    {
      name: 'light',
      label: 'Light',
      preview: { background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }
    },
    {
      name: 'dark',
      label: 'Dark',
      preview: { background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' }
    },
    {
      name: 'gradient',
      label: 'Gradient',
      preview: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
    }
  ];

  getThemeClass(): string {
    switch (this.currentTheme) {
      case 'dark': return 'dark-theme';
      case 'gradient': return 'custom-border';
      default: return '';
    }
  }

  getToolbarClass(): string {
    switch (this.currentTheme) {
      case 'dark': return 'dark';
      case 'gradient': return 'gradient';
      default: return '';
    }
  }

  getButtonClass(): string {
    switch (this.currentTheme) {
      case 'dark': return 'dark';
      default: return '';
    }
  }
}