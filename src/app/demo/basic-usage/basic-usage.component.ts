import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-basic-usage',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, WysiwygEditorComponent],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Basic Usage Examples</h1>
        <p>Simple implementations of the BigLedger WYSIWYG Editor with default settings</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>Simple Editor</h2>
        <p>The most basic implementation with default settings:</p>
        
        <div class="code-example">
          <div class="code-header">
            <span>Template</span>
          </div>
          <pre><code>&lt;wysiwyg-editor 
  [(ngModel)]="content"
  placeholder="Start typing..."&gt;
&lt;/wysiwyg-editor&gt;</code></pre>
        </div>

        <div class="demo-result">
          <wysiwyg-editor 
            [(ngModel)]="content"
            placeholder="Start typing...">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Editor with Custom Height</h2>
        <p>Setting a custom height for the editor content area:</p>
        
        <div class="code-example">
          <div class="code-header">
            <span>Template</span>
          </div>
          <pre><code>&lt;wysiwyg-editor 
  [(ngModel)]="content"
  [height]="'400px'"
  placeholder="Type your content here..."&gt;
&lt;/wysiwyg-editor&gt;</code></pre>
        </div>

        <div class="demo-result">
          <wysiwyg-editor 
            [(ngModel)]="customHeightContent"
            [height]="'400px'"
            placeholder="Type your content here...">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Read-Only Editor</h2>
        <p>Display content in read-only mode:</p>
        
        <div class="code-example">
          <div class="code-header">
            <span>Template</span>
          </div>
          <pre><code>&lt;wysiwyg-editor 
  [content]="readOnlyContent"
  [readonly]="true"&gt;
&lt;/wysiwyg-editor&gt;</code></pre>
        </div>

        <div class="demo-result">
          <wysiwyg-editor 
            [(ngModel)]="readOnlyContent"
            [readonly]="true">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/forms" class="next-card">
            <h4>Forms Integration</h4>
            <p>Learn how to integrate with Angular forms</p>
          </a>
          <a routerLink="/toolbar" class="next-card">
            <h4>Toolbar Configuration</h4>
            <p>Customize the editor toolbar</p>
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

    .code-example {
      background: #2d3748;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .code-header {
      background: #4a5568;
      color: white;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .code-example pre {
      margin: 0;
      padding: 1.5rem;
      color: #e2e8f0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      overflow-x: auto;
    }

    .demo-result {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1.5rem;
      background: #f8f9fa;
    }

    wysiwyg-editor {
      display: block;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
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
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BasicUsageComponent {
  content = '<p>Hello World!</p>';
  customHeightContent = '<p>Custom height editor content...</p>';
  readOnlyContent = '<p><strong>This content cannot be edited.</strong></p><p>This is a demonstration of the read-only mode where users can view the formatted content but cannot make any changes.</p>';
}