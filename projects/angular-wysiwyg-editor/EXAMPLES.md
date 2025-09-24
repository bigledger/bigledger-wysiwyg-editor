# Angular WYSIWYG Editor - Usage Examples

This document provides comprehensive examples for using the Angular WYSIWYG Editor in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Forms Integration](#forms-integration)
- [Custom Toolbar Configuration](#custom-toolbar-configuration)
- [Event Handling](#event-handling)
- [Styling and Theming](#styling-and-theming)
- [Advanced Configuration](#advanced-configuration)
- [Programmatic Control](#programmatic-control)
- [Custom Components](#custom-components)
- [Performance Optimization](#performance-optimization)

## Basic Usage

### Simple Editor

The most basic implementation with default settings:

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-simple-editor',
  standalone: true,
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      placeholder="Start typing...">
    </wysiwyg-editor>
    
    <div class="preview">
      <h3>Preview:</h3>
      <div [innerHTML]="content"></div>
    </div>
  `
})
export class SimpleEditorComponent {
  content = '<p>Hello World!</p>';
}
```

### Editor with Custom Height

```typescript
@Component({
  selector: 'app-custom-height',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [height]="'400px'"
      placeholder="Type your content here...">
    </wysiwyg-editor>
  `
})
export class CustomHeightComponent {
  content = '';
}
```

### Read-Only Editor

```typescript
@Component({
  selector: 'app-readonly-editor',
  template: `
    <wysiwyg-editor 
      [content]="content"
      [readonly]="true">
    </wysiwyg-editor>
  `
})
export class ReadOnlyComponent {
  content = '<p>This content cannot be edited.</p>';
}
```

## Forms Integration

### Template-Driven Forms

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [FormsModule, WysiwygEditorComponent],
  template: `
    <form #form="ngForm" (ngSubmit)="onSubmit(form)">
      <div class="form-group">
        <label for="title">Title:</label>
        <input 
          type="text" 
          id="title"
          name="title"
          [(ngModel)]="article.title"
          required>
      </div>
      
      <div class="form-group">
        <label for="content">Content:</label>
        <wysiwyg-editor 
          name="content"
          [(ngModel)]="article.content"
          [height]="'300px'"
          placeholder="Write your article content..."
          required>
        </wysiwyg-editor>
      </div>
      
      <button type="submit" [disabled]="!form.valid">
        Save Article
      </button>
    </form>
  `
})
export class TemplateFormComponent {
  article = {
    title: '',
    content: ''
  };

  onSubmit(form: any) {
    if (form.valid) {
      console.log('Article saved:', this.article);
    }
  }
}
```

### Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-reactive-form',
  standalone: true,
  imports: [ReactiveFormsModule, WysiwygEditorComponent],
  template: `
    <form [formGroup]="articleForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="title">Title:</label>
        <input 
          type="text" 
          id="title"
          formControlName="title"
          class="form-control">
        <div *ngIf="articleForm.get('title')?.invalid && articleForm.get('title')?.touched" 
             class="error">
          Title is required
        </div>
      </div>
      
      <div class="form-group">
        <label for="content">Content:</label>
        <wysiwyg-editor 
          formControlName="content"
          [height]="'350px'"
          placeholder="Write your article content...">
        </wysiwyg-editor>
        <div *ngIf="articleForm.get('content')?.invalid && articleForm.get('content')?.touched" 
             class="error">
          Content is required
        </div>
      </div>
      
      <div class="form-group">
        <label for="tags">Tags:</label>
        <input 
          type="text" 
          id="tags"
          formControlName="tags"
          placeholder="Enter tags separated by commas">
      </div>
      
      <button type="submit" [disabled]="!articleForm.valid">
        Publish Article
      </button>
    </form>
    
    <div class="form-status">
      <p>Form Status: {{ articleForm.status }}</p>
      <p>Form Value: {{ articleForm.value | json }}</p>
    </div>
  `
})
export class ReactiveFormComponent {
  articleForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      tags: ['']
    });
  }

  onSubmit() {
    if (this.articleForm.valid) {
      console.log('Article data:', this.articleForm.value);
      // Process form submission
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.articleForm.controls).forEach(key => {
      const control = this.articleForm.get(key);
      control?.markAsTouched();
    });
  }
}
```

## Custom Toolbar Configuration

### Minimal Toolbar

```typescript
import { Component } from '@angular/core';
import { ToolbarConfig } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-minimal-toolbar',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="minimalToolbar">
    </wysiwyg-editor>
  `
})
export class MinimalToolbarComponent {
  content = '';
  
  minimalToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' }
    ],
    theme: 'light'
  };
}
```

### Full-Featured Toolbar

```typescript
@Component({
  selector: 'app-full-toolbar',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="fullToolbar"
      [height]="'400px'">
    </wysiwyg-editor>
  `
})
export class FullToolbarComponent {
  content = '';
  
