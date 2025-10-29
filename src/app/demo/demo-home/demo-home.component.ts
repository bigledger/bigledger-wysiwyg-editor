import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-demo-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="demo-grid">
        <div class="demo-card" *ngFor="let demo of demos">
          <div class="card-icon">
            <i [class]="demo.icon"></i>
          </div>
          <h3>{{ demo.title }}</h3>
          <p>{{ demo.description }}</p>
          <a [routerLink]="demo.route" class="demo-button">
            View Demo
            <i class="icon-arrow-right"></i>
          </a>
        </div>
      </div>

      <div class="features-section">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-item" *ngFor="let feature of features">
            <div class="feature-icon">
              <i [class]="feature.icon"></i>
            </div>
            <h4>{{ feature.title }}</h4>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>

      <div class="getting-started">
        <h2>Getting Started</h2>
        <div class="code-block">
          <pre><code>npm install angular-wysiwyg-editor</code></pre>
        </div>
        <div class="code-block">
          <pre><code>import {{ '{' }} WysiwygEditorComponent {{ '}' }} from 'angular-wysiwyg-editor';

@Component({{ '{' }}
  imports: [WysiwygEditorComponent],
  template: \`
    &lt;wysiwyg-editor 
      [(ngModel)]="content"
      placeholder="Start typing..."&gt;
    &lt;/wysiwyg-editor&gt;
  \`
{{ '}' }})
export class MyComponent {{ '{' }}
  content = '&lt;p&gt;Hello World!&lt;/p&gt;';
{{ '}' }}</code></pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .demo-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      text-align: center;
    }

    .demo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: white;
      font-size: 1.5rem;
    }

    .demo-card h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.25rem;
    }

    .demo-card p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .demo-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      transition: opacity 0.2s ease;
    }

    .demo-button:hover {
      opacity: 0.9;
    }

    .features-section {
      margin-bottom: 4rem;
    }

    .features-section h2 {
      text-align: center;
      margin-bottom: 3rem;
      color: #333;
      font-size: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .feature-item {
      text-align: center;
      padding: 1.5rem;
    }

    .feature-icon {
      width: 50px;
      height: 50px;
      background: #f8f9fa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: #667eea;
      font-size: 1.25rem;
    }

    .feature-item h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .feature-item p {
      color: #666;
      line-height: 1.5;
      margin: 0;
    }

    .getting-started {
      background: #f8f9fa;
      padding: 3rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .getting-started h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .code-block {
      background: #2d3748;
      color: #e2e8f0;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow-x: auto;
    }

    .code-block:last-child {
      margin-bottom: 0;
    }

    .code-block pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .code-block code {
      color: inherit;
    }

    @media (max-width: 768px) {
      .demo-grid {
        grid-template-columns: 1fr;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .getting-started {
        padding: 2rem 1rem;
      }
    }
  `]
})
export class DemoHomeComponent {
  demos = [
    {
      title: 'Basic Usage',
      description: 'Simple editor implementation with default settings and basic functionality.',
      icon: 'icon-edit',
      route: '/basic'
    },
    {
      title: 'Forms Integration',
      description: 'Template-driven and reactive forms integration with validation examples.',
      icon: 'icon-form',
      route: '/forms'
    },
    {
      title: 'Toolbar Configuration',
      description: 'Custom toolbar configurations from minimal to full-featured setups.',
      icon: 'icon-toolbar',
      route: '/toolbar'
    },
    {
      title: 'Event Handling',
      description: 'Content changes, selection events, and real-time editor interactions.',
      icon: 'icon-events',
      route: '/events'
    },
    {
      title: 'Styling & Theming',
      description: 'Custom themes, CSS variables, and responsive design examples.',
      icon: 'icon-palette',
      route: '/styling'
    },
    {
      title: 'Advanced Features',
      description: 'Performance optimization, content sanitization, and programmatic control.',
      icon: 'icon-advanced',
      route: '/advanced'
    },
    {
      title: 'Table Feature',
      description: 'Insert and edit tables with rows, columns, merging, and nested tables support.',
      icon: 'icon-table',
      route: '/table'
    }
  ];

  features = [
    {
      title: 'Rich Text Editing',
      description: 'Bold, italic, underline, font sizes, colors, and text alignment',
      icon: 'icon-text'
    },
    {
      title: 'List Support',
      description: 'Bulleted and numbered lists with indentation controls',
      icon: 'icon-list'
    },
    {
      title: 'Link Management',
      description: 'Insert, edit, and remove hyperlinks with URL validation',
      icon: 'icon-link'
    },
    {
      title: 'Image Support',
      description: 'Upload images or insert via URL with resizing capabilities',
      icon: 'icon-image'
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Standard shortcuts for bold, italic, undo, redo, and more',
      icon: 'icon-keyboard'
    },
    {
      title: 'Forms Integration',
      description: 'Works seamlessly with Angular reactive and template-driven forms',
      icon: 'icon-integration'
    },
    {
      title: 'Content Security',
      description: 'Built-in HTML sanitization to prevent XSS attacks',
      icon: 'icon-security'
    },
    {
      title: 'Accessibility',
      description: 'Full keyboard navigation and screen reader support',
      icon: 'icon-accessibility'
    }
  ];
}