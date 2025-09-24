import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WysiwygEditorComponent } from './wysiwyg-editor.component';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { LinkData } from '../dialogs/link-dialog/link-dialog.component';
import { ImageData } from '../../models/image.interface';

describe('WysiwygEditorComponent', () => {
  let component: WysiwygEditorComponent;
  let fixture: ComponentFixture<WysiwygEditorComponent>;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand',
      'createLink',
      'updateLink',
      'removeLink',
      'getLinkData',
      'isInLink',
      'insertImage',
      'updateImage',
      'removeImage',
      'getImageData'
    ]);
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'getSelection',
      'saveSelection',
      'restoreSelection'
    ]);

    await TestBed.configureTestingModule({
      imports: [WysiwygEditorComponent, ReactiveFormsModule],
      providers: [
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: SelectionService, useValue: selectionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WysiwygEditorComponent);
    component = fixture.componentInstance;
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;

    // Mock selection service
    const mockSelection = {
      toString: () => 'selected text'
    } as Selection;
    selectionService.getSelection.and.returnValue(mockSelection);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Link Dialog Integration', () => {
    it('should show link dialog when createLink command is executed', () => {
      commandService.getLinkData.and.returnValue(null);
      
      component.handleCommand({ name: 'createLink' });
      
      expect(component.linkDialogVisible).toBeTruthy();
      expect(component.isEditingLink).toBeFalsy();
      expect(component.currentLinkData).toEqual({
        url: '',
        text: 'selected text',
        target: '_blank'
      });
    });

    it('should show link dialog in edit mode when cursor is on existing link', () => {
      const existingLinkData: LinkData = {
        url: 'https://example.com',
        text: 'Example Link',
        title: 'Example Title',
        target: '_blank'
      };
      commandService.getLinkData.and.returnValue(existingLinkData);
      
      component.handleCommand({ name: 'createLink' });
      
      expect(component.linkDialogVisible).toBeTruthy();
      expect(component.isEditingLink).toBeTruthy();
      expect(component.currentLinkData).toEqual(existingLinkData);
    });

    it('should create new link when dialog emits linkCreated', () => {
      const linkData: LinkData = {
        url: 'https://example.com',
        text: 'Example Link',
        title: 'Example Title',
        target: '_blank'
      };
      
      component.isEditingLink = false;
      commandService.createLink.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onLinkCreated(linkData);
      
      expect(commandService.createLink).toHaveBeenCalledWith(
        'https://example.com',
        'Example Link',
        'Example Title',
        '_blank'
      );
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should update existing link when dialog emits linkCreated in edit mode', () => {
      const linkData: LinkData = {
        url: 'https://updated.com',
        text: 'Updated Link',
        title: 'Updated Title',
        target: '_self'
      };
      
      component.isEditingLink = true;
      commandService.updateLink.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onLinkCreated(linkData);
      
      expect(commandService.updateLink).toHaveBeenCalledWith(
        'https://updated.com',
        'Updated Link',
        'Updated Title',
        '_self'
      );
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should remove link when dialog emits linkRemoved', () => {
      commandService.removeLink.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onLinkRemoved();
      
      expect(commandService.removeLink).toHaveBeenCalled();
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should close dialog when dialogClosed is emitted', () => {
      component.linkDialogVisible = true;
      component.currentLinkData = { url: 'test', text: 'test' };
      component.isEditingLink = true;
      
      component.onLinkDialogClosed();
      
      expect(component.linkDialogVisible).toBeFalsy();
      expect(component.currentLinkData).toBeNull();
      expect(component.isEditingLink).toBeFalsy();
    });

    it('should handle unlink command', () => {
      commandService.removeLink.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.handleCommand({ name: 'unlink' });
      
      expect(commandService.removeLink).toHaveBeenCalled();
      expect(component['emitContentChange']).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      spyOn(component, 'showLinkDialog' as any);
      spyOn(component, 'executeCommand' as any);
    });

    it('should show link dialog on Ctrl+K', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['showLinkDialog']).toHaveBeenCalled();
    });

    it('should execute bold command on Ctrl+B', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'bold' });
    });

    it('should execute italic command on Ctrl+I', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'italic' });
    });

    it('should execute underline command on Ctrl+U', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'u',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'underline' });
    });

    it('should execute undo command on Ctrl+Z', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'undo' });
    });

    it('should execute redo command on Ctrl+Shift+Z', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'redo' });
    });

    it('should execute redo command on Ctrl+Y', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['executeCommand']).toHaveBeenCalledWith({ name: 'redo' });
    });

    it('should work with metaKey (Mac)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      expect(component['showLinkDialog']).toHaveBeenCalled();
    });
  });

  describe('Command Handling', () => {
    it('should execute regular commands through command service', () => {
      const command = { name: 'bold' };
      commandService.executeCommand.and.returnValue(true);
      spyOn(component, 'updateSelectionState' as any);
      
      component.handleCommand(command);
      
      expect(commandService.executeCommand).toHaveBeenCalledWith(command, undefined);
    });

    it('should update selection state after successful command execution', fakeAsync(() => {
      const command = { name: 'bold' };
      commandService.executeCommand.and.returnValue(true);
      spyOn(component, 'updateSelectionState' as any);
      
      component.handleCommand(command);
      tick();
      
      expect(component['updateSelectionState']).toHaveBeenCalled();
    }));

    it('should not update selection state after failed command execution', fakeAsync(() => {
      const command = { name: 'bold' };
      commandService.executeCommand.and.returnValue(false);
      spyOn(component, 'updateSelectionState' as any);
      
      component.handleCommand(command);
      tick();
      
      expect(component['updateSelectionState']).not.toHaveBeenCalled();
    }));
  });

  describe('Content and Selection Management', () => {
    it('should emit content change when content changes', () => {
      spyOn(component.contentChange, 'emit');
      const newContent = '<p>New content</p>';
      
      component.onContentChange(newContent);
      
      expect(component.content).toBe(newContent);
      expect(component.contentChange.emit).toHaveBeenCalledWith(newContent);
    });

    it('should emit selection change when selection changes', () => {
      spyOn(component.selectionChange, 'emit');
      const mockSelection = {
        range: null,
        collapsed: true,
        formats: { bold: false, italic: false }
      } as any;
      
      component.onSelectionChange(mockSelection);
      
      expect(component.currentSelection).toBe(mockSelection);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(mockSelection);
    });

    it('should update selection state from selection service', () => {
      const mockSelection = {
        range: null,
        collapsed: true,
        formats: { bold: true, italic: false }
      } as any;
      selectionService.saveSelection.and.returnValue(mockSelection);
      spyOn(component, 'onSelectionChange');
      
      component['updateSelectionState']();
      
      expect(selectionService.saveSelection).toHaveBeenCalled();
      expect(component.onSelectionChange).toHaveBeenCalledWith(mockSelection);
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    it('should write value', () => {
      const value = '<p>Test content</p>';
      
      component.writeValue(value);
      
      expect(component.content).toBe(value);
    });

    it('should handle null value', () => {
      component.writeValue(null as any);
      
      expect(component.content).toBe('');
    });

    it('should register onChange callback', () => {
      const callback = jasmine.createSpy('onChange');
      
      component.registerOnChange(callback);
      component.onContentChange('test');
      
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('should register onTouched callback', () => {
      const callback = jasmine.createSpy('onTouched');
      
      component.registerOnTouched(callback);
      
      expect(component['onTouched']).toBe(callback);
    });

    it('should call onTouched when blur event is received', () => {
      const callback = jasmine.createSpy('onTouched');
      component.registerOnTouched(callback);
      
      const mockBlurEvent = new FocusEvent('blur');
      component.onBlur(mockBlurEvent);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      
      expect(component.readonly).toBeTruthy();
    });
  });

  describe('Default Configuration', () => {
    it('should have default toolbar configuration', () => {
      const config = component['getDefaultToolbarConfig']();
      
      expect(config.tools).toBeDefined();
      expect(config.tools.length).toBeGreaterThan(0);
      
      // Check for link tool
      const linkTool = config.tools.find(tool => tool.command === 'createLink');
      expect(linkTool).toBeDefined();
      expect(linkTool?.type).toBe('dialog');
    });

    it('should include all basic formatting tools', () => {
      const config = component['getDefaultToolbarConfig']();
      const commands = config.tools.map(tool => tool.command);
      
      expect(commands).toContain('bold');
      expect(commands).toContain('italic');
      expect(commands).toContain('underline');
      expect(commands).toContain('createLink');
      expect(commands).toContain('insertImage');
      expect(commands).toContain('insertUnorderedList');
      expect(commands).toContain('insertOrderedList');
      expect(commands).toContain('undo');
      expect(commands).toContain('redo');
    });
  });

  describe('Image Dialog Integration', () => {
    it('should show image dialog when insertImage command is executed', () => {
      commandService.getImageData.and.returnValue(null);
      
      component.handleCommand({ name: 'insertImage' });
      
      expect(component.imageDialogVisible).toBeTruthy();
      expect(component.isEditingImage).toBeFalsy();
      expect(component.currentImageData).toBeNull();
    });

    it('should show image dialog in edit mode when cursor is on existing image', () => {
      const existingImageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Example Image',
        title: 'Example Title',
        width: 300,
        height: 200
      };
      commandService.getImageData.and.returnValue(existingImageData);
      
      component.handleCommand({ name: 'insertImage' });
      
      expect(component.imageDialogVisible).toBeTruthy();
      expect(component.isEditingImage).toBeTruthy();
      expect(component.currentImageData).toEqual(existingImageData);
    });

    it('should create new image when dialog emits imageCreated', () => {
      const imageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Example Image',
        title: 'Example Title',
        width: 300,
        height: 200
      };
      
      component.isEditingImage = false;
      commandService.insertImage.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onImageCreated(imageData);
      
      expect(commandService.insertImage).toHaveBeenCalledWith(imageData);
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should update existing image when dialog emits imageCreated in edit mode', () => {
      const imageData: ImageData = {
        src: 'https://updated.com/image.jpg',
        alt: 'Updated Image',
        title: 'Updated Title',
        width: 400,
        height: 300
      };
      
      component.isEditingImage = true;
      commandService.updateImage.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onImageCreated(imageData);
      
      expect(commandService.updateImage).toHaveBeenCalledWith(imageData);
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should remove image when dialog emits imageRemoved', () => {
      commandService.removeImage.and.returnValue(true);
      spyOn(component, 'emitContentChange' as any);
      
      component.onImageRemoved();
      
      expect(commandService.removeImage).toHaveBeenCalled();
      expect(component['emitContentChange']).toHaveBeenCalled();
    });

    it('should close dialog when dialogClosed is emitted', () => {
      component.imageDialogVisible = true;
      component.currentImageData = { src: 'test', alt: 'test' };
      component.isEditingImage = true;
      
      component.onImageDialogClosed();
      
      expect(component.imageDialogVisible).toBeFalsy();
      expect(component.currentImageData).toBeNull();
      expect(component.isEditingImage).toBeFalsy();
    });
  });

  describe('Template Integration', () => {
    it('should render toolbar component', () => {
      const toolbar = fixture.debugElement.query(By.css('wysiwyg-toolbar'));
      expect(toolbar).toBeTruthy();
    });

    it('should render editor content component', () => {
      const editorContent = fixture.debugElement.query(By.css('wysiwyg-editor-content'));
      expect(editorContent).toBeTruthy();
    });

    it('should render link dialog component', () => {
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      expect(linkDialog).toBeTruthy();
    });

    it('should render image dialog component', () => {
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      expect(imageDialog).toBeTruthy();
    });

    it('should pass correct props to toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('wysiwyg-toolbar'));
      const toolbarComponent = toolbar.componentInstance;
      
      expect(toolbarComponent.config).toBe(component.toolbarConfig);
      expect(toolbarComponent.disabled).toBe(component.readonly);
      expect(toolbarComponent.selectionState).toBe(component.currentSelection);
    });

    it('should pass correct props to editor content', () => {
      const editorContent = fixture.debugElement.query(By.css('wysiwyg-editor-content'));
      const contentComponent = editorContent.componentInstance;
      
      expect(contentComponent.content).toBe(component.content);
      expect(contentComponent.placeholder).toBe(component.placeholder);
      expect(contentComponent.readonly).toBe(component.readonly);
      expect(contentComponent.height).toBe(component.height);
    });

    it('should handle blur events from editor content', () => {
      spyOn(component, 'onBlur');
      const editorContent = fixture.debugElement.query(By.css('wysiwyg-editor-content'));
      const mockBlurEvent = new FocusEvent('blur');
      
      editorContent.triggerEventHandler('blurEvent', mockBlurEvent);
      
      expect(component.onBlur).toHaveBeenCalledWith(mockBlurEvent);
    });

    it('should pass correct props to link dialog', () => {
      component.linkDialogVisible = true;
      component.currentLinkData = { url: 'test', text: 'test' };
      component.isEditingLink = true;
      fixture.detectChanges();
      
      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      const dialogComponent = linkDialog.componentInstance;
      
      expect(dialogComponent.visible).toBe(component.linkDialogVisible);
      expect(dialogComponent.linkData).toBe(component.currentLinkData);
      expect(dialogComponent.isEditing).toBe(component.isEditingLink);
    });

    it('should pass correct props to image dialog', () => {
      component.imageDialogVisible = true;
      component.currentImageData = { src: 'test', alt: 'test' };
      component.isEditingImage = true;
      fixture.detectChanges();
      
      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      const dialogComponent = imageDialog.componentInstance;
      
      expect(dialogComponent.visible).toBe(component.imageDialogVisible);
      expect(dialogComponent.imageData).toBe(component.currentImageData);
      expect(dialogComponent.isEditing).toBe(component.isEditingImage);
    });

    it('should apply readonly class when readonly', () => {
      component.readonly = true;
      fixture.detectChanges();
      
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-editor'));
      expect(editorElement.nativeElement.classList.contains('wysiwyg-editor--readonly')).toBeTruthy();
    });
  });

  describe('Integration with Forms', () => {
    it('should work with reactive forms', () => {
      const formControl = new FormControl('initial content');
      
      component.writeValue(formControl.value);
      component.registerOnChange((value) => formControl.setValue(value));
      
      expect(component.content).toBe('initial content');
      
      component.onContentChange('updated content');
      
      expect(formControl.value).toBe('updated content');
    });

    it('should handle form validation states', () => {
      const formControl = new FormControl('', [Validators.required]);
      
      component.writeValue(formControl.value);
      component.registerOnChange((value) => formControl.setValue(value));
      
      // Initially invalid due to required validator
      expect(formControl.invalid).toBeTruthy();
      
      // Should become valid when content is added
      component.onContentChange('some content');
      expect(formControl.valid).toBeTruthy();
    });

    it('should handle disabled state from form control', () => {
      const formControl = new FormControl('test content');
      formControl.disable();
      
      component.setDisabledState(formControl.disabled);
      
      expect(component.readonly).toBeTruthy();
    });

    it('should mark form as touched on blur', () => {
      const formControl = new FormControl('test content');
      let touched = false;
      
      component.registerOnTouched(() => { touched = true; });
      
      const mockBlurEvent = new FocusEvent('blur');
      component.onBlur(mockBlurEvent);
      
      expect(touched).toBeTruthy();
    });
  });
});