  fullToolbar: ToolbarConfig = {
    tools: [
      // Text formatting
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold', tooltip: 'Bold (Ctrl+B)' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic', tooltip: 'Italic (Ctrl+I)' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline', tooltip: 'Underline (Ctrl+U)' },
      { type: 'button', command: 'separator', separator: true },
      
      // Font options
      { 
        type: 'dropdown', 
        command: 'fontSize', 
        label: 'Font Size',
        options: [
          { value: '10px', label: '10px' },
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' },
          { value: '18px', label: '18px' },
          { value: '20px', label: '20px' },
          { value: '24px', label: '24px' },
          { value: '32px', label: '32px' }
        ]
      },
      
      // Colors
      { 
        type: 'dropdown', 
        command: 'foreColor', 
        label: 'Text Color',
        icon: 'text-color',
        options: [
          { value: '#000000', label: 'Black' },
          { value: '#FF0000', label: 'Red' },
          { value: '#00FF00', label: 'Green' },
          { value: '#0000FF', label: 'Blue' },
          { value: '#FFFF00', label: 'Yellow' },
          { value: '#FF00FF', label: 'Magenta' },
          { value: '#00FFFF', label: 'Cyan' }
        ]
      },
      
      { type: 'button', command: 'separator', separator: true },
      
      // Alignment
      { type: 'button', command: 'justifyLeft', icon: 'align-left', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'align-center', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'align-right', label: 'Align Right' },
      { type: 'button', command: 'justifyFull', icon: 'align-justify', label: 'Justify' },
      
      { type: 'button', command: 'separator', separator: true },
      
      // Lists
      { type: 'button', command: 'insertUnorderedList', icon: 'list-ul', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'list-ol', label: 'Numbered List' },
      { type: 'button', command: 'indent', icon: 'indent', label: 'Increase Indent' },
      { type: 'button', command: 'outdent', icon: 'outdent', label: 'Decrease Indent' },
      
      { type: 'button', command: 'separator', separator: true },
      
      // Links and media
      { type: 'button', command: 'createLink', icon: 'link', label: 'Insert Link' },
      { type: 'button', command: 'unlink', icon: 'unlink', label: 'Remove Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Insert Image' },
      
      { type: 'button', command: 'separator', separator: true },
      
      // History
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ],
    theme: 'light',
    sticky: true
  };
}
```

### Custom Theme Toolbar

```typescript
@Component({
  selector: 'app-dark-theme',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="darkToolbar"
      class="dark-theme">
    </wysiwyg-editor>
  `,
  styles: [`
    .dark-theme {
      --editor-background: #2d2d2d;
      --editor-text-color: #ffffff;
      --toolbar-background: #1e1e1e;
      --button-hover-background: #404040;
    }
  `]
})
export class DarkThemeComponent {
  content = '';
  
  darkToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' }
    ],
    theme: 'dark'
  };
}
```

## Event Handling

### Content Change Events

```typescript
@Component({
  selector: 'app-event-handling',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      (contentChange)="onContentChange($event)"
      (selectionChange)="onSelectionChange($event)"
      (focus)="onFocus()"
      (blur)="onBlur()">
    </wysiwyg-editor>
    
    <div class="editor-info">
      <p>Content Length: {{ contentLength }}</p>
      <p>Word Count: {{ wordCount }}</p>
      <p>Has Selection: {{ hasSelection }}</p>
      <p>Editor Focused: {{ isFocused }}</p>
    </div>
  `
})
export class EventHandlingComponent {
  content = '';
  contentLength = 0;
  wordCount = 0;
  hasSelection = false;
  isFocused = false;

  onContentChange(content: string) {
    this.content = content;
    this.contentLength = content.length;
    this.wordCount = this.countWords(content);
    console.log('Content changed:', content);
  }

  onSelectionChange(selection: SelectionState) {
    this.hasSelection = !selection.collapsed;
    console.log('Selection changed:', selection);
  }

  onFocus() {
    this.isFocused = true;
    console.log('Editor focused');
  }

  onBlur() {
    this.isFocused = false;
    console.log('Editor blurred');
  }

  private countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }
}
```

### Auto-Save Implementation

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-auto-save',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      (contentChange)="onContentChange($event)"
      placeholder="Your content will be auto-saved...">
    </wysiwyg-editor>
    
    <div class="save-status">
      <span [class]="saveStatusClass">{{ saveStatus }}</span>
    </div>
  `
})
export class AutoSaveComponent implements OnDestroy {
  content = '';
  saveStatus = 'All changes saved';
  saveStatusClass = 'saved';
  
