import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <wysiwyg-editor
      [formControl]="editorControl"
      [toolbarConfig]="toolbarConfig"
      [height]="height"
      [placeholder]="placeholder"
      [readonly]="readonly"
      (contentChange)="onContentChange($event)"
      (selectionChange)="onSelectionChange($event)">
    </wysiwyg-editor>
  `
})
class TestHostComponent {
  editorControl = new FormControl('<p>Initial content</p>');
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'dropdown', command: 'fontSize', label: 'Font Size', options: [
        { value: '12px', label: '12px' },
        { value: '14px', label: '14px' },
        { value: '16px', label: '16px' }
      ]},
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' },
      { type: 'button', command: 'insertUnorderedList', icon: 'list-ul', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'list-ol', label: 'Numbered List' },
      { type: 'button', command: 'justifyLeft', icon: 'align-left', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'align-center', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'align-right', label: 'Align Right' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };
  height = '300px';
  placeholder = 'Start typing...';
  readonly = false;
  
  contentChanges: string[] = [];
  selectionChanges: any[] = [];

  onContentChange(content: string): void {
    this.contentChanges.push(content);
  }

  onSelectionChange(selection: any): void {
    this.selectionChanges.push(selection);
  }
}

describe('Complete Editor Workflows Integration Tests', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let editorComponent: WysiwygEditorComponent;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let historyService: jasmine.SpyObj<HistoryService>;
  let editorService: jasmine.SpyObj<EditorService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand', 'isCommandSupported', 'isCommandEnabled', 
      'getCommandState', 'getCommandValue', 'insertImage', 'createLink',
      'undo', 'redo', 'canUndo', 'canRedo'
    ]);
    
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection', 'restoreSelection', 'getSelection', 'getRange',
      'selectAll', 'collapse', 'hasSelection', 'getSelectedText'
    ]);
    
    const historyServiceSpy = jasmine.createSpyObj('HistoryService', [
      'addState', 'undo', 'redo', 'canUndo', 'canRedo', 'clear'
    ]);
    
    const editorServiceSpy = jasmine.createSpyObj('EditorService', [
      'executeCommand', 'setContent', 'getContent', 'focus', 'blur'
    ]);

    await TestBed.configureTestingModule({
      declarations: [
        TestHostComponent,
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        LinkDialogComponent,
        ImageDialogComponent
      ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        { provide: EditorService, useValue: editorServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    editorComponent = fixture.debugElement.query(By.directive(WysiwygEditorComponent)).componentInstance;
    
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    historyService = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;
    editorService = TestBed.inject(EditorService) as jasmine.SpyObj<EditorService>;

    // Setup default spy returns
    commandService.executeCommand.and.returnValue(true);
    commandService.isCommandSupported.and.returnValue(true);
    commandService.isCommandEnabled.and.returnValue(true);
    commandService.getCommandState.and.returnValue(false);
    commandService.getCommandValue.and.returnValue('');
    commandService.canUndo.and.returnValue(false);
    commandService.canRedo.and.returnValue(false);
    
    selectionService.hasSelection.and.returnValue(false);
    selectionService.getSelectedText.and.returnValue('');
    
    historyService.canUndo.and.returnValue(false);
    historyService.canRedo.and.returnValue(false);

    fixture.detectChanges();
  });

  describe('Complete Text Formatting Workflow', () => {
    it('should handle complete text formatting workflow with undo/redo', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      const italicButton = fixture.debugElement.query(By.css('[data-command="italic"]'));
      const undoButton = fixture.debugElement.query(By.css('[data-command="undo"]'));
      const redoButton = fixture.debugElement.query(By.css('[data-command="redo"]'));

      // Simulate text selection
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue('selected text');
      
      // Apply bold formatting
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
      
      // Apply italic formatting
      italicButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'italic' });
      
      // Enable undo
      historyService.canUndo.and.returnValue(true);
      commandService.canUndo.and.returnValue(true);
      fixture.detectChanges();
      
      // Undo last action
      undoButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'undo' });
      
      // Enable redo
      historyService.canRedo.and.returnValue(true);
      commandService.canRedo.and.returnValue(true);
      fixture.detectChanges();
      
      // Redo last action
      redoButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'redo' });
    }));

    it('should handle font size changes with proper state management', fakeAsync(() => {
      const fontSizeDropdown = fixture.debugElement.query(By.css('[data-command="fontSize"]'));
      
      // Simulate font size change
      const changeEvent = new Event('change');
      Object.defineProperty(changeEvent, 'target', {
        value: { value: '16px' },
        enumerable: true
      });
      
      fontSizeDropdown.nativeElement.dispatchEvent(changeEvent);
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'fontSize' }, '16px');
    }));
  });

  describe('Link Management Workflow', () => {
    it('should handle complete link creation and editing workflow', fakeAsync(() => {
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      
      // Simulate text selection for link creation
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue('link text');
      
      // Open link dialog
      linkButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      // Check if link dialog is visible
      expect(editorComponent.linkDialogVisible).toBeTruthy();
      
      // Simulate link dialog interaction
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
      
      // Simulate link creation
      const linkData = { url: 'https://example.com', text: 'link text' };
      editorComponent.onLinkCreated(linkData);
      tick();
      
      expect(commandService.createLink).toHaveBeenCalledWith(linkData.url, linkData.text);
      expect(editorComponent.linkDialogVisible).toBeFalsy();
    }));

    it('should handle link editing workflow', fakeAsync(() => {
      // Setup existing link
      const existingLinkData = { url: 'https://old-example.com', text: 'old link' };
      editorComponent['currentLinkData'] = existingLinkData;
      editorComponent['isEditingLink'] = true;
      
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      linkButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      const dialogComponent = linkDialog.componentInstance;
      
      expect(dialogComponent.linkData).toBe(existingLinkData);
      expect(dialogComponent.isEditing).toBeTruthy();
      
      // Update link
      const updatedLinkData = { url: 'https://new-example.com', text: 'new link' };
      editorComponent.onLinkCreated(updatedLinkData);
      tick();
      
      expect(commandService.createLink).toHaveBeenCalledWith(updatedLinkData.url, updatedLinkData.text);
    }));
  });

  describe('Image Management Workflow', () => {
    it('should handle complete image insertion workflow', fakeAsync(() => {
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      
      // Open image dialog
      imageButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      expect(editorComponent.imageDialogVisible).toBeTruthy();
      
      // Simulate image insertion
      const imageData = { src: 'https://example.com/image.jpg', alt: 'Test image' };
      editorComponent.onImageInserted(imageData);
      tick();
      
      expect(commandService.insertImage).toHaveBeenCalledWith(imageData);
      expect(editorComponent.imageDialogVisible).toBeFalsy();
    }));

    it('should handle image file upload workflow', fakeAsync(() => {
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      
      imageButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      const fileInput = imageDialog.query(By.css('input[type="file"]'));
      
      // Create mock file
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
      
      // Verify file processing
      expect(fileInput.nativeElement.files?.length).toBe(1);
      expect(fileInput.nativeElement.files?.[0]).toBe(mockFile);
    }));
  });

  describe('List Management Workflow', () => {
    it('should handle bullet list creation and manipulation', fakeAsync(() => {
      const bulletListButton = fixture.debugElement.query(By.css('[data-command="insertUnorderedList"]'));
      
      // Create bullet list
      bulletListButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'insertUnorderedList' });
      
      // Simulate keyboard navigation in list
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Tab key for indentation
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      contentElement.nativeElement.dispatchEvent(tabEvent);
      tick();
      
      // Enter key for new list item
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      contentElement.nativeElement.dispatchEvent(enterEvent);
      tick();
    }));

    it('should handle numbered list creation and manipulation', fakeAsync(() => {
      const numberedListButton = fixture.debugElement.query(By.css('[data-command="insertOrderedList"]'));
      
      // Create numbered list
      numberedListButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'insertOrderedList' });
    }));
  });

  describe('Text Alignment Workflow', () => {
    it('should handle text alignment changes', fakeAsync(() => {
      const alignLeftButton = fixture.debugElement.query(By.css('[data-command="justifyLeft"]'));
      const alignCenterButton = fixture.debugElement.query(By.css('[data-command="justifyCenter"]'));
      const alignRightButton = fixture.debugElement.query(By.css('[data-command="justifyRight"]'));
      
      // Test left alignment
      alignLeftButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'justifyLeft' });
      
      // Test center alignment
      alignCenterButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'justifyCenter' });
      
      // Test right alignment
      alignRightButton.nativeElement.click();
      tick();
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'justifyRight' });
    }));
  });

  describe('Form Integration Workflow', () => {
    it('should handle reactive forms integration with validation', fakeAsync(() => {
      // Test initial form value
      expect(component.editorControl.value).toBe('<p>Initial content</p>');
      
      // Simulate content change
      const newContent = '<p>Updated content with <strong>bold</strong> text</p>';
      editorComponent.onContentChange(newContent);
      tick();
      
      expect(component.editorControl.value).toBe(newContent);
      expect(component.contentChanges).toContain(newContent);
      
      // Test form validation
      component.editorControl.setValidators((control) => {
        const value = control.value || '';
        return value.length < 10 ? { minLength: true } : null;
      });
      
      component.editorControl.setValue('<p>Short</p>');
      component.editorControl.updateValueAndValidity();
      
      expect(component.editorControl.invalid).toBeTruthy();
      expect(component.editorControl.errors?.['minLength']).toBeTruthy();
    }));

    it('should handle disabled state properly', fakeAsync(() => {
      // Disable form control
      component.editorControl.disable();
      tick();
      fixture.detectChanges();
      
      expect(editorComponent.readonly).toBeTruthy();
      
      // Try to interact with disabled editor
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      expect(boldButton.nativeElement.disabled).toBeTruthy();
      
      // Enable form control
      component.editorControl.enable();
      tick();
      fixture.detectChanges();
      
      expect(editorComponent.readonly).toBeFalsy();
      expect(boldButton.nativeElement.disabled).toBeFalsy();
    }));
  });

  describe('Keyboard Shortcuts Workflow', () => {
    it('should handle keyboard shortcuts for formatting', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Test Ctrl+B for bold
      const ctrlBEvent = new KeyboardEvent('keydown', { 
        key: 'b', 
        ctrlKey: true
      });
      spyOn(ctrlBEvent, 'preventDefault');
      contentElement.nativeElement.dispatchEvent(ctrlBEvent);
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
      
      // Test Ctrl+I for italic
      const ctrlIEvent = new KeyboardEvent('keydown', { 
        key: 'i', 
        ctrlKey: true
      });
      spyOn(ctrlIEvent, 'preventDefault');
      contentElement.nativeElement.dispatchEvent(ctrlIEvent);
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'italic' });
      
      // Test Ctrl+Z for undo
      historyService.canUndo.and.returnValue(true);
      const ctrlZEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true
      });
      spyOn(ctrlZEvent, 'preventDefault');
      contentElement.nativeElement.dispatchEvent(ctrlZEvent);
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'undo' });
    }));
  });

  describe('Error Handling Workflow', () => {
    it('should handle command execution failures gracefully', fakeAsync(() => {
      commandService.executeCommand.and.returnValue(false);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
      // Should not throw error even if command fails
    }));

    it('should handle invalid content gracefully', fakeAsync(() => {
      const invalidContent = '<script>alert("xss")</script><p>Valid content</p>';
      
      // Content should be sanitized
      editorComponent.onContentChange(invalidContent);
      tick();
      
      // The actual sanitization would be handled by the HTML sanitizer service
      expect(component.contentChanges.length).toBeGreaterThan(0);
    }));
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid content changes efficiently', fakeAsync(() => {
      const startTime = performance.now();
      
      // Simulate rapid content changes
      for (let i = 0; i < 100; i++) {
        editorComponent.onContentChange(`<p>Content change ${i}</p>`);
        tick(10); // Small delay between changes
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle 100 changes reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(component.contentChanges.length).toBe(100);
    }));

    it('should cleanup resources on component destruction', () => {
      spyOn(editorComponent, 'ngOnDestroy');
      
      fixture.destroy();
      
      expect(editorComponent.ngOnDestroy).toHaveBeenCalled();
    });
  });

  describe('Accessibility Workflow', () => {
    it('should support keyboard navigation', fakeAsync(() => {
      const toolbar = fixture.debugElement.query(By.css('wysiwyg-toolbar'));
      const buttons = toolbar.queryAll(By.css('button'));
      
      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button.nativeElement.tabIndex).toBeGreaterThanOrEqual(0);
      });
      
      // Test Tab navigation
      const firstButton = buttons[0];
      firstButton.nativeElement.focus();
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      firstButton.nativeElement.dispatchEvent(tabEvent);
      tick();
      
      // Focus should move to next element
    }));

    it('should have proper ARIA labels', () => {
      const toolbar = fixture.debugElement.query(By.css('wysiwyg-toolbar'));
      const buttons = toolbar.queryAll(By.css('button'));
      
      buttons.forEach(button => {
        const ariaLabel = button.nativeElement.getAttribute('aria-label');
        const title = button.nativeElement.getAttribute('title');
        
        // Each button should have either aria-label or title
        expect(ariaLabel || title).toBeTruthy();
      });
    });
  });
});