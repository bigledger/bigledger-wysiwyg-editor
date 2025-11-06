import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WysiwygEditorComponent } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-styling',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WysiwygEditorComponent],
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
          <div class="custom-styled-editor">
            <wysiwyg-editor
              [(ngModel)]="customStyledContent"
              placeholder="Editor with custom CSS variables..."
              [height]="'200px'">
            </wysiwyg-editor>
          </div>
          
          <div class="css-code-example">
            <h4>CSS Variables Used:</h4>
            <pre><code>{{customCssCode}}</code></pre>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Dark Theme</h2>
        <p>Create a dark theme using CSS variables:</p>
        
        <div class="demo-result">
          <div class="dark-themed-editor">
            <wysiwyg-editor
              [(ngModel)]="darkThemeContent"
              placeholder="Dark theme editor..."
              [height]="'200px'">
            </wysiwyg-editor>
          </div>
          
          <div class="css-code-example">
            <h4>Dark Theme CSS:</h4>
            <pre><code>{{darkThemeCssCode}}</code></pre>
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
            
            <div class="themed-editor-container" [ngClass]="getThemeClass()">
              <wysiwyg-editor
                [(ngModel)]="themeSwitcherContent"
                placeholder="Switch themes using the buttons above..."
                [height]="'200px'">
              </wysiwyg-editor>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Responsive Styling</h2>
        <p>Create responsive editors that adapt to different screen sizes:</p>
        
        <div class="demo-result">
          <div class="responsive-editor-demo">
            <div class="size-controls">
              <h4>Preview Size:</h4>
              <div class="size-options">
                <button 
                  *ngFor="let size of responsiveSizes" 
                  (click)="currentSize = size.name"
                  [class.active]="currentSize === size.name"
                  class="size-btn">
                  {{ size.label }}
                </button>
              </div>
            </div>
            
            <div class="responsive-container" [ngClass]="'size-' + currentSize">
              <wysiwyg-editor
                [(ngModel)]="responsiveContent"
                placeholder="Responsive editor that adapts to container size..."
                [height]="'180px'">
              </wysiwyg-editor>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Custom Styling Examples</h2>
        <p>Various styling approaches for different use cases:</p>
        
        <div class="demo-result">
          <div class="styling-examples">
            <div class="example-item">
              <h4>Minimal Style</h4>
              <div class="minimal-editor">
                <wysiwyg-editor
                  [(ngModel)]="minimalContent"
                  placeholder="Clean, minimal styling..."
                  [height]="'120px'">
                </wysiwyg-editor>
              </div>
            </div>
            
            <div class="example-item">
              <h4>Rounded Style</h4>
              <div class="rounded-editor">
                <wysiwyg-editor
                  [(ngModel)]="roundedContent"
                  placeholder="Rounded corners and soft shadows..."
                  [height]="'120px'">
                </wysiwyg-editor>
              </div>
            </div>
            
            <div class="example-item">
              <h4>Colorful Style</h4>
              <div class="colorful-editor">
                <wysiwyg-editor
                  [(ngModel)]="colorfulContent"
                  placeholder="Vibrant colors and gradients..."
                  [height]="'120px'">
                </wysiwyg-editor>
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

    /* Custom Styled Editor */
    .custom-styled-editor wysiwyg-editor {
      border: 3px solid #007bff;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .custom-styled-editor wysiwyg-editor:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(0, 123, 255, 0.2);
    }

    /* Dark Themed Editor */
    .dark-themed-editor {
      background: #1a202c;
      padding: 1rem;
      border-radius: 8px;
    }

    .dark-themed-editor wysiwyg-editor {
      border: 2px solid #4a5568;
      border-radius: 8px;
      background: #2d3748;
      color: white;
    }

    /* Themed Editor Container */
    .themed-editor-container wysiwyg-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .themed-editor-container.dark-theme {
      background: #1a202c;
      padding: 1rem;
      border-radius: 8px;
    }

    .themed-editor-container.dark-theme wysiwyg-editor {
      border-color: #4a5568;
      background: #2d3748;
      color: white;
    }

    .themed-editor-container.custom-border wysiwyg-editor {
      border: 2px solid #007bff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
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

    .css-code-example {
      margin-top: 1.5rem;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1rem;
    }

    .css-code-example h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1rem;
    }

    .css-code-example pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .css-code-example code {
      color: inherit;
    }

    /* Responsive Editor Demo */
    .responsive-editor-demo {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .size-controls h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .size-options {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .size-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .size-btn.active {
      border-color: #007bff;
      background: #f0f8ff;
      color: #007bff;
    }

    .size-btn:hover {
      border-color: #007bff;
    }

    .responsive-container {
      transition: all 0.3s ease;
      margin: 0 auto;
    }

    .responsive-container.size-mobile {
      max-width: 375px;
    }

    .responsive-container.size-tablet {
      max-width: 768px;
    }

    .responsive-container.size-desktop {
      max-width: 100%;
    }

    /* Custom Styling Examples */
    .styling-examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .example-item {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .example-item h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1rem;
    }

    /* Minimal Editor */
    .minimal-editor wysiwyg-editor {
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      box-shadow: none;
    }

    /* Rounded Editor */
    .rounded-editor wysiwyg-editor {
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    /* Colorful Editor */
    .colorful-editor wysiwyg-editor {
      border: 2px solid transparent;
      border-radius: 8px;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4) border-box;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
  // Editor content
  customStyledContent = '<p>This editor demonstrates <strong>custom CSS variables</strong> with enhanced borders, shadows, and hover effects.</p>';
  darkThemeContent = '<p>This is a <strong>dark themed editor</strong> perfect for <em>night mode</em> applications and modern interfaces.</p>';
  themeSwitcherContent = '<p>Switch between different <strong>themes</strong> using the buttons above. Each theme changes the entire editor appearance.</p>';
  responsiveContent = '<p>This editor adapts to different <strong>screen sizes</strong>. Try switching between mobile, tablet, and desktop views.</p>';
  minimalContent = '<p>Clean and minimal styling.</p>';
  roundedContent = '<p>Soft rounded corners.</p>';
  colorfulContent = '<p>Vibrant and colorful design.</p>';

  // Theme management
  currentTheme = 'light';
  currentSize = 'desktop';

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

  responsiveSizes = [
    { name: 'mobile', label: 'Mobile (375px)' },
    { name: 'tablet', label: 'Tablet (768px)' },
    { name: 'desktop', label: 'Desktop (100%)' }
  ];

  // CSS code examples
  customCssCode = `.custom-styled-editor wysiwyg-editor {
  border: 3px solid #007bff;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
  transition: all 0.3s ease;
}

.custom-styled-editor wysiwyg-editor:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 123, 255, 0.2);
}`;

  darkThemeCssCode = `.dark-themed-editor {
  background: #1a202c;
  padding: 1rem;
  border-radius: 8px;
}

.dark-themed-editor wysiwyg-editor {
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #2d3748;
  color: white;
}`;

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