  private contentChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    // Auto-save after 2 seconds of inactivity
    this.contentChange$
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(content => {
        this.autoSave(content);
      });
  }

  onContentChange(content: string) {
    this.saveStatus = 'Saving...';
    this.saveStatusClass = 'saving';
    this.contentChange$.next(content);
  }

  private autoSave(content: string) {
    // Simulate API call
    setTimeout(() => {
      console.log('Auto-saved content:', content);
      this.saveStatus = 'All changes saved';
      this.saveStatusClass = 'saved';
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Styling and Theming

### Custom CSS Variables

```typescript
@Component({
  selector: 'app-custom-styling',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      class="custom-editor">
    </wysiwyg-editor>
  `,
  styles: [`
    .custom-editor {
      /* Editor container */
      --editor-border: 2px solid #007bff;
      --editor-border-radius: 8px;
      --editor-background: #f8f9fa;
      
      /* Toolbar styling */
      --toolbar-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --toolbar-border-radius: 8px 8px 0 0;
      --toolbar-padding: 12px;
      
      /* Button styling */
      --button-background: transparent;
      --button-color: white;
      --button-hover-background: rgba(255, 255, 255, 0.1);
      --button-active-background: rgba(255, 255, 255, 0.2);
      --button-border-radius: 4px;
      --button-padding: 8px 12px;
      
      /* Content area */
      --content-background: white;
      --content-color: #333;
      --content-padding: 16px;
      --content-font-family: 'Georgia', serif;
      --content-line-height: 1.6;
      
      /* Focus states */
      --editor-focus-border: 2px solid #007bff;
      --editor-focus-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }
  `]
})
export class CustomStylingComponent {
  content = '<p>This editor has custom styling!</p>';
}
```

### Responsive Design

```typescript
@Component({
  selector: 'app-responsive-editor',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="responsiveToolbar"
      class="responsive-editor">
    </wysiwyg-editor>
  `,
  styles: [`
    .responsive-editor {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .responsive-editor {
        --toolbar-padding: 8px;
        --button-padding: 6px 8px;
        --content-padding: 12px;
      }
    }
    
    @media (max-width: 480px) {
      .responsive-editor {
        --toolbar-padding: 4px;
        --button-padding: 4px 6px;
        --content-padding: 8px;
      }
    }
  `]
})
export class ResponsiveEditorComponent {
  content = '';
  
  responsiveToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold' },
      { type: 'button', command: 'italic', icon: 'italic' },
      { type: 'button', command: 'createLink', icon: 'link' },
      { type: 'button', command: 'insertImage', icon: 'image' }
    ]
  };
}
```

## Advanced Configuration

### Content Sanitization

```typescript
import { Component } from '@angular/core';
import { EditorConfig } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-sanitized-editor',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [config]="editorConfig">
    </wysiwyg-editor>
  `
})
export class SanitizedEditorComponent {
  content = '';
  
  editorConfig: EditorConfig = {
    toolbar: {
      tools: [
        { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
        { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
      ]
    },
    sanitizer: {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
      allowedAttributes: {
        'a': ['href', 'title'],
        '*': ['class']
      },
      stripTags: true,
      stripAttributes: true
    }
  };
}
```

### Custom Validation

```typescript
import { Component } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-validated-editor',
  template: `
    <form [formGroup]="form">
      <wysiwyg-editor 
        formControlName="content"
        placeholder="Enter at least 50 characters...">
      </wysiwyg-editor>
      
      <div *ngIf="form.get('content')?.errors?.['minLength']" class="error">
        Content must be at least 50 characters long
      </div>
      
      <div *ngIf="form.get('content')?.errors?.['maxLength']" class="error">
        Content cannot exceed 1000 characters
      </div>
      
      <div *ngIf="form.get('content')?.errors?.['forbiddenWords']" class="error">
        Content contains forbidden words
      </div>
    </form>
  `
})
export class ValidatedEditorComponent {
  form = this.fb.group({
    content: ['', [
      this.minLengthValidator(50),
      this.maxLengthValidator(1000),
      this.forbiddenWordsValidator(['spam', 'forbidden'])
    ]]
  });

  constructor(private fb: FormBuilder) {}

  private minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const text = control.value?.replace(/<[^>]*>/g, '') || '';
      return text.length < minLength ? { minLength: { actual: text.length, required: minLength } } : null;
    };
  }

  private maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const text = control.value?.replace(/<[^>]*>/g, '') || '';
      return text.length > maxLength ? { maxLength: { actual: text.length, max: maxLength } } : null;
    };
  }

  private forbiddenWordsValidator(forbiddenWords: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const text = (control.value || '').toLowerCase();
      const foundWords = forbiddenWords.filter(word => text.includes(word.toLowerCase()));
      return foundWords.length > 0 ? { forbiddenWords: { words: foundWords } } : null;
    };
  }
}
```

## Programmatic Control

### Programmatic Content Manipulation

```typescript
import { Component, ViewChild } from '@angular/core';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-programmatic-control',
  template: `
    <wysiwyg-editor 
      #editor
      [(ngModel)]="content">
    </wysiwyg-editor>
    
    <div class="controls">
      <button (click)="insertText()">Insert Text</button>
      <button (click)="insertHTML()">Insert HTML</button>
      <button (click)="formatSelection()">Format Selection</button>
      <button (click)="clearContent()">Clear Content</button>
      <button (click)="focusEditor()">Focus Editor</button>
    </div>
  `
})
export class ProgrammaticControlComponent {
  @ViewChild('editor') editor!: WysiwygEditorComponent;
  content = '<p>Initial content</p>';

