import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WysiwygEditorComponent } from '../../../../projects/bigldeger-wysiwyg-editor/src/lib/components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarConfig } from '../../../../projects/bigldeger-wysiwyg-editor/src/lib/models/toolbar.interface';

@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, WysiwygEditorComponent],
  template: `
    <div class="demo-container">
      <h2>Table Feature Demo</h2>
      <p class="demo-description">
        This demo showcases the table functionality similar to Froala editor. 
        You can insert tables, add/delete rows and columns, merge cells, and even nest tables inside cells.
      </p>

      <div class="demo-section">
        <h3>Features</h3>
        <ul class="feature-list">
          <li>✓ Insert tables with customizable rows and columns</li>
          <li>✓ Visual table size picker (hover to select)</li>
          <li>✓ Add/delete rows above or below</li>
          <li>✓ Add/delete columns before or after</li>
          <li>✓ Merge and split cells</li>
          <li>✓ Cell formatting (background color, alignment)</li>
          <li>✓ Table properties (width, border, padding)</li>
          <li>✓ Nested tables support</li>
          <li>✓ Header row option</li>
        </ul>
      </div>

      <div class="demo-section">
        <h3>Editor with Table Support</h3>
        <wysiwyg-editor
          [(ngModel)]="content"
          [toolbarConfig]="toolbarConfig"
          [height]="'500px'"
          placeholder="Click the table icon (⊞) in the toolbar to insert a table...">
        </wysiwyg-editor>
      </div>

      <div class="demo-section">
        <h3>How to Use</h3>
        <div class="instructions">
          <h4>Inserting a Table:</h4>
          <ol>
            <li>Click the table icon (⊞) in the toolbar</li>
            <li>Hover over the grid to select table size or enter manually</li>
            <li>Configure table properties (width, border, padding, alignment)</li>
            <li>Optionally enable header row</li>
            <li>Click "Insert" to add the table</li>
          </ol>

          <h4>Editing Tables:</h4>
          <ol>
            <li>Click inside any table cell to select it</li>
            <li>Right-click for context menu (coming soon) or use keyboard shortcuts</li>
            <li>Use the table icon again to edit table properties</li>
          </ol>

          <h4>Nested Tables:</h4>
          <ol>
            <li>Click inside a table cell</li>
            <li>Click the table icon to insert another table inside the cell</li>
            <li>The nested table can have its own rows, columns, and formatting</li>
          </ol>
        </div>
      </div>

      <div class="demo-section">
        <h3>Output HTML</h3>
        <pre class="code-block">{{ content }}</pre>
      </div>

      <div class="demo-section">
        <h3>Sample Tables</h3>
        <button class="demo-button" (click)="loadSampleTable('simple')">Load Simple Table</button>
        <button class="demo-button" (click)="loadSampleTable('styled')">Load Styled Table</button>
        <button class="demo-button" (click)="loadSampleTable('nested')">Load Nested Table</button>
        <button class="demo-button" (click)="loadSampleTable('complex')">Load Complex Table</button>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    h2 {
      color: #333;
      margin-bottom: 10px;
    }

    h3 {
      color: #555;
      margin-top: 30px;
      margin-bottom: 15px;
    }

    h4 {
      color: #666;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .demo-description {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .demo-section {
      margin-bottom: 40px;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 10px;
    }

    .feature-list li {
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
    }

    .instructions ol {
      padding-left: 20px;
      line-height: 1.8;
    }

    .instructions li {
      margin-bottom: 8px;
    }

    .code-block {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      max-height: 300px;
    }

    .demo-button {
      padding: 10px 20px;
      margin-right: 10px;
      margin-bottom: 10px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s;
    }

    .demo-button:hover {
      background: #45a049;
    }

    .demo-button:active {
      transform: translateY(1px);
    }
  `]
})
export class TableDemoComponent {
  content = '<p>Welcome to the table demo! Click the table icon in the toolbar to get started.</p>';

  toolbarConfig: ToolbarConfig = {
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
      { type: 'button', command: 'justifyLeft', icon: 'justifyLeft', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'justifyCenter', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'justifyRight', label: 'Align Right' },
      { type: 'button', command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
      { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link' },
      { type: 'dialog', command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
      { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };

  loadSampleTable(type: string): void {
    switch (type) {
      case 'simple':
        this.content = `
          <h3>Simple Table Example</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
              </tr>
            </tbody>
          </table>
          <p>This is a simple 2x3 table.</p>
        `;
        break;
      
      case 'styled':
        this.content = `
          <h3>Styled Table with Header</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <tbody>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Email</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Role</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">John Doe</td>
                <td style="border: 1px solid #ddd; padding: 8px;">john@example.com</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Developer</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Jane Smith</td>
                <td style="border: 1px solid #ddd; padding: 8px;">jane@example.com</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Designer</td>
              </tr>
            </tbody>
          </table>
          <p>This table has a styled header row.</p>
        `;
        break;
      
      case 'nested':
        this.content = `
          <h3>Nested Table Example</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Outer Cell 1</td>
                <td style="border: 1px solid #ddd; padding: 8px;">
                  <table style="width: 100%; border-collapse: collapse; border: 1px solid #999;">
                    <tbody>
                      <tr>
                        <td style="border: 1px solid #999; padding: 4px;">Inner 1</td>
                        <td style="border: 1px solid #999; padding: 4px;">Inner 2</td>
                      </tr>
                      <tr>
                        <td style="border: 1px solid #999; padding: 4px;">Inner 3</td>
                        <td style="border: 1px solid #999; padding: 4px;">Inner 4</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Outer Cell 3</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Outer Cell 4</td>
              </tr>
            </tbody>
          </table>
          <p>This demonstrates a table nested inside another table cell.</p>
        `;
        break;
      
      case 'complex':
        this.content = `
          <h3>Complex Table with Merged Cells</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <tbody>
              <tr>
                <th colspan="3" style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #4CAF50; color: white; text-align: center;">Product Comparison</th>
              </tr>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Feature</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Basic</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Premium</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Storage</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">10 GB</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e8f5e9;">100 GB</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Users</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">5</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e8f5e9;">Unlimited</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Support</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Email</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e8f5e9;">24/7 Phone</td>
              </tr>
            </tbody>
          </table>
          <p>This is a complex table with merged cells and custom styling.</p>
        `;
        break;
    }
  }
}
