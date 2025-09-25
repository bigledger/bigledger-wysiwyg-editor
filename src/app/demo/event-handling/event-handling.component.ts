import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-event-handling',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, WysiwygEditorComponent],
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
            <wysiwyg-editor
              [(ngModel)]="contentChangeContent"
              (contentChange)="onContentChange($event)"
              placeholder="Start typing to see content change events..."
              [height]="'200px'">
            </wysiwyg-editor>
            
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
                <span class="stat-label">Paragraphs:</span>
                <span class="stat-value">{{ paragraphCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Changes:</span>
                <span class="stat-value">{{ changeCount }}</span>
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
            <wysiwyg-editor
              [(ngModel)]="selectionContent"
              (selectionChange)="onSelectionChange($event)"
              placeholder="Select some text to see selection events..."
              [height]="'200px'">
            </wysiwyg-editor>
            
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
              <div class="info-item">
                <span class="info-label">Bold Active:</span>
                <span class="info-value" [class.active]="isBoldActive">{{ isBoldActive ? 'Yes' : 'No' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Italic Active:</span>
                <span class="info-value" [class.active]="isItalicActive">{{ isItalicActive ? 'Yes' : 'No' }}</span>
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
            <wysiwyg-editor
              [(ngModel)]="autoSaveContent"
              (contentChange)="onAutoSaveContentChange($event)"
              placeholder="Type something to see auto-save in action..."
              [height]="'200px'">
            </wysiwyg-editor>
            
            <div class="save-status">
              <div class="status-indicator" [class]="saveStatusClass">
                {{ saveStatus }}
              </div>
              <div class="last-saved" *ngIf="lastSaved">
                Last saved: {{ lastSaved | date:'short' }}
              </div>
              <div class="save-count">
                Auto-saves: {{ autoSaveCount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Focus & Blur Events</h2>
        <p>Track editor focus state and user interactions:</p>
        
        <div class="demo-result">
          <div class="editor-container">
            <wysiwyg-editor
              [(ngModel)]="focusContent"
              (focusEvent)="onEditorFocus($event)"
              (blurEvent)="onEditorBlur($event)"
              placeholder="Click here to focus, click outside to blur..."
              [height]="'150px'">
            </wysiwyg-editor>
            
            <div class="focus-info">
              <div class="info-item">
                <span class="info-label">Editor State:</span>
                <span class="info-value" [class.active]="isFocused">{{ isFocused ? 'Focused' : 'Blurred' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Focus Count:</span>
                <span class="info-value">{{ focusCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Blur Count:</span>
                <span class="info-value">{{ blurCount }}</span>
              </div>
              <div class="info-item" *ngIf="lastFocusTime">
                <span class="info-label">Last Focus:</span>
                <span class="info-value">{{ lastFocusTime | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Event Log</h2>
        <p>Real-time log of all editor events:</p>
        
        <div class="demo-result">
          <div class="editor-container">
            <wysiwyg-editor
              [(ngModel)]="eventLogContent"
              (contentChange)="logEvent('Content Changed', $event)"
              (selectionChange)="logEvent('Selection Changed', $event)"
              (focusEvent)="logEvent('Editor Focused', $event)"
              (blurEvent)="logEvent('Editor Blurred', $event)"
              placeholder="Interact with this editor to see events..."
              [height]="'150px'">
            </wysiwyg-editor>
            
            <div class="event-log">
              <div class="log-header">
                <h4>Event Log</h4>
                <button class="clear-btn" (click)="clearEventLog()">Clear Log</button>
              </div>
              <div class="log-entries">
                <div *ngFor="let event of eventLog; trackBy: trackByEvent" class="log-entry">
                  <span class="log-time">{{ event.timestamp | date:'HH:mm:ss.SSS' }}</span>
                  <span class="log-type">{{ event.type }}</span>
                  <span class="log-data">{{ event.data }}</span>
                </div>
                <div *ngIf="eventLog.length === 0" class="no-events">
                  No events yet. Start interacting with the editor above.
                </div>
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

    wysiwyg-editor {
      display: block;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    wysiwyg-editor:focus-within {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .editor-stats, .selection-info, .focus-info {
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

    .last-saved, .save-count {
      font-size: 0.875rem;
      color: #666;
    }

    .event-log {
      background: white;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      max-height: 300px;
      overflow: hidden;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8f9fa;
    }

    .log-header h4 {
      margin: 0;
      color: #333;
      font-size: 1rem;
    }

    .clear-btn {
      padding: 0.25rem 0.75rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .clear-btn:hover {
      background: #c82333;
    }

    .log-entries {
      max-height: 200px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .log-entry {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      border-bottom: 1px solid #f1f3f4;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .log-time {
      color: #666;
      min-width: 80px;
    }

    .log-type {
      color: #007bff;
      font-weight: 500;
      min-width: 120px;
    }

    .log-data {
      color: #333;
      word-break: break-all;
    }

    .no-events {
      padding: 2rem;
      text-align: center;
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
  // Editor content
  contentChangeContent = '<p>Start typing to see <strong>content change events</strong> in real-time...</p>';
  selectionContent = '<p>Select some text to see <em>selection events</em>. Try selecting <strong>bold text</strong> or <em>italic text</em>.</p>';
  autoSaveContent = '<p>Type something to see <strong>auto-save</strong> in action. Changes are saved automatically after 2 seconds of inactivity.</p>';
  focusContent = '<p>Click here to <strong>focus</strong>, click outside to <em>blur</em>...</p>';
  eventLogContent = '<p>Interact with this editor to see <strong>all events</strong> logged below.</p>';

  // Content tracking
  contentLength = 0;
  wordCount = 0;
  paragraphCount = 1;
  changeCount = 0;

  // Selection tracking
  hasSelection = false;
  selectedText = '';
  selectionLength = 0;
  isBoldActive = false;
  isItalicActive = false;

  // Auto-save
  saveStatus = 'All changes saved';
  saveStatusClass = 'saved';
  lastSaved: Date | null = null;
  autoSaveCount = 0;

  // Focus tracking
  isFocused = false;
  focusCount = 0;
  blurCount = 0;
  lastFocusTime: Date | null = null;

  // Event log
  eventLog: Array<{id: number, timestamp: Date, type: string, data: string}> = [];
  private eventIdCounter = 0;

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

    // Initialize content stats
    this.updateContentStats(this.contentChangeContent);
  }

  onContentChange(content: string) {
    this.updateContentStats(content);
    this.changeCount++;
  }

  onSelectionChange(selectionState: any) {
    this.hasSelection = selectionState?.hasSelection || false;
    this.selectedText = selectionState?.selectedText || '';
    this.selectionLength = this.selectedText.length;
    this.isBoldActive = selectionState?.formats?.bold || false;
    this.isItalicActive = selectionState?.formats?.italic || false;
  }

  onAutoSaveContentChange(content: string) {
    this.saveStatus = 'Saving...';
    this.saveStatusClass = 'saving';
    this.contentChange$.next(content);
  }

  onEditorFocus(event: Event) {
    this.isFocused = true;
    this.focusCount++;
    this.lastFocusTime = new Date();
  }

  onEditorBlur(event: Event) {
    this.isFocused = false;
    this.blurCount++;
  }

  logEvent(type: string, data: any) {
    let dataString = '';
    
    if (typeof data === 'string') {
      dataString = data.length > 50 ? data.substring(0, 50) + '...' : data;
    } else if (data && typeof data === 'object') {
      if (data.hasSelection) {
        dataString = `Selection: "${data.selectedText || ''}" (${data.selectedText?.length || 0} chars)`;
      } else if (data.type) {
        dataString = `Event type: ${data.type}`;
      } else {
        dataString = JSON.stringify(data).substring(0, 100);
      }
    } else {
      dataString = String(data);
    }

    this.eventLog.unshift({
      id: ++this.eventIdCounter,
      timestamp: new Date(),
      type,
      data: dataString
    });

    // Keep only last 20 events
    if (this.eventLog.length > 20) {
      this.eventLog = this.eventLog.slice(0, 20);
    }
  }

  clearEventLog() {
    this.eventLog = [];
    this.eventIdCounter = 0;
  }

  trackByEvent(index: number, event: any): number {
    return event.id;
  }

  private updateContentStats(content: string) {
    this.contentLength = content.length;
    this.wordCount = this.countWords(content);
    this.paragraphCount = this.countParagraphs(content);
  }

  private countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  private countParagraphs(html: string): number {
    const paragraphs = html.match(/<p[^>]*>/g);
    return Math.max(1, paragraphs ? paragraphs.length : 1);
  }

  private autoSave(content: string) {
    // Simulate API call
    setTimeout(() => {
      this.saveStatus = 'All changes saved';
      this.saveStatusClass = 'saved';
      this.lastSaved = new Date();
      this.autoSaveCount++;
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}