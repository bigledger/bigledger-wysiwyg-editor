import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { LinkDialogComponent } from '../../components/dialogs/link-dialog/link-dialog.component';
import { ImageDialogComponent } from '../../components/dialogs/image-dialog/image-dialog.component';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HistoryService } from '../../services/history.service';
import { EditorService } from '../../services/editor.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <div class="test-container">
      <form [formGroup]="testForm">
        <wysiwyg-editor
          formControlName="content"
          [toolbarConfig]="toolbarConfig"
          [height]="height"
          [placeholder]="placeholder"
          [readonly]="readonly"
          (contentChange)="onContentChange($event)"
          (selectionChange)="onSelectionChange($event)">
        </wysiwyg-editor>
        
        <div class="form-controls">
          <button type="button" (click)="toggleReadonly()">Toggle Readonly</button>
          <button type="button" (click)="clearContent()">Clear Content</button>
          <button type="button" (click)="setComplexContent()">Set Complex Content</button>
          <button type="button" (click)="validateForm()">Validate Form</button>
        </div>
        
        <div class="status-display">
          <div>Form Valid: {{ testForm.valid }}</div>
          <div>Form Dirty: {{ testForm.dirty }}</div>
          <div>Content Length: {{ contentLength }}</div>
          <div>Selection Active: {{ hasSelection }}</div>
          <div>Last Change: {{ lastChangeTime }}</div>
        </div>
      </form>
    </div>
  `
})
class ComprehensiveTestComponent {
  testForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.minLength(10)])
  });
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'dropdown', command: 'fontSize', label: 'Font Size', options: [
        { value: '12px', label: '12px' },
        { value: '14px', label: '14px' },
        { value: '16px', label: '16px' },
        { value: '18px', label: '18px' }
      ]},
      { type: 'dropdown', command: 'foreColor', label: 'Text Color', options: [
        { value: '#000000', label: 'Black' },
        { value: '#ff0000', label: 'Red' },
        { value: '#00ff00', label: 'Green' },
        { value: '#0000ff', label: 'Blue' }
      ]},
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' },
      { type: 'button', command: 'insertUnorderedList', icon: 'list-ul', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'list-ol', label: 'Numbered List' },
      { type: 'button', command: 'justifyLeft', icon: 'align-left', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'align-center', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'align-right', label: 'Align Right' },
      { type: 'button', command: 'justifyFull', icon: 'align-justify', label: 'Justify' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };
  
  height = '400px';
  placeholder = 'Enter your content here...';
  readonly = false;
  
  contentLength = 0;
  hasSelection = false;
  lastChangeTime = '';
  
  contentChanges: string[] = [];
  selectionChanges: any[] = [];

  onContentChange(content: string): void {
    this.contentChanges.push(content);
    this.contentLength = content.length;
    this.lastChangeTime = new Date().toISOString();
  }

  onSelectionChange(selection: any): void {
    this.selectionChanges.push(selection);
    this.hasSelection = selection && !selection.collapsed;
  }
  
  toggleReadonly(): void {
    this.readonly = !this.readonly;
  }
  
  clearContent(): void {
    this.testForm.get('content')?.setValue('');
  }
  
  setComplexContent(): void {
    const complexContent = `
      <h1>Complex Document</h1>
      <p>This is a <strong>bold</strong> and <em>italic</em> text with <u>underline</u>.</p>
      <ul>
        <li>First bullet point</li>
        <li>Second bullet point with <a href="https://example.com">link</a></li>
        <li>Third bullet point</li>
      </ul>
      <ol>
        <li>First numbered item</li>
        <li>Second numbered item</li>
      </ol>
      <p style="text-align: center;">Centered text</p>
      <p style="text-align: right;">Right-aligned text</p>
      <p>Text with <span style="color: red;">red color</span> and <span style="font-size: 18px;">large font</span>.</p>
    `;
    this.testForm.get('content')?.setValue(complexContent);
  }
  
  validateForm(): void {
    this.testForm.markAllAsTouched();
    this.testForm.updateValueAndValidity();
  }
}

describe('Comprehensive Editor Workflows Integration Tests', () => {
  let component: ComprehensiveTestComponent;
  let fixture: ComponentFixture<ComprehensiveTestComponent>;
  let editorComponent: WysiwygEditorComponent;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let historyService: jasmine.SpyObj<HistoryService>;
  let editorService: jasmine.SpyObj<EditorService>;
  let sanitizerService: jasmine.SpyObj<HTMLSanitizerService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand', 'isCommandSupported', 'isCommandEnabled', 
      'getCommandState', 'getCommandValue', 'insertImage', 'createLink',
      'undo', 'redo', 'canUndo', 'canRedo', 'insertHTML', 'insertText',
      'removeFormatting', 'executeCommands', 'alignLeft', 'alignCenter',
      'alignRight', 'alignJustify', 'getCurrentAlignment', 'isAlignedLeft',
      'isAlignedCenter', 'isAlignedRight', 'isAlignedJustify', 'saveState',
      'initializeHistory', 'clearHistory', 'getHistoryService'
    ]);
    
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection', 'restoreSelection', 'getSelection', 'getRange',
      'selectAll', 'collapse', 'hasSelection', 'getSelectedText',
      'wrapSelection'
    ]);
    
    const historyServiceSpy = jasmine.createSpyObj('HistoryService', [
      'addState', 'undo', 'redo', 'canUndo', 'canRedo', 'clear',
      'getStates', 'getCurrentIndex', 'setMaxStates'
    ]);
    
    const editorServiceSpy = jasmine.createSpyObj('EditorService', [
      'executeCommand', 'setContent', 'getContent', 'focus', 'blur',
      'getCurrentSelection', 'getContentObservable', 'getSelectionObservable'
    ]);
    
    const sanitizerServiceSpy = jasmine.createSpyObj('HTMLSanitizerService', [
      'sanitize', 'stripTags', 'cleanAttributes', 'isValidHTML'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ComprehensiveTestComponent,
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        LinkDialogComponent,
        ImageDialogComponent,
        ReactiveFormsModule
      ],

      providers: [
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        { provide: EditorService, useValue: editorServiceSpy },
        { provide: HTMLSanitizerService, useValue: sanitizerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprehensiveTestComponent);
    component = fixture.componentInstance;
    editorComponent = fixture.debugElement.query(By.directive(WysiwygEditorComponent)).componentInstance;
    
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    historyService = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;
    editorService = TestBed.inject(EditorService) as jasmine.SpyObj<EditorService>;
    sanitizerService = TestBed.inject(HTMLSanitizerService) as jasmine.SpyObj<HTMLSanitizerService>;

    // Setup default spy returns
    commandService.executeCommand.and.returnValue(true);
    commandService.isCommandSupported.and.returnValue(true);
    commandService.isCommandEnabled.and.returnValue(true);
    commandService.getCommandState.and.returnValue(false);
    commandService.getCommandValue.and.returnValue('');
    commandService.canUndo.and.returnValue(false);
    commandService.canRedo.and.returnValue(false);
    commandService.getCurrentAlignment.and.returnValue('left');
    
    selectionService.hasSelection.and.returnValue(false);
    selectionService.getSelectedText.and.returnValue('');
    
    historyService.canUndo.and.returnValue(false);
    historyService.canRedo.and.returnValue(false);
    
    sanitizerService.sanitize.and.returnValue('');
    sanitizerService.isValidHTML.and.returnValue(true);

    fixture.detectChanges();
  });

  describe('Complete Text Formatting Workflow', () => {
    it('should handle complete text formatting with all available options', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Type initial content
      contentElement.nativeElement.innerHTML = '<p>Sample text for formatting</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Simulate text selection
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue('Sample');
      
      // Apply bold formatting
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
      
      // Apply italic formatting
      const italicButton = fixture.debugElement.query(By.css('[data-command="italic"]'));
      italicButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'italic' });
      
      // Apply underline formatting
      const underlineButton = fixture.debugElement.query(By.css('[data-command="underline"]'));
      underlineButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'underline' });
      
      // Change font size
      const fontSizeDropdown = fixture.debugElement.query(By.css('[data-command="fontSize"]'));
      const changeEvent = new Event('change');
      Object.defineProperty(changeEvent, 'target', {
        value: { value: '18px' },
        enumerable: true
      });
      fontSizeDropdown.nativeElement.dispatchEvent(changeEvent);
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'fontSize' }, '18px');
      
      // Change text color
      const colorDropdown = fixture.debugElement.query(By.css('[data-command="foreColor"]'));
      const colorChangeEvent = new Event('change');
      Object.defineProperty(colorChangeEvent, 'target', {
        value: { value: '#ff0000' },
        enumerable: true
      });
      colorDropdown.nativeElement.dispatchEvent(colorChangeEvent);
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'foreColor' }, '#ff0000');
    }));
  });

  describe('Complete List Management Workflow', () => {
    it('should handle bullet list creation and manipulation', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Create initial content
      contentElement.nativeElement.innerHTML = '<p>First item</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Create bullet list
      const bulletListButton = fixture.debugElement.query(By.css('[data-command="insertUnorderedList"]'));
      bulletListButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'insertUnorderedList' });
      
      // Simulate Enter key for new list item
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      contentElement.nativeElement.dispatchEvent(enterEvent);
      tick();
      
      // Simulate Tab key for indentation
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      contentElement.nativeElement.dispatchEvent(tabEvent);
      tick();
      
      // Simulate Shift+Tab for outdentation
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      contentElement.nativeElement.dispatchEvent(shiftTabEvent);
      tick();
    }));

    it('should handle numbered list creation and manipulation', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Create numbered list
      const numberedListButton = fixture.debugElement.query(By.css('[data-command="insertOrderedList"]'));
      numberedListButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'insertOrderedList' });
    }));
  });

  describe('Complete Text Alignment Workflow', () => {
    it('should handle all text alignment options', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Add content
      contentElement.nativeElement.innerHTML = '<p>Text to align</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Test all alignment options
      const alignments = ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
      
      alignments.forEach(alignment => {
        const alignButton = fixture.debugElement.query(By.css(`[data-command="${alignment}"]`));
        alignButton.nativeElement.click();
        tick();
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: alignment });
      });
    }));
  });

  describe('Complete Link Management Workflow', () => {
    it('should handle complete link creation, editing, and removal workflow', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Add content and select text
      contentElement.nativeElement.innerHTML = '<p>Click here for more info</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue('Click here');
      
      // Open link dialog
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      linkButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      expect(editorComponent.linkDialogVisible).toBeTruthy();
      
      // Create link
      const linkData = { url: 'https://example.com', text: 'Click here' };
      editorComponent.onLinkCreated(linkData);
      tick();
      
      expect(commandService.createLink).toHaveBeenCalledWith(linkData.url, linkData.text);
      expect(editorComponent.linkDialogVisible).toBeFalsy();
      
      // Test link editing
      editorComponent['currentLinkData'] = linkData;
      editorComponent['isEditingLink'] = true;
      
      linkButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const updatedLinkData = { url: 'https://updated-example.com', text: 'Updated link' };
      editorComponent.onLinkCreated(updatedLinkData);
      tick();
      
      expect(commandService.createLink).toHaveBeenCalledWith(updatedLinkData.url, updatedLinkData.text);
    }));
  });

  describe('Complete Image Management Workflow', () => {
    it('should handle complete image insertion and management workflow', fakeAsync(() => {
      // Open image dialog
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      imageButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      expect(editorComponent.imageDialogVisible).toBeTruthy();
      
      // Insert image by URL
      const imageData = { src: 'https://example.com/image.jpg', alt: 'Test image', width: 300, height: 200 };
      editorComponent.onImageInserted(imageData);
      tick();
      
      expect(commandService.insertImage).toHaveBeenCalledWith(imageData);
      expect(editorComponent.imageDialogVisible).toBeFalsy();
      
      // Test file upload simulation
      imageButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      if (imageDialog) {
        const fileInput = imageDialog.query(By.css('input[type="file"]'));
        if (fileInput) {
          const mockFile = new File([''], 'test-image.jpg', { type: 'image/jpeg' });
          const fileList = {
            0: mockFile,
            length: 1,
            item: (index: number) => mockFile,
            [Symbol.iterator]: function* () {
              for (let i = 0; i < this.length; i++) {
                yield this[i];
              }
            }
          } as FileList;
          
          Object.defineProperty(fileInput.nativeElement, 'files', {
            value: fileList,
            writable: false
          });
          
          const changeEvent = new Event('change');
          fileInput.nativeElement.dispatchEvent(changeEvent);
          tick();
          
          expect(fileInput.nativeElement.files?.length).toBe(1);
        }
      }
    }));
  });

  describe('Complete Undo/Redo Workflow', () => {
    it('should handle complete undo/redo workflow with history management', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Create initial content
      contentElement.nativeElement.innerHTML = '<p>Initial content</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Make several changes
      const changes = [
        '<p>Initial content with <strong>bold</strong></p>',
        '<p>Initial content with <strong>bold</strong> and <em>italic</em></p>',
        '<p>Initial content with <strong>bold</strong> and <em>italic</em> and <u>underline</u></p>'
      ];
      
      changes.forEach(change => {
        contentElement.nativeElement.innerHTML = change;
        contentElement.nativeElement.dispatchEvent(new Event('input'));
        tick();
      });
      
      // Enable undo
      historyService.canUndo.and.returnValue(true);
      commandService.canUndo.and.returnValue(true);
      fixture.detectChanges();
      
      // Test multiple undo operations
      const undoButton = fixture.debugElement.query(By.css('[data-command="undo"]'));
      
      for (let i = 0; i < 3; i++) {
        undoButton.nativeElement.click();
        tick();
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'undo' });
      }
      
      // Enable redo
      historyService.canRedo.and.returnValue(true);
      commandService.canRedo.and.returnValue(true);
      fixture.detectChanges();
      
      // Test multiple redo operations
      const redoButton = fixture.debugElement.query(By.css('[data-command="redo"]'));
      
      for (let i = 0; i < 2; i++) {
        redoButton.nativeElement.click();
        tick();
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'redo' });
      }
    }));
  });

  describe('Complete Keyboard Shortcuts Workflow', () => {
    it('should handle all keyboard shortcuts comprehensively', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Add content
      contentElement.nativeElement.innerHTML = '<p>Keyboard shortcut test</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Test all keyboard shortcuts
      const shortcuts = [
        { key: 'b', ctrlKey: true, command: 'bold' },
        { key: 'i', ctrlKey: true, command: 'italic' },
        { key: 'u', ctrlKey: true, command: 'underline' },
        { key: 'k', ctrlKey: true, command: 'createLink' },
        { key: 'z', ctrlKey: true, command: 'undo' },
        { key: 'y', ctrlKey: true, command: 'redo' }
      ];
      
      shortcuts.forEach(shortcut => {
        const keyEvent = new KeyboardEvent('keydown', {
          key: shortcut.key,
          ctrlKey: shortcut.ctrlKey
        });
        spyOn(keyEvent, 'preventDefault');
        
        contentElement.nativeElement.dispatchEvent(keyEvent);
        tick();
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: shortcut.command });
      });
    }));
  });

  describe('Complete Form Integration Workflow', () => {
    it('should handle complete reactive forms integration with validation', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Test initial form state
      expect(component.testForm.valid).toBeFalsy();
      expect(component.testForm.get('content')?.errors?.['required']).toBeTruthy();
      
      // Add content that's too short
      contentElement.nativeElement.innerHTML = '<p>Short</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      expect(component.testForm.get('content')?.errors?.['minlength']).toBeTruthy();
      
      // Add sufficient content
      const validContent = '<p>This is a long enough content to pass validation</p>';
      contentElement.nativeElement.innerHTML = validContent;
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      expect(component.testForm.valid).toBeTruthy();
      expect(component.testForm.get('content')?.value).toContain('long enough content');
      
      // Test form controls
      const clearButton = fixture.debugElement.query(By.css('button:contains("Clear Content")'));
      if (clearButton) {
        clearButton.nativeElement.click();
        tick();
        expect(component.testForm.get('content')?.value).toBe('');
      }
      
      // Test complex content setting
      const complexButton = fixture.debugElement.query(By.css('button:contains("Set Complex Content")'));
      if (complexButton) {
        complexButton.nativeElement.click();
        tick();
        expect(component.testForm.get('content')?.value).toContain('Complex Document');
      }
    }));

    it('should handle readonly mode properly', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Initially editable
      expect(contentElement.nativeElement.contentEditable).toBe('true');
      
      // Toggle readonly
      const readonlyButton = fixture.debugElement.query(By.css('button:contains("Toggle Readonly")'));
      if (readonlyButton) {
        readonlyButton.nativeElement.click();
        tick();
        fixture.detectChanges();
        
        expect(component.readonly).toBeTruthy();
        expect(contentElement.nativeElement.contentEditable).toBe('false');
        
        // Toolbar buttons should be disabled
        const toolbarButtons = fixture.debugElement.queryAll(By.css('.wysiwyg-toolbar button'));
        toolbarButtons.forEach(button => {
          expect(button.nativeElement.disabled).toBeTruthy();
        });
      }
    }));
  });

  describe('Complete Error Handling Workflow', () => {
    it('should handle command execution failures gracefully', fakeAsync(() => {
      commandService.executeCommand.and.returnValue(false);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      
      // Should not throw error even if command fails
      expect(() => {
        boldButton.nativeElement.click();
        tick();
      }).not.toThrow();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
    }));

    it('should handle invalid content with sanitization', fakeAsync(() => {
      const maliciousContent = '<script>alert("xss")</script><p>Valid content</p>';
      const sanitizedContent = '<p>Valid content</p>';
      
      sanitizerService.sanitize.and.returnValue(sanitizedContent);
      
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      contentElement.nativeElement.innerHTML = maliciousContent;
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Content should be processed through sanitizer
      expect(sanitizerService.sanitize).toHaveBeenCalled();
    }));

    it('should handle browser API failures gracefully', fakeAsync(() => {
      // Simulate browser API failure
      selectionService.getSelection.and.returnValue(null);
      selectionService.hasSelection.and.returnValue(false);
      
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      contentElement.nativeElement.innerHTML = '<p>Test content</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      // Should still work even without selection API
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
    }));
  });

  describe('Complete Performance and Memory Management', () => {
    it('should handle rapid operations efficiently', fakeAsync(() => {
      const startTime = performance.now();
      
      // Perform many rapid operations
      for (let i = 0; i < 100; i++) {
        const content = `<p>Rapid operation ${i}</p>`;
        editorComponent.onContentChange(content);
        
        if (i % 10 === 0) {
          tick(1);
        }
      }
      
      tick(100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle operations efficiently
      expect(duration).toBeLessThan(2000);
      expect(component.contentChanges.length).toBe(100);
    }));

    it('should cleanup resources properly on destroy', () => {
      spyOn(editorComponent, 'ngOnDestroy').and.callThrough();
      
      fixture.destroy();
      
      expect(editorComponent.ngOnDestroy).toHaveBeenCalled();
    });
  });

  describe('Complete Accessibility Workflow', () => {
    it('should support complete keyboard navigation', fakeAsync(() => {
      const toolbar = fixture.debugElement.query(By.css('wysiwyg-toolbar'));
      const buttons = toolbar.queryAll(By.css('button'));
      
      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button.nativeElement.tabIndex).toBeGreaterThanOrEqual(0);
        
        // Should have proper ARIA attributes
        const ariaLabel = button.nativeElement.getAttribute('aria-label');
        const title = button.nativeElement.getAttribute('title');
        expect(ariaLabel || title).toBeTruthy();
      });
      
      // Test sequential focus
      if (buttons.length > 1) {
        buttons[0].nativeElement.focus();
        
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        buttons[0].nativeElement.dispatchEvent(tabEvent);
        tick();
        
        // Focus should move logically
        expect(document.activeElement).toBeTruthy();
      }
    }));

    it('should provide proper ARIA support', () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Editor should have proper ARIA role
      expect(editorElement.nativeElement.getAttribute('role')).toBeTruthy();
      
      // Should have proper ARIA labels
      const ariaLabel = editorElement.nativeElement.getAttribute('aria-label');
      const ariaLabelledBy = editorElement.nativeElement.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    });
  });

  describe('Complete Cross-Browser Compatibility', () => {
    it('should handle different browser implementations', fakeAsync(() => {
      // Test with different command support scenarios
      const commandSupport = [true, false];
      
      commandSupport.forEach(supported => {
        commandService.isCommandSupported.and.returnValue(supported);
        
        const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
        boldButton.nativeElement.click();
        tick();
        
        // Should handle both supported and unsupported commands
        expect(commandService.executeCommand).toHaveBeenCalled();
      });
    }));

    it('should provide fallbacks for missing APIs', fakeAsync(() => {
      // Simulate missing APIs
      selectionService.getSelection.and.returnValue(null);
      commandService.isCommandSupported.and.returnValue(false);
      
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Should still allow basic text input
      contentElement.nativeElement.innerHTML = '<p>Fallback test</p>';
      contentElement.nativeElement.dispatchEvent(new Event('input'));
      tick();
      
      expect(component.contentChanges.length).toBeGreaterThan(0);
    }));
  });
});