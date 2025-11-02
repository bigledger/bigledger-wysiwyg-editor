import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WysiwygEditorComponent, ToolbarConfig } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-toolbar-config',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, WysiwygEditorComponent],
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
          <wysiwyg-editor
            [(ngModel)]="minimalContent"
            [toolbarConfig]="minimalToolbarConfig"
            placeholder="Type here with minimal toolbar..."
            [height]="'200px'">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Standard Toolbar</h2>
        <p>A comprehensive toolbar with common formatting options</p>
        
        <div class="demo-result">
          <wysiwyg-editor
            [(ngModel)]="standardContent"
            [toolbarConfig]="standardToolbarConfig"
            placeholder="Type here with standard toolbar..."
            [height]="'200px'">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Full-Featured Toolbar</h2>
        <p>A complete toolbar with all available formatting tools</p>
        
        <div class="demo-result">
          <wysiwyg-editor
            [(ngModel)]="fullFeaturedContent"
            [toolbarConfig]="fullFeaturedToolbarConfig"
            placeholder="Type here with full-featured toolbar..."
            [height]="'200px'">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Custom Toolbar Configuration</h2>
        <p>A custom toolbar with specific tools and groupings</p>
        
        <div class="demo-result">
          <wysiwyg-editor
            [(ngModel)]="customContent"
            [toolbarConfig]="customToolbarConfig"
            placeholder="Type here with custom toolbar..."
            [height]="'200px'">
          </wysiwyg-editor>
        </div>
      </div>

      <div class="demo-section">
        <h2>Toolbar Configuration Code</h2>
        <p>Here's how to configure different toolbars:</p>
        
        <div class="demo-result">
          <div class="config-examples">
            <div class="config-example">
              <h4>Minimal Toolbar</h4>
              <pre><code>{{minimalConfigCode}}</code></pre>
            </div>
            
            <div class="config-example">
              <h4>Standard Toolbar</h4>
              <pre><code>{{standardConfigCode}}</code></pre>
            </div>
            
            <div class="config-example">
              <h4>Custom Toolbar</h4>
              <pre><code>{{customConfigCode}}</code></pre>
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

    wysiwyg-editor {
      display: block;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .config-examples {
      display: grid;
      gap: 2rem;
    }

    .config-example {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 1.5rem;
    }

    .config-example h4 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .config-example pre {
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

    .config-example code {
      color: inherit;
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
  // Content for different editors
  minimalContent = '<p>This editor has a <strong>minimal toolbar</strong> with only essential formatting tools.</p>';
  standardContent = '<p>This editor has a <em>standard toolbar</em> with common formatting options like <strong>bold</strong>, <em>italic</em>, <span style="color: #2196F3;">text color</span>, lists, and links.</p>';
  fullFeaturedContent = '<p>This editor has a <strong>full-featured toolbar</strong> with all available formatting tools including font size, <span style="color: #4CAF50;">text colors</span>, <span style="background-color: #FFEB3B;">background colors</span>, alignment, and more.</p>';
  customContent = '<p>This editor has a <strong>custom toolbar</strong> configured for specific use cases with selected tools.</p>';

  // Minimal toolbar configuration
  minimalToolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button' as const, command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button' as const, command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'dialog' as const, command: 'createLink', icon: 'createLink', label: 'Insert Link' },
      { type: 'button' as const, command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' }
    ]
  };

  // Standard toolbar configuration
  standardToolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button' as const, command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button' as const, command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button' as const, command: 'underline', icon: 'underline', label: 'Underline' },
      {
        type: 'dropdown' as const,
        command: 'fontSize',
        icon: 'fontSize',
        label: 'Font Size',
        options: [
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' },
          { value: '18px', label: '18px' },
          { value: '20px', label: '20px' }
        ]
      },
      {
        type: 'dropdown' as const,
        command: 'fontFamily',
        icon: 'fontFamily',
        label: 'Font Family',
        options: [
          { value: 'Arial, sans-serif', label: 'Arial' },
          { value: 'Helvetica, sans-serif', label: 'Helvetica' },
          { value: 'Times New Roman, serif', label: 'Times New Roman' },
          { value: 'Georgia, serif', label: 'Georgia' },
          { value: 'Courier New, monospace', label: 'Courier New' }
        ]
      },
      { type: 'dialog' as const, command: 'fontColor', icon: 'fontColor', label: 'Text Color' },
      { type: 'button' as const, command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
      { type: 'button' as const, command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
      { type: 'dialog' as const, command: 'createLink', icon: 'createLink', label: 'Insert Link' },
      { type: 'dialog' as const, command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
      { type: 'button' as const, command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' }
    ]
  };

  // Full-featured toolbar configuration
  fullFeaturedToolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button' as const, command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button' as const, command: 'redo', icon: 'redo', label: 'Redo' },
      { type: 'button' as const, command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button' as const, command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button' as const, command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'button' as const, command: 'strikethrough', icon: 'strikethrough', label: 'Strikethrough' },
      {
        type: 'dropdown' as const,
        command: 'fontSize',
        icon: 'fontSize',
        label: 'Font Size',
        options: [
          { value: '10px', label: '10px' },
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' },
          { value: '18px', label: '18px' },
          { value: '20px', label: '20px' },
          { value: '24px', label: '24px' },
          { value: '28px', label: '28px' }
        ]
      },
      {
        type: 'dropdown' as const,
        command: 'fontFamily',
        icon: 'fontFamily',
        label: 'Font Family',
        options: [
          { value: 'Arial, sans-serif', label: 'Arial' },
          { value: 'Helvetica, sans-serif', label: 'Helvetica' },
          { value: 'Times New Roman, serif', label: 'Times New Roman' },
          { value: 'Georgia, serif', label: 'Georgia' },
          { value: 'Courier New, monospace', label: 'Courier New' },
          { value: 'Verdana, sans-serif', label: 'Verdana' },
          { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
          { value: 'Impact, sans-serif', label: 'Impact' }
        ]
      },
      { type: 'dialog' as const, command: 'fontColor', icon: 'fontColor', label: 'Text Color' },
      { type: 'dialog' as const, command: 'backgroundColor', icon: 'backgroundColor', label: 'Background Color' },
      { type: 'button' as const, command: 'justifyLeft', icon: 'justifyLeft', label: 'Align Left' },
      { type: 'button' as const, command: 'justifyCenter', icon: 'justifyCenter', label: 'Align Center' },
      { type: 'button' as const, command: 'justifyRight', icon: 'justifyRight', label: 'Align Right' },
      { type: 'button' as const, command: 'justifyFull', icon: 'justifyFull', label: 'Justify' },
      { type: 'button' as const, command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
      { type: 'button' as const, command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
      { type: 'dialog' as const, command: 'createLink', icon: 'createLink', label: 'Insert Link' },
      { type: 'dialog' as const, command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
      { type: 'dialog' as const, command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
      { type: 'button' as const, command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' }
    ]
  };

  // Custom toolbar configuration
  customToolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button' as const, command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button' as const, command: 'italic', icon: 'italic', label: 'Italic' },
      {
        type: 'dropdown' as const,
        command: 'fontSize',
        icon: 'fontSize',
        label: 'Font Size',
        options: [
          { value: '14px', label: 'Small' },
          { value: '16px', label: 'Normal' },
          { value: '18px', label: 'Large' },
          { value: '24px', label: 'Extra Large' }
        ]
      },
      { type: 'button' as const, command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
      { type: 'dialog' as const, command: 'createLink', icon: 'createLink', label: 'Insert Link' },
      { type: 'button' as const, command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' },
      { type: 'button' as const, command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button' as const, command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };

  // Code examples for display
  minimalConfigCode = `const minimalToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link' }
  ]
};`;

  standardConfigCode = `const standardToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
    { 
      type: 'dropdown', 
      command: 'fontSize', 
      icon: 'fontSize', 
      label: 'Font Size',
      options: [
        { value: '12px', label: '12px' },
        { value: '14px', label: '14px' },
        { value: '16px', label: '16px' },
        { value: '18px', label: '18px' },
        { value: '20px', label: '20px' }
      ]
    },
    { 
      type: 'dropdown', 
      command: 'fontFamily', 
      icon: 'fontFamily', 
      label: 'Font Family',
      options: [
        { value: 'Arial, sans-serif', label: 'Arial' },
        { value: 'Helvetica, sans-serif', label: 'Helvetica' },
        { value: 'Times New Roman, serif', label: 'Times New Roman' },
        { value: 'Georgia, serif', label: 'Georgia' },
        { value: 'Courier New, monospace', label: 'Courier New' }
      ]
    },
    { type: 'button', command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
    { type: 'button', command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
    { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link' },
    { type: 'dialog', command: 'insertImage', icon: 'insertImage', label: 'Insert Image' }
  ]
};`;

  customConfigCode = `const customToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    { 
      type: 'dropdown', 
      command: 'fontSize', 
      icon: 'fontSize', 
      label: 'Font Size',
      options: [
        { value: '14px', label: 'Small' },
        { value: '16px', label: 'Normal' },
        { value: '18px', label: 'Large' },
        { value: '24px', label: 'Extra Large' }
      ]
    },
    { type: 'button', command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
    { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link' },
    { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
    { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
  ]
};`;
}