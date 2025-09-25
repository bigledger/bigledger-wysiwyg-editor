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

  describe('Dialog Management System', () => {
    describe('Dialog Visibility Properties', () => {
      it('should initialize dialog visibility properties to false', () => {
        expect(component.linkDialogVisible).toBeFalsy();
        expect(component.imageDialogVisible).toBeFalsy();
      });

      it('should set linkDialogVisible to true when showing link dialog', async () => {
        commandService.getLinkData.and.returnValue(null);
        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.resolve({
            instance: {
              visible: false,
              linkData: null,
              isEditing: false,
              linkCreated: { subscribe: jasmine.createSpy() },
              linkRemoved: { subscribe: jasmine.createSpy() },
              dialogClosed: { subscribe: jasmine.createSpy() }
            },
            destroy: jasmine.createSpy()
          } as any)
        );

        await component['showLinkDialog']();

        expect(component.linkDialogVisible).toBeTruthy();
      });

      it('should set imageDialogVisible to true when showing image dialog', async () => {
        commandService.getImageData.and.returnValue(null);
        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.resolve({
            instance: {
              visible: false,
              imageData: null,
              isEditing: false,
              imageCreated: { subscribe: jasmine.createSpy() },
              imageRemoved: { subscribe: jasmine.createSpy() },
              dialogClosed: { subscribe: jasmine.createSpy() }
            },
            destroy: jasmine.createSpy()
          } as any)
        );

        await component['showImageDialog']();

        expect(component.imageDialogVisible).toBeTruthy();
      });

      it('should set linkDialogVisible to false on dialog load error', async () => {
        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.reject(new Error('Failed to load'))
        );
        spyOn(console, 'error');

        await component['showLinkDialog']();

        expect(component.linkDialogVisible).toBeFalsy();
        expect(console.error).toHaveBeenCalled();
      });

      it('should set imageDialogVisible to false on dialog load error', async () => {
        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.reject(new Error('Failed to load'))
        );
        spyOn(console, 'error');

        await component['showImageDialog']();

        expect(component.imageDialogVisible).toBeFalsy();
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('Dialog Event Handlers', () => {
      it('should implement onLinkDialogClosed method', () => {
        expect(typeof component.onLinkDialogClosed).toBe('function');
      });

      it('should implement onImageDialogClosed method', () => {
        expect(typeof component.onImageDialogClosed).toBe('function');
      });

      it('should call closeLinkDialog when onLinkDialogClosed is called', () => {
        spyOn(component, 'closeLinkDialog' as any);

        component.onLinkDialogClosed();

        expect(component['closeLinkDialog']).toHaveBeenCalled();
      });

      it('should call closeImageDialog when onImageDialogClosed is called', () => {
        spyOn(component, 'closeImageDialog' as any);

        component.onImageDialogClosed();

        expect(component['closeImageDialog']).toHaveBeenCalled();
      });

      it('should reset dialog state when onLinkDialogClosed is called', () => {
        // Set up initial state
        component.linkDialogVisible = true;
        component['currentLinkData'] = { url: 'test', text: 'test' };
        component['isEditingLink'] = true;
        component['linkDialogRef'] = {
          destroy: jasmine.createSpy()
        } as any;

        component.onLinkDialogClosed();

        expect(component.linkDialogVisible).toBeFalsy();
        expect(component['currentLinkData']).toBeNull();
        expect(component['isEditingLink']).toBeFalsy();
        expect(component['linkDialogRef']).toBeNull();
      });

      it('should reset dialog state when onImageDialogClosed is called', () => {
        // Set up initial state
        component.imageDialogVisible = true;
        component['currentImageData'] = { src: 'test', alt: 'test' };
        component['isEditingImage'] = true;
        component['imageDialogRef'] = {
          destroy: jasmine.createSpy()
        } as any;

        component.onImageDialogClosed();

        expect(component.imageDialogVisible).toBeFalsy();
        expect(component['currentImageData']).toBeNull();
        expect(component['isEditingImage']).toBeFalsy();
        expect(component['imageDialogRef']).toBeNull();
      });
    });

    describe('Dialog Lifecycle Management', () => {
      it('should properly clean up dialog references on component destroy', () => {
        // Set up dialog references
        const mockLinkDialogRef = { destroy: jasmine.createSpy() };
        const mockImageDialogRef = { destroy: jasmine.createSpy() };
        component['linkDialogRef'] = mockLinkDialogRef as any;
        component['imageDialogRef'] = mockImageDialogRef as any;
        component.linkDialogVisible = true;
        component.imageDialogVisible = true;

        component.ngOnDestroy();

        expect(mockLinkDialogRef.destroy).toHaveBeenCalled();
        expect(mockImageDialogRef.destroy).toHaveBeenCalled();
        expect(component.linkDialogVisible).toBeFalsy();
        expect(component.imageDialogVisible).toBeFalsy();
      });

      it('should handle multiple dialog close calls gracefully', () => {
        component.linkDialogVisible = true;
        component['linkDialogRef'] = { destroy: jasmine.createSpy() } as any;

        // First close
        component.onLinkDialogClosed();
        expect(component.linkDialogVisible).toBeFalsy();

        // Second close should not throw error
        expect(() => component.onLinkDialogClosed()).not.toThrow();
        expect(component.linkDialogVisible).toBeFalsy();
      });

      it('should prevent opening multiple instances of the same dialog', async () => {
        const mockDialogRef = {
          instance: {
            visible: false,
            linkData: null,
            isEditing: false,
            linkCreated: { subscribe: jasmine.createSpy() },
            linkRemoved: { subscribe: jasmine.createSpy() },
            dialogClosed: { subscribe: jasmine.createSpy() }
          },
          destroy: jasmine.createSpy()
        };

        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.resolve(mockDialogRef as any)
        );

        // First call should load dialog
        await component['showLinkDialog']();
        expect(component.linkDialogVisible).toBeTruthy();

        // Second call should return early without loading again
        const loadSpy = component['lazyLoaderService'].loadDialogComponent as jasmine.Spy;
        loadSpy.calls.reset();

        await component['showLinkDialog']();
        expect(loadSpy).not.toHaveBeenCalled();
      });

      it('should properly subscribe to dialog events', async () => {
        const mockSubscribe = jasmine.createSpy('subscribe');
        const mockDialogRef = {
          instance: {
            visible: false,
            linkData: null,
            isEditing: false,
            linkCreated: { subscribe: mockSubscribe },
            linkRemoved: { subscribe: mockSubscribe },
            dialogClosed: { subscribe: mockSubscribe }
          },
          destroy: jasmine.createSpy()
        };

        spyOn(component['lazyLoaderService'], 'loadDialogComponent').and.returnValue(
          Promise.resolve(mockDialogRef as any)
        );

        await component['showLinkDialog']();

        expect(mockSubscribe).toHaveBeenCalledTimes(3); // linkCreated, linkRemoved, dialogClosed
      });
    });
  });

  describe('Link Dialog Integration', () => {
    it('should show link dialog when createLink command is executed', () => {
      commandService.getLinkData.and.returnValue(null);

      component.handleCommand({ name: 'createLink' });

      expect(component.linkDialogVisible).toBeTruthy();
      expect(component['isEditingLink']).toBeFalsy();
      expect(component['currentLinkData']).toEqual({
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
      expect(component['isEditingLink']).toBeTruthy();
      expect(component['currentLinkData']).toEqual(existingLinkData);
    });

    it('should create new link when dialog emits linkCreated', () => {
      const linkData: LinkData = {
        url: 'https://example.com',
        text: 'Example Link',
        title: 'Example Title',
        target: '_blank'
      };

      component['isEditingLink'] = false;
      commandService.createLink.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onLinkCreated(linkData);

      expect(commandService.createLink).toHaveBeenCalledWith(
        'https://example.com',
        'Example Link',
        'Example Title',
        '_blank'
      );
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should update existing link when dialog emits linkCreated in edit mode', () => {
      const linkData: LinkData = {
        url: 'https://updated.com',
        text: 'Updated Link',
        title: 'Updated Title',
        target: '_self'
      };

      component['isEditingLink'] = true;
      commandService.updateLink.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onLinkCreated(linkData);

      expect(commandService.updateLink).toHaveBeenCalledWith(
        'https://updated.com',
        'Updated Link',
        'Updated Title',
        '_self'
      );
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should remove link when dialog emits linkRemoved', () => {
      commandService.removeLink.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onLinkRemoved();

      expect(commandService.removeLink).toHaveBeenCalled();
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should close dialog when dialogClosed is emitted', () => {
      component.linkDialogVisible = true;
      component['currentLinkData'] = { url: 'test', text: 'test' };
      component['isEditingLink'] = true;

      component.onLinkDialogClosed();

      expect(component.linkDialogVisible).toBeFalsy();
      expect(component['currentLinkData']).toBeNull();
      expect(component['isEditingLink']).toBeFalsy();
    });

    it('should handle unlink command', () => {
      commandService.removeLink.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.handleCommand({ name: 'unlink' });

      expect(commandService.removeLink).toHaveBeenCalled();
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
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
      expect(component['isEditingImage']).toBeFalsy();
      expect(component['currentImageData']).toBeNull();
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
      expect(component['isEditingImage']).toBeTruthy();
      expect(component['currentImageData']).toEqual(existingImageData);
    });

    it('should create new image when dialog emits imageCreated', () => {
      const imageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Example Image',
        title: 'Example Title',
        width: 300,
        height: 200
      };

      component['isEditingImage'] = false;
      commandService.insertImage.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onImageCreated(imageData);

      expect(commandService.insertImage).toHaveBeenCalledWith(imageData);
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should update existing image when dialog emits imageCreated in edit mode', () => {
      const imageData: ImageData = {
        src: 'https://updated.com/image.jpg',
        alt: 'Updated Image',
        title: 'Updated Title',
        width: 400,
        height: 300
      };

      component['isEditingImage'] = true;
      commandService.updateImage.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onImageCreated(imageData);

      expect(commandService.updateImage).toHaveBeenCalledWith(imageData);
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should remove image when dialog emits imageRemoved', () => {
      commandService.removeImage.and.returnValue(true);
      spyOn(component['debounceService'], 'emitContentChange');

      component.onImageRemoved();

      expect(commandService.removeImage).toHaveBeenCalled();
      expect(component['debounceService'].emitContentChange).toHaveBeenCalled();
    });

    it('should close dialog when dialogClosed is emitted', () => {
      component.imageDialogVisible = true;
      component['currentImageData'] = { src: 'test', alt: 'test' };
      component['isEditingImage'] = true;

      component.onImageDialogClosed();

      expect(component.imageDialogVisible).toBeFalsy();
      expect(component['currentImageData']).toBeNull()
      expect(component['isEditingImage']).toBeFalsy();
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
      component['currentLinkData'] = { url: 'test', text: 'test' };
      component['isEditingLink'] = true;
      fixture.detectChanges();

      const linkDialog = fixture.debugElement.query(By.css('wysiwyg-link-dialog'));
      const dialogComponent = linkDialog.componentInstance;

      expect(dialogComponent.visible).toBe(component.linkDialogVisible);
      expect(dialogComponent.linkData).toBe(component['currentLinkData']);
      expect(dialogComponent.isEditing).toBe(component['isEditingLink']);
    });

    it('should pass correct props to image dialog', () => {
      component.imageDialogVisible = true;
      component['currentImageData'] = { src: 'test', alt: 'test' };
      component['isEditingImage'] = true;
      fixture.detectChanges();

      const imageDialog = fixture.debugElement.query(By.css('wysiwyg-image-dialog'));
      const dialogComponent = imageDialog.componentInstance;

      expect(dialogComponent.visible).toBe(component.imageDialogVisible);
      expect(dialogComponent.imageData).toBe(component['currentImageData']);
      expect(dialogComponent.isEditing).toBe(component['isEditingImage']);
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

    it('should handle form disabled state', () => {
      const formControl = new FormControl({ value: 'test', disabled: true });

      component.writeValue(formControl.value);
      component.registerOnChange((value) => formControl.setValue(value));
      component.setDisabledState(formControl.disabled);

      expect(component.readonly).toBeTruthy();
    });

    it('should call onTouched when blur occurs', () => {
      let touched = false;
      component.registerOnTouched(() => { touched = true; });

      const mockBlurEvent = new FocusEvent('blur');
      component.onBlur(mockBlurEvent);

      expect(touched).toBeTruthy();
    });
  });

  describe('Content Change Emission and Private Methods', () => {
    beforeEach(() => {
      spyOn(component.contentChange, 'emit');
      spyOn(component['debounceService'], 'emitContentChange');
      spyOn(component, 'debouncedContentChange' as any);
    });

    describe('emitContentChange private method', () => {
      it('should exist as a private method', () => {
        expect(typeof component['emitContentChange']).toBe('function');
      });

      it('should emit content change when content has changed', () => {
        component.content = 'new content';
        component['lastKnownContent'] = 'old content';

        component['emitContentChange']();

        expect(component['debounceService'].emitContentChange).toHaveBeenCalledWith('new content');
        expect(component['debouncedContentChange']).toHaveBeenCalledWith('new content');
      });

      it('should not emit content change when content has not changed', () => {
        component.content = 'same content';
        component['lastKnownContent'] = 'same content';

        component['emitContentChange']();

        expect(component['debounceService'].emitContentChange).not.toHaveBeenCalled();
        expect(component['debouncedContentChange']).not.toHaveBeenCalled();
      });

      it('should update lastKnownContent after emitting change', () => {
        component.content = 'new content';
        component['lastKnownContent'] = 'old content';

        component['emitContentChange']();

        expect(component['lastKnownContent']).toBe('new content');
      });
    });

    describe('hasContentChanged private method', () => {
      it('should return true when content has changed', () => {
        component.content = 'new content';
        component['lastKnownContent'] = 'old content';

        const result = component['hasContentChanged']();

        expect(result).toBeTruthy();
      });

      it('should return false when content has not changed', () => {
        component.content = 'same content';
        component['lastKnownContent'] = 'same content';

        const result = component['hasContentChanged']();

        expect(result).toBeFalsy();
      });

      it('should return true when content is empty and lastKnownContent is not', () => {
        component.content = '';
        component['lastKnownContent'] = 'some content';

        const result = component['hasContentChanged']();

        expect(result).toBeTruthy();
      });

      it('should return true when content is not empty and lastKnownContent is empty', () => {
        component.content = 'some content';
        component['lastKnownContent'] = '';

        const result = component['hasContentChanged']();

        expect(result).toBeTruthy();
      });
    });

    describe('updateLastKnownContent private method', () => {
      it('should update lastKnownContent to current content', () => {
        component.content = 'current content';
        component['lastKnownContent'] = 'old content';

        component['updateLastKnownContent']();

        expect(component['lastKnownContent']).toBe('current content');
      });

      it('should handle empty content', () => {
        component.content = '';
        component['lastKnownContent'] = 'old content';

        component['updateLastKnownContent']();

        expect(component['lastKnownContent']).toBe('');
      });
    });

    describe('Content change detection integration', () => {
      it('should call emitContentChange when onContentChange is called', () => {
        spyOn(component, 'emitContentChange' as any);

        component.onContentChange('new content');

        expect(component['emitContentChange']).toHaveBeenCalled();
      });

      it('should properly detect content changes in onContentChange', () => {
        component['lastKnownContent'] = 'old content';

        component.onContentChange('new content');

        expect(component.content).toBe('new content');
        expect(component['debounceService'].emitContentChange).toHaveBeenCalledWith('new content');
        expect(component['debouncedContentChange']).toHaveBeenCalledWith('new content');
      });

      it('should not emit duplicate content changes', () => {
        component.content = 'same content';
        component['lastKnownContent'] = 'same content';

        component.onContentChange('same content');

        expect(component['debounceService'].emitContentChange).not.toHaveBeenCalled();
        expect(component['debouncedContentChange']).not.toHaveBeenCalled();
      });

      it('should initialize lastKnownContent when writeValue is called', () => {
        component.writeValue('initial content');

        expect(component.content).toBe('initial content');
        expect(component['lastKnownContent']).toBe('initial content');
      });

      it('should handle null value in writeValue', () => {
        component.writeValue(null);

        expect(component.content).toBe('');
        expect(component['lastKnownContent']).toBe('');
      });
    });

    describe('Debouncing behavior', () => {
      it('should use debounced content change handler', fakeAsync(() => {
        const debouncedSpy = jasmine.createSpy('debouncedContentChange');
        component['debouncedContentChange'] = debouncedSpy;

        component.onContentChange('test content 1');
        component.onContentChange('test content 2');
        component.onContentChange('test content 3');

        // Should only call the debounced function once after the delay
        tick(300);

        expect(debouncedSpy).toHaveBeenCalledTimes(3); // Called immediately for each change
        expect(debouncedSpy).toHaveBeenCalledWith('test content 3');
      }));

      it('should emit to debounce service for each content change', () => {
        component['lastKnownContent'] = '';

        component.onContentChange('content 1');
        component.onContentChange('content 2');

        expect(component['debounceService'].emitContentChange).toHaveBeenCalledTimes(2);
        expect(component['debounceService'].emitContentChange).toHaveBeenCalledWith('content 1');
        expect(component['debounceService'].emitContentChange).toHaveBeenCalledWith('content 2');
      });
    });

    describe('Integration with other methods', () => {
      it('should call emitContentChange in link operations', () => {
        spyOn(component, 'emitContentChange' as any);
        commandService.createLink.and.returnValue(true);

        const linkData: LinkData = {
          url: 'https://example.com',
          text: 'Example',
          title: 'Example Title',
          target: '_blank'
        };

        component['isEditingLink'] = false;
        component.onLinkCreated(linkData);

        expect(component['emitContentChange']).toHaveBeenCalled();
      });

      it('should call emitContentChange in image operations', () => {
        spyOn(component, 'emitContentChange' as any);
        commandService.insertImage.and.returnValue(true);

        const imageData: ImageData = {
          src: 'https://example.com/image.jpg',
          alt: 'Example Image'
        };

        component['isEditingImage'] = false;
        component.onImageCreated(imageData);

        expect(component['emitContentChange']).toHaveBeenCalled();
      });

      it('should call emitContentChange when removing links', () => {
        spyOn(component, 'emitContentChange' as any);
        commandService.removeLink.and.returnValue(true);

        component['removeLink']();

        expect(component['emitContentChange']).toHaveBeenCalled();
      });

      it('should call emitContentChange when removing images', () => {
        spyOn(component, 'emitContentChange' as any);
        commandService.removeImage.and.returnValue(true);

        component['removeImage']();

        expect(component['emitContentChange']).toHaveBeenCalled();
      });

      it('should not call emitContentChange when operations fail', () => {
        spyOn(component, 'emitContentChange' as any);
        commandService.removeLink.and.returnValue(false);
        commandService.removeImage.and.returnValue(false);

        component['removeLink']();
        component['removeImage']();

        expect(component['emitContentChange']).not.toHaveBeenCalled();
      });
    });

    describe('Content change timing', () => {
      it('should emit content changes immediately when content changes', () => {
        component['lastKnownContent'] = 'old content';

        component.onContentChange('new content');

        expect(component['debounceService'].emitContentChange).toHaveBeenCalledWith('new content');
        expect(component['debouncedContentChange']).toHaveBeenCalledWith('new content');
      });

      it('should handle rapid content changes correctly', () => {
        component['lastKnownContent'] = '';

        component.onContentChange('a');
        component.onContentChange('ab');
        component.onContentChange('abc');

        expect(component['debounceService'].emitContentChange).toHaveBeenCalledTimes(3);
        expect(component['lastKnownContent']).toBe('abc');
      });

      it('should maintain content consistency during rapid changes', () => {
        const changes = ['a', 'ab', 'abc', 'abcd', 'abcde'];
        
        changes.forEach(change => {
          component.onContentChange(change);
          expect(component.content).toBe(change);
          expect(component['lastKnownContent']).toBe(change);
        });
      });
    });
  });

  describe('Form Integration', () => {
    it('should validate form control', () => {
      const formControl = new FormControl('test content');
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