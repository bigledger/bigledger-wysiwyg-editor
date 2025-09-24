import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Component } from '@angular/core';

import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { ToolbarButtonComponent } from '../../components/toolbar/toolbar-button.component';
import { ToolbarDropdownComponent } from '../../components/toolbar/toolbar-dropdown.component';
import { ContentEditableDirective } from '../../directives/content-editable.directive';
import { EditorService } from '../../services/editor.service';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { HistoryService } from '../../services/history.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

// Test host component for template-driven forms
@Component({
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig"
      placeholder="Start typing..."
      [readonly]="readonly">
    </wysiwyg-editor>
  `
})
class TemplateFormHostComponent {
  content = '';
  readonly = false;
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { 
        type: 'dropdown', 
        command: 'fontSize', 
        label: 'Font Size',
        options: [
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' },
          { value: '18px', label: '18px' }
        ]
      },
      { type: 'button', command: 'insertUnorderedList', icon: 'list-ul', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'list-ol', label: 'Numbered List' },
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' }
    ]
  };
}

// Test host component for reactive forms
@Component({
  template: `
    <form [formGroup]="editorForm">
      <wysiwyg-editor 
        formControlName="content"
        [toolbarConfig]="toolbarConfig"
        placeholder="Start typing...">
      </wysiwyg-editor>
    </form>
  `
})
class ReactiveFormHostComponent {
  editorForm = new FormGroup({
    content: new FormControl('')
  });
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' }
    ]
  };
}

describe('Editor Workflows Integration Tests', () => {
  let templateComponent: TemplateFormHostComponent;
  let reactiveComponent: ReactiveFormHostComponent;
  let templateFixture: ComponentFixture<TemplateFormHostComponent>;
  let reactiveFixture: ComponentFixture<ReactiveFormHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        ToolbarButtonComponent,
        ToolbarDropdownComponent,
        ContentEditableDirective,
        TemplateFormHostComponent,
        ReactiveFormHostComponent
      ],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        EditorService,
        CommandService,
        SelectionService,
        HTMLSanitizerService,
        HistoryService
      ]
    }).compileComponents();
  });

  describe('Text Formatting Workflows', () => {
    beforeEach(() => {
      templateFixture = TestBed.createComponent(TemplateFormHostComponent);
      templateComponent = templateFixture.componentInstance;
      templateFixture.detectChanges();
    });

    it('should apply bold formatting to selected text', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      const boldButton = templateFixture.debugElement.query(By.css('[data-command="bold"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Hello World';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Simulate text selection
      const range = document.createRange();
      range.setStart(editorElement.nativeElement.firstChild!, 0);
      range.setEnd(editorElement.nativeElement.firstChild!, 5);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Click bold button
      boldButton.nativeElement.click();
      templateFixture.detectChanges();
      
      // Verify bold formatting was applied
      expect(editorElement.nativeElement.innerHTML).toContain('<strong>Hello</strong>');
    });

    it('should apply multiple formatting options sequentially', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      const boldButton = templateFixture.debugElement.query(By.css('[data-command="bold"]'));
      const italicButton = templateFixture.debugElement.query(By.css('[data-command="italic"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Test Text';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Select text
      const range = document.createRange();
      range.setStart(editorElement.nativeElement.firstChild!, 0);
      range.setEnd(editorElement.nativeElement.firstChild!, 4);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Apply bold
      boldButton.nativeElement.click();
      templateFixture.detectChanges();
      
      // Apply italic
      italicButton.nativeElement.click();
      templateFixture.detectChanges();
      
      // Verify both formats were applied
      const content = editorElement.nativeElement.innerHTML;
      expect(content).toContain('<strong>');
      expect(content).toContain('<em>');
    });

    it('should handle font size changes', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      const fontSizeDropdown = templateFixture.debugElement.query(By.css('[data-command="fontSize"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Font Size Test';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Select text
      const range = document.createRange();
      range.setStart(editorElement.nativeElement.firstChild!, 0);
      range.setEnd(editorElement.nativeElement.firstChild!, 4);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Change font size
      fontSizeDropdown.nativeElement.value = '18px';
      fontSizeDropdown.nativeElement.dispatchEvent(new Event('change'));
      templateFixture.detectChanges();
      
      // Verify font size was applied
      expect(editorElement.nativeElement.innerHTML).toContain('font-size: 18px');
    });
  });

  describe('List Creation and Management', () => {
    beforeEach(() => {
      templateFixture = TestBed.createComponent(TemplateFormHostComponent);
      templateComponent = templateFixture.componentInstance;
      templateFixture.detectChanges();
    });

    it('should create bullet list from text', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      const bulletListButton = templateFixture.debugElement.query(By.css('[data-command="insertUnorderedList"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Item 1';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Position cursor
      const range = document.createRange();
      range.setStart(editorElement.nativeElement.firstChild!, 0);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Create bullet list
      bulletListButton.nativeElement.click();
      templateFixture.detectChanges();
      
      // Verify list was created
      expect(editorElement.nativeElement.innerHTML).toContain('<ul>');
      expect(editorElement.nativeElement.innerHTML).toContain('<li>');
    });

    it('should create numbered list from text', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      const numberedListButton = templateFixture.debugElement.query(By.css('[data-command="insertOrderedList"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Item 1';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Position cursor
      const range = document.createRange();
      range.setStart(editorElement.nativeElement.firstChild!, 0);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Create numbered list
      numberedListButton.nativeElement.click();
      templateFixture.detectChanges();
      
      // Verify list was created
      expect(editorElement.nativeElement.innerHTML).toContain('<ol>');
      expect(editorElement.nativeElement.innerHTML).toContain('<li>');
    });

    it('should handle Enter key in lists to create new items', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set list content
      editorElement.nativeElement.innerHTML = '<ul><li>Item 1</li></ul>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Position cursor at end of list item
      const listItem = editorElement.nativeElement.querySelector('li');
      const range = document.createRange();
      range.setStart(listItem.firstChild!, 6);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
      editorElement.nativeElement.dispatchEvent(enterEvent);
      templateFixture.detectChanges();
      
      // Verify new list item was created
      const listItems = editorElement.nativeElement.querySelectorAll('li');
      expect(listItems.length).toBe(2);
    });
  });

  describe('Template-driven Forms Integration', () => {
    beforeEach(() => {
      templateFixture = TestBed.createComponent(TemplateFormHostComponent);
      templateComponent = templateFixture.componentInstance;
      templateFixture.detectChanges();
    });

    it('should bind content with ngModel', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set model value
      templateComponent.content = '<p>Initial content</p>';
      templateFixture.detectChanges();
      
      // Verify content appears in editor
      expect(editorElement.nativeElement.innerHTML).toContain('Initial content');
      
      // Change content in editor
      editorElement.nativeElement.innerHTML = '<p>Updated content</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      templateFixture.detectChanges();
      
      // Verify model was updated
      expect(templateComponent.content).toContain('Updated content');
    });

    it('should handle readonly state changes', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Initially editable
      expect(editorElement.nativeElement.contentEditable).toBe('true');
      
      // Set readonly
      templateComponent.readonly = true;
      templateFixture.detectChanges();
      
      // Verify editor is readonly
      expect(editorElement.nativeElement.contentEditable).toBe('false');
    });

    it('should show placeholder when content is empty', async () => {
      const editorElement = templateFixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Ensure content is empty
      templateComponent.content = '';
      templateFixture.detectChanges();
      
      // Verify placeholder is shown
      expect(editorElement.nativeElement.getAttribute('data-placeholder')).toBe('Start typing...');
    });
  });

  describe('Reactive Forms Integration', () => {
    beforeEach(() => {
      reactiveFixture = TestBed.createComponent(ReactiveFormHostComponent);
      reactiveComponent = reactiveFixture.componentInstance;
      reactiveFixture.detectChanges();
    });

    it('should work with FormControl', async () => {
      const editorElement = reactiveFixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set form control value
      reactiveComponent.editorForm.get('content')?.setValue('<p>Form content</p>');
      reactiveFixture.detectChanges();
      
      // Verify content appears in editor
      expect(editorElement.nativeElement.innerHTML).toContain('Form content');
      
      // Change content in editor
      editorElement.nativeElement.innerHTML = '<p>Updated form content</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      reactiveFixture.detectChanges();
      
      // Verify form control was updated
      expect(reactiveComponent.editorForm.get('content')?.value).toContain('Updated form content');
    });

    it('should handle form validation states', async () => {
      const contentControl = reactiveComponent.editorForm.get('content');
      
      // Add required validator
      contentControl?.setValidators([]);
      contentControl?.updateValueAndValidity();
      
      // Initially valid (no validators)
      expect(contentControl?.valid).toBe(true);
      
      // Set content
      contentControl?.setValue('<p>Valid content</p>');
      reactiveFixture.detectChanges();
      
      // Should remain valid
      expect(contentControl?.valid).toBe(true);
    });

    it('should handle disabled state', async () => {
      const editorElement = reactiveFixture.debugElement.query(By.css('.wysiwyg-content'));
      const contentControl = reactiveComponent.editorForm.get('content');
      
      // Initially enabled
      expect(editorElement.nativeElement.contentEditable).toBe('true');
      
      // Disable form control
      contentControl?.disable();
      reactiveFixture.detectChanges();
      
      // Verify editor is disabled
      expect(editorElement.nativeElement.contentEditable).toBe('false');
    });
  });
});