  insertText() {
    this.editor.insertHTML('Inserted text at cursor position. ');
  }

  insertHTML() {
    const html = '<strong>Bold text</strong> and <em>italic text</em>';
    this.editor.insertHTML(html);
  }

  formatSelection() {
    this.editor.executeCommand({ name: 'bold' });
  }

  clearContent() {
    this.editor.setContent('');
  }

  focusEditor() {
    this.editor.focus();
  }
}
```

### Dynamic Toolbar Configuration

```typescript
@Component({
  selector: 'app-dynamic-toolbar',
  template: `
    <div class="toolbar-presets">
      <button (click)="setBasicToolbar()">Basic</button>
      <button (click)="setAdvancedToolbar()">Advanced</button>
      <button (click)="setMinimalToolbar()">Minimal</button>
    </div>
    
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="currentToolbar">
    </wysiwyg-editor>
  `
})
export class DynamicToolbarComponent {
  content = '';
  currentToolbar: ToolbarConfig;

  private basicToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' }
    ]
  };

  private advancedToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'dropdown', command: 'fontSize', label: 'Size', options: [
        { value: '12px', label: '12px' },
        { value: '14px', label: '14px' },
        { value: '16px', label: '16px' }
      ]},
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' }
    ]
  };

  private minimalToolbar: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'B' }
    ]
  };

  constructor() {
    this.currentToolbar = this.basicToolbar;
  }

  setBasicToolbar() {
    this.currentToolbar = { ...this.basicToolbar };
  }

  setAdvancedToolbar() {
    this.currentToolbar = { ...this.advancedToolbar };
  }

  setMinimalToolbar() {
    this.currentToolbar = { ...this.minimalToolbar };
  }
}
```

## Performance Optimization

### Large Document Handling

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-large-document',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      (contentChange)="onContentChange($event)"
      [height]="'500px'"
      placeholder="This editor is optimized for large documents...">
    </wysiwyg-editor>
    
    <div class="document-stats">
      <p>Characters: {{ characterCount }}</p>
      <p>Words: {{ wordCount }}</p>
      <p>Performance: {{ performanceStatus }}</p>
    </div>
  `
})
export class LargeDocumentComponent implements OnInit, OnDestroy {
  content = '';
  characterCount = 0;
  wordCount = 0;
  performanceStatus = 'Good';
  
  private contentChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Debounce content changes for performance
    this.contentChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(content => {
        this.updateStats(content);
      });
  }

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  private updateStats(content: string) {
    const startTime = performance.now();
    
    this.characterCount = content.length;
    const text = content.replace(/<[^>]*>/g, '');
    this.wordCount = text.trim() ? text.split(/\s+/).length : 0;
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    if (processingTime < 10) {
      this.performanceStatus = 'Excellent';
    } else if (processingTime < 50) {
      this.performanceStatus = 'Good';
    } else {
      this.performanceStatus = 'Slow';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Memory Management

```typescript
@Component({
  selector: 'app-memory-optimized',
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      (contentChange)="onContentChange($event)"
      (focus)="onFocus()"
      (blur)="onBlur()">
    </wysiwyg-editor>
  `
})
export class MemoryOptimizedComponent implements OnDestroy {
  content = '';
  private subscriptions: Subscription[] = [];
  private contentHistory: string[] = [];
  private maxHistorySize = 50;

  onContentChange(content: string) {
    // Limit history size to prevent memory leaks
    this.contentHistory.push(content);
    if (this.contentHistory.length > this.maxHistorySize) {
      this.contentHistory.shift();
    }
  }

  onFocus() {
    // Lazy load additional features when editor is focused
    this.loadAdvancedFeatures();
  }

  onBlur() {
    // Clean up resources when editor loses focus
    this.cleanupResources();
  }

  private loadAdvancedFeatures() {
    // Load features only when needed
    console.log('Loading advanced features...');
  }

  private cleanupResources() {
    // Clean up temporary resources
    console.log('Cleaning up resources...');
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.contentHistory = [];
  }
}
```

These examples demonstrate various ways to use the Angular WYSIWYG Editor effectively in different scenarios. Each example focuses on specific use cases and best practices for optimal performance and user experience.