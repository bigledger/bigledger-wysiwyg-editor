import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { ToolbarButtonComponent } from '../../components/toolbar/toolbar-button.component';
import { LinkDialogComponent } from '../../components/dialogs/link-dialog/link-dialog.component';
import { ImageDialogComponent } from '../../components/dialogs/image-dialog/image-dialog.component';
import { ContentEditableDirective } from '../../directives/content-editable.directive';
import { EditorService } from '../../services/editor.service';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig"
      placeholder="Start typing...">
    </wysiwyg-editor>
  `
})
class LinkImageTestHostComponent {
  content = '';
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' },
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
    ]
  };
}

describe('Link and Image Workflows Integration Tests', () => {
  let component: LinkImageTestHostComponent;
  let fixture: ComponentFixture<LinkImageTestHostComponent>;
  let editorService: EditorService;
  let commandService: CommandService;
  let selectionService: SelectionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        ToolbarButtonComponent,
        LinkDialogComponent,
        ImageDialogComponent,
        ContentEditableDirective,
        LinkImageTestHostComponent
      ],
      imports: [FormsModule],
      providers: [
        EditorService,
        CommandService,
        SelectionService,
        HTMLSanitizerService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LinkImageTestHostComponent);
    component = fixture.componentInstance;
    editorService = TestBed.inject(EditorService);
    commandService = TestBed.inject(CommandService);
    selectionService = TestBed.inject(SelectionService);
    fixture.detectChanges();
  });

  describe('Link Creation Workflows', () => {
    it('should create link from selected text', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      
      // Set initial content with text to select
      editorElement.nativeElement.innerHTML = 'Visit our website for more info';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Select "our website" text
      const range = document.createRange();
      const textNode = editorElement.nativeElement.firstChild;
      range.setStart(textNode, 6);
      range.setEnd(textNode, 17);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Click link button
      linkButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify link dialog appears
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
      
      // Fill in link details
      const urlInput = linkDialog.query(By.css('input[name="url"]'));
      const textInput = linkDialog.query(By.css('input[name="text"]'));
      const submitButton = linkDialog.query(By.css('button[type="submit"]'));
      
      urlInput.nativeElement.value = 'https://example.com';
      textInput.nativeElement.value = 'our website';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      textInput.nativeElement.dispatchEvent(new Event('input'));
      
      // Submit link
      submitButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify link was created
      expect(editorElement.nativeElement.innerHTML).toContain('<a href="https://example.com">our website</a>');
    });

    it('should handle link creation with keyboard shortcut', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Check this link';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Select "this link" text
      const range = document.createRange();
      const textNode = editorElement.nativeElement.firstChild;
      range.setStart(textNode, 6);
      range.setEnd(textNode, 15);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Simulate Ctrl+K keyboard shortcut
      const ctrlKEvent = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true
      });
      editorElement.nativeElement.dispatchEvent(ctrlKEvent);
      fixture.detectChanges();
      
      // Verify link dialog appears
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
    });

    it('should edit existing links', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set content with existing link
      editorElement.nativeElement.innerHTML = 'Visit <a href="https://old-url.com">this link</a> for info';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Click on the existing link
      const existingLink = editorElement.nativeElement.querySelector('a');
      existingLink.click();
      fixture.detectChanges();
      
      // Verify link dialog appears with existing values
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
      
      const urlInput = linkDialog.query(By.css('input[name="url"]'));
      const textInput = linkDialog.query(By.css('input[name="text"]'));
      
      expect(urlInput.nativeElement.value).toBe('https://old-url.com');
      expect(textInput.nativeElement.value).toBe('this link');
      
      // Update link
      urlInput.nativeElement.value = 'https://new-url.com';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      
      const submitButton = linkDialog.query(By.css('button[type="submit"]'));
      submitButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify link was updated
      expect(editorElement.nativeElement.innerHTML).toContain('<a href="https://new-url.com">this link</a>');
    });

    it('should remove links', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set content with existing link
      editorElement.nativeElement.innerHTML = 'Visit <a href="https://example.com">this link</a> for info';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Click on the existing link
      const existingLink = editorElement.nativeElement.querySelector('a');
      existingLink.click();
      fixture.detectChanges();
      
      // Verify link dialog appears
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
      
      // Click remove button
      const removeButton = linkDialog.query(By.css('button[data-action="remove"]'));
      removeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify link was removed but text remains
      expect(editorElement.nativeElement.innerHTML).toContain('this link');
      expect(editorElement.nativeElement.innerHTML).not.toContain('<a href');
    });

    it('should validate URL format', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      
      // Set initial content
      editorElement.nativeElement.innerHTML = 'Link text';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Select text
      const range = document.createRange();
      range.selectNodeContents(editorElement.nativeElement);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Click link button
      linkButton.nativeElement.click();
      fixture.detectChanges();
      
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      const urlInput = linkDialog.query(By.css('input[name="url"]'));
      const submitButton = linkDialog.query(By.css('button[type="submit"]'));
      
      // Try invalid URL
      urlInput.nativeElement.value = 'invalid-url';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Submit should be disabled or show error
      expect(submitButton.nativeElement.disabled).toBe(true);
      
      // Try valid URL
      urlInput.nativeElement.value = 'https://valid-url.com';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Submit should be enabled
      expect(submitButton.nativeElement.disabled).toBe(false);
    });
  });

  describe('Image Insertion Workflows', () => {
    it('should insert image via URL', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      
      // Position cursor
      const range = document.createRange();
      range.setStart(editorElement.nativeElement, 0);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Click image button
      imageButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify image dialog appears
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      expect(imageDialog).toBeTruthy();
      
      // Fill in image URL
      const urlInput = imageDialog.query(By.css('input[name="url"]'));
      const altInput = imageDialog.query(By.css('input[name="alt"]'));
      const submitButton = imageDialog.query(By.css('button[type="submit"]'));
      
      urlInput.nativeElement.value = 'https://example.com/image.jpg';
      altInput.nativeElement.value = 'Test image';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      altInput.nativeElement.dispatchEvent(new Event('input'));
      
      // Submit image
      submitButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify image was inserted
      expect(editorElement.nativeElement.innerHTML).toContain('<img src="https://example.com/image.jpg" alt="Test image">');
    });

    it('should handle image file upload', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      
      // Click image button
      imageButton.nativeElement.click();
      fixture.detectChanges();
      
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      const fileInput = imageDialog.query(By.css('input[type="file"]'));
      
      // Create mock file
      const mockFile = new File([''], 'test-image.jpg', { type: 'image/jpeg' });
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => mockFile
      } as FileList;
      
      // Simulate file selection
      Object.defineProperty(fileInput.nativeElement, 'files', {
        value: fileList,
        writable: false
      });
      
      fileInput.nativeElement.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      
      // Verify file was processed (would normally show preview)
      const preview = imageDialog.query(By.css('.image-preview'));
      expect(preview).toBeTruthy();
    });

    it('should validate image file types', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      
      // Click image button
      imageButton.nativeElement.click();
      fixture.detectChanges();
      
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      const fileInput = imageDialog.query(By.css('input[type="file"]'));
      
      // Try invalid file type
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      const fileList = {
        0: invalidFile,
        length: 1,
        item: (index: number) => invalidFile
      } as FileList;
      
      Object.defineProperty(fileInput.nativeElement, 'files', {
        value: fileList,
        writable: false
      });
      
      fileInput.nativeElement.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      
      // Verify error message appears
      const errorMessage = imageDialog.query(By.css('.error-message'));
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent).toContain('Invalid file type');
    });

    it('should allow image resizing after insertion', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Insert image directly
      editorElement.nativeElement.innerHTML = '<img src="https://example.com/image.jpg" alt="Test" width="200" height="150">';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Click on image
      const image = editorElement.nativeElement.querySelector('img');
      image.click();
      fixture.detectChanges();
      
      // Verify resize handles appear
      const resizeHandles = fixture.debugElement.queryAll(By.css('.resize-handle'));
      expect(resizeHandles.length).toBeGreaterThan(0);
      
      // Simulate resize drag
      const handle = resizeHandles[0];
      const mouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 150 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 250, clientY: 200 });
      const mouseUp = new MouseEvent('mouseup');
      
      handle.nativeElement.dispatchEvent(mouseDown);
      document.dispatchEvent(mouseMove);
      document.dispatchEvent(mouseUp);
      fixture.detectChanges();
      
      // Verify image size changed
      expect(image.width).toBeGreaterThan(200);
      expect(image.height).toBeGreaterThan(150);
    });

    it('should remove images when selected and delete key pressed', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Insert image
      editorElement.nativeElement.innerHTML = '<p>Before image</p><img src="https://example.com/image.jpg" alt="Test"><p>After image</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Select image
      const image = editorElement.nativeElement.querySelector('img');
      image.click();
      fixture.detectChanges();
      
      // Press delete key
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete' });
      editorElement.nativeElement.dispatchEvent(deleteEvent);
      fixture.detectChanges();
      
      // Verify image was removed
      expect(editorElement.nativeElement.innerHTML).not.toContain('<img');
      expect(editorElement.nativeElement.innerHTML).toContain('Before image');
      expect(editorElement.nativeElement.innerHTML).toContain('After image');
    });
  });

  describe('Combined Link and Image Workflows', () => {
    it('should create linked images', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // First insert an image
      editorElement.nativeElement.innerHTML = '<img src="https://example.com/image.jpg" alt="Test image">';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Select the image
      const image = editorElement.nativeElement.querySelector('img');
      const range = document.createRange();
      range.selectNode(image);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Create link around image
      const linkButton = fixture.debugElement.query(By.css('[data-command="createLink"]'));
      linkButton.nativeElement.click();
      fixture.detectChanges();
      
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      const urlInput = linkDialog.query(By.css('input[name="url"]'));
      const submitButton = linkDialog.query(By.css('button[type="submit"]'));
      
      urlInput.nativeElement.value = 'https://example.com/page';
      urlInput.nativeElement.dispatchEvent(new Event('input'));
      
      submitButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify linked image was created
      expect(editorElement.nativeElement.innerHTML).toContain('<a href="https://example.com/page"><img src="https://example.com/image.jpg" alt="Test image"></a>');
    });

    it('should handle complex content with mixed formatting, links, and images', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Set complex content
      const complexContent = `
        <p><strong>Welcome</strong> to our <em>amazing</em> website!</p>
        <p>Check out this <a href="https://example.com">awesome link</a> and this image:</p>
        <img src="https://example.com/image.jpg" alt="Sample image">
        <p>More content with <u>underlined text</u>.</p>
      `;
      
      editorElement.nativeElement.innerHTML = complexContent;
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Verify all elements are preserved
      expect(editorElement.nativeElement.innerHTML).toContain('<strong>Welcome</strong>');
      expect(editorElement.nativeElement.innerHTML).toContain('<em>amazing</em>');
      expect(editorElement.nativeElement.innerHTML).toContain('<a href="https://example.com">awesome link</a>');
      expect(editorElement.nativeElement.innerHTML).toContain('<img src="https://example.com/image.jpg" alt="Sample image">');
      expect(editorElement.nativeElement.innerHTML).toContain('<u>underlined text</u>');
      
      // Verify content is properly bound to model
      expect(component.content).toContain('Welcome');
      expect(component.content).toContain('awesome link');
      expect(component.content).toContain('Sample image');
    });
  });
});