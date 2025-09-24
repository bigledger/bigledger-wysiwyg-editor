import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-event-handling',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Event Handling</h1>
        <p>Handle editor events and real-time interactions</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>Content Change Events</h2>
        <p>Monitor content changes and display real-time statistics:</p>
        
        <div class="demo-result">
          <div class="editor-container">
            <div class="mock-editor">
              <div class="mock-toolbar">
                <button class="mock-btn" [class.active]="hasSelection">B</button>
                <button class="mock-btn">I</button>
                <button class="mock-btn">🔗</button>
              </div>
              <div class="mock-content" contenteditable="true" (input)="onContentChange($event)">
                <p>Start typing to see events...</p>
              </div>
            </div>
            
            <div class="editor-stats">
              <div class="stat-item">
                <span class="stat-label">Characters:</span>
                <span class="stat-value">{{ contentLength }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Words:</span>
                <span class="stat-value">{{ wordCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Lines:</span>
                <span class="stat-value">{{ lineCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Selection Events</h2>
        <p>Track text selection and cursor position:</p>
        
        <div class="demo-result">
          <div class="editor-container">
            <div class="mock-editor">
              <div class="mock-toolbar">
                <button class="mock-btn">B</button>
                <button class="mock-btn">I</button>
                <button class="mock-btn">U</button>
              </div>
              <div class="mock-content" 
                   contenteditable="true" 
                   (mouseup)="onSelectionChange()"
                   (keyup)="onSelectionChange()">
                <p>Select some text to see selection events...</p>
              </div>
            </div>
            
            <div class="selection-info">
              <div class="info-item">
                <span class="info-label">Has Selection:</span>
                <span class="info-value" [class.active]="hasSelection">{{ hasSelection ? 'Yes' : 'No' }}</span>
              </div>
              <div class="info-item" *ngIf="hasSelection">
                <span class="info-label">Selected Text:</span>
                <span class="info-value">"{{ selectedText }}"</span>
              </div>
              <div class="info-item" *ngIf="hasSelection">
                <span class="info-label">Selection Length:</span>
                <span class="info-value">{{ selectionLength }} characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Auto-Save Implementation</h2>
        <p>Implement auto-save with debounced content changes:</p>
        
        <div class="demo-result">
          <div class="editor-container">
            <div class="mock-editor">
              <div class="mock-toolbar">
                <button class="mock-btn">B</button>
                <button class="mock-btn">I</button>
                <button class="mock-btn">U</button>
              </div>
              <div class="mock-content" 
                   contenteditable="true" 
                   (input)="onAutoSaveContentChange($event)">
                <p>Type something to see auto-save in action...</p>
              </div>
            </div>
            
            <div class="save-status">
              <div class="status-indicator" [class]="saveStatusClass">
                {{ saveStatus }}
              </div>
              <div class="last-saved" *ngIf="lastSaved">
                Last saved: {{ lastSaved | date:'short' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/styling" class="next-card">
            <h4>Styling & Theming</h4>
            <p>Customize the editor appearance</p>
          </a>
          <a routerLink="/advanced" class="next-card">
            <h4>Advanced Features</h4>
            <p>Performance and security features</p>
          </a>
          <a routerLink="/toolbar" class="next-card">
            <h4>Toolbar Configuration</h4>
            <p>Customize toolbar tools and layout</p>
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

    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mock-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    .mock-editor:focus-within {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .mock-toolbar {
      background: #f8f9fa;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
    }

    .mock-btn {
      padding: 6px 10px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
    }

    .mock-btn:hover {
      background: #e9ecef;
    }

    .mock-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .mock-content {
      min-height: 120px;
      padding: 12px;
      outline: none;
    }

    .editor-stats, .selection-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 1rem;
      background: white;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .stat-item, .info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }

    .stat-label, .info-label {
      font-size: 0.75rem;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .stat-value, .info-value {
      font-size: 1.25rem;
      font-weight: bold;
      color: #333;
    }

    .info-value.active {
      color: #28a745;
    }

    .save-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: white;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .status-indicator {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-indicator.saved {
      background: #d4edda;
      color: #155724;
    }

    .status-indicator.saving {
      background: #fff3cd;
      color: #856404;
    }

    .last-saved {
      font-size: 0.875rem;
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
      
      .editor-stats, .selection-info {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EventHandlingComponent implements OnDestroy {
  // Content tracking
  contentLength = 0;
  wordCount = 0;
  lineCount = 1;

  // Selection tracking
  hasSelection = false;
  selectedText = '';
  selectionLength = 0;

  // Auto-save
  saveStatus = 'All changes saved';
  saveStatusClass = 'saved';
  lastSaved: Date | null = null;

  private contentChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    // Auto-save setup
    this.contentChange$
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(content => this.autoSave(content));
  }

  onContentChange(event: any) {
    const content = event.target.innerHTML;
    this.contentLength = content.length;
    this.wordCount = this.countWords(content);
    this.lineCount = this.countLines(content);
  }

  onSelectionChange() {
    const selection = window.getSelection();
    this.hasSelection = selection ? !selection.isCollapsed : false;
    this.selectedText = selection?.toString() || '';
    this.selectionLength = this.selectedText.length;
  }

  onAutoSaveContentChange(event: any) {
    const content = event.target.innerHTML;
    this.saveStatus = 'Saving...';
    this.saveStatusClass = 'saving';
    this.contentChange$.next(content);
  }

  private countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  private countLines(html: string): number {
    const lines = html.split(/<\/p>|<br\s*\/?>/i);
    return Math.max(1, lines.length - 1);
  }

  private autoSave(content: string) {
    // Simulate API call
    setTimeout(() => {
      this.saveStatus = 'All changes saved';
      this.saveStatusClass = 'saved';
      this.lastSaved = new Date();
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}