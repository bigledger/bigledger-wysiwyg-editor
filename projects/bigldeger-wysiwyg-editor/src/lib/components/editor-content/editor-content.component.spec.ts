import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement, PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

import { EditorContentComponent } from './editor-content.component';
import { ContentEditableDirective } from '../../directives/content-editable.directive';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { CommandService } from '../../services/command.service';
import { SelectionState } from '../../models/selection-state.interface';
import { EditorCommand } from '../../models/editor-command.interface';

describe('EditorContentComponent', () => {
  let component: EditorContentComponent;
  let fixture: ComponentFixture<EditorContentComponent>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let sanitizerService: jasmine.SpyObj<HTMLSanitizerService>;
  let commandService: jasmine.SpyObj<CommandService>;
  let contentElement: HTMLDivElement;

  beforeEach(async () => {
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'getSelection',
      'saveSelection',
      'restoreSelection'
    ]);
    
    const sanitizerServiceSpy = jasmine.createSpyObj('HTMLSanitizerService', [
      'sanitize'
    ]);

    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand',
      'getCommandState',
      'getCommandValue'
    ]);

    await TestBed.configureTestingModule({
      imports: [EditorContentComponent, ContentEditableDirective, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: HTMLSanitizerService, useValue: sanitizerServiceSpy },
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorContentComponent);
    component = fixture.componentInstance;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    sanitizerService = TestBed.inject(HTMLSanitizerService) as jasmine.SpyObj<HTMLSanitizerService>;
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;

    // Setup default spy returns
    sanitizerService.sanitize.and.returnValue('sanitized content');
    selectionService.saveSelection.and.returnValue({
      range: null,
      collapsed: true,
      formats: {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '14px',
        fontColor: '#000000',
        backgroundColor: '#ffffff',
        alignment: 'left'
      }
    } as SelectionState);
    commandService.executeCommand.and.returnValue(true);
    commandService.getCommandState.and.returnValue(false);
    commandService.getCommandValue.and.returnValue('');

    fixture.detectChanges();
    contentElement = fixture.debugElement.query(By.css('.wysiwyg-content')).nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render content area with correct attributes', () => {
      expect(contentElement).toBeTruthy();
      expect(contentElement.getAttribute('contenteditable')).toBe('true');
      expect(contentElement.getAttribute('role')).toBe('textbox');
      expect(contentElement.getAttribute('aria-multiline')).toBe('true');
    });

    it('should apply default styling and height', () => {
      expect(contentElement.style.height).toBe('300px');
    });

    it('should show placeholder when empty', () => {
      component.placeholder = 'Enter text here...';
      fixture.detectChanges();
      
      expect(contentElement.getAttribute('data-placeholder')).toBe('Enter text here...');
    });
  });

  describe('Input Properties', () => {
    it('should update content when content input changes', () => {
      const testContent = '<p>Test content</p>';
      component.content = testContent;
      component.writeValue(testContent);
      
      expect(sanitizerService.sanitize).toHaveBeenCalledWith(testContent);
    });

    it('should set readonly state', () => {
      component.readonly = true;
      fixture.detectChanges();
      
      expect(contentElement.getAttribute('contenteditable')).toBe('false');
      expect(contentElement.classList.contains('readonly')).toBe(true);
    });

    it('should apply custom height', () => {
      component.height = '500px';
      fixture.detectChanges();
      
      expect(contentElement.style.height).toBe('500px');
    });

    it('should set spellcheck attribute', () => {
      component.spellCheck = false;
      fixture.detectChanges();
      
      expect(contentElement.getAttribute('spellcheck')).toBe('false');
    });
  });

  describe('Content Editing', () => {
    it('should emit contentChange on input', fakeAsync(() => {
      spyOn(component.contentChange, 'emit');
      
      const inputEvent = new Event('input');
      contentElement.innerHTML = '<p>New content</p>';
      contentElement.dispatchEvent(inputEvent);
      
      tick(150); // Wait for debounce
      
      expect(component.contentChange.emit).toHaveBeenCalledWith('<p>New content</p>');
    }));

    it('should not emit contentChange when readonly', () => {
      component.readonly = true;
      spyOn(component.contentChange, 'emit');
      
      const inputEvent = new Event('input');
      contentElement.dispatchEvent(inputEvent);
      
      expect(component.contentChange.emit).not.toHaveBeenCalled();
    });

    it('should handle paste events', () => {
      spyOn(component, 'onPaste');
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      contentElement.dispatchEvent(pasteEvent);
      
      expect(component.onPaste).toHaveBeenCalled();
    });

    it('should sanitize pasted HTML content', () => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/html', '<script>alert("xss")</script><p>Safe content</p>');
      
      const pasteEvent = new ClipboardEvent('paste', { clipboardData });
      spyOn(pasteEvent, 'preventDefault');
      
      component.onPaste(pasteEvent);
      
      expect(pasteEvent.preventDefault).toHaveBeenCalled();
      expect(sanitizerService.sanitize).toHaveBeenCalled();
    });

    it('should handle plain text paste', () => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', 'Plain text content');
      
      const pasteEvent = new ClipboardEvent('paste', { clipboardData });
      spyOn(pasteEvent, 'preventDefault');
      
      component.onPaste(pasteEvent);
      
      expect(pasteEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Keyboard Handling', () => {
    it('should handle keydown events', () => {
      spyOn(component, 'onKeydown');
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      contentElement.dispatchEvent(keyEvent);
      
      expect(component.onKeydown).toHaveBeenCalled();
    });

    it('should handle Enter key in lists', () => {
      // Create a list item
      contentElement.innerHTML = '<ul><li>Item 1</li></ul>';
      const listItem = contentElement.querySelector('li')!;
      
      // Mock selection to be in the list item
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
          commonAncestorContainer: listItem.firstChild
        })
      } as any;
      selectionService.getSelection.and.returnValue(mockSelection);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(enterEvent);
      
      expect(selectionService.getSelection).toHaveBeenCalled();
    });

    it('should handle Tab key for indentation', () => {
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(tabEvent, 'preventDefault');
      
      component.onKeydown(tabEvent);
      
      expect(tabEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Shift+Tab for outdentation', () => {
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      });
      spyOn(shiftTabEvent, 'preventDefault');
      
      component.onKeydown(shiftTabEvent);
      
      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Focus and Blur', () => {
    it('should emit focus event and update state', () => {
      spyOn(component.focusEvent, 'emit');
      
      const focusEvent = new FocusEvent('focus');
      component.onFocus(focusEvent);
      
      expect(component.isFocused).toBe(true);
      expect(component.focusEvent.emit).toHaveBeenCalledWith(focusEvent);
    });

    it('should emit blur event and update state', () => {
      spyOn(component.blurEvent, 'emit');
      component.isFocused = true;
      
      const blurEvent = new FocusEvent('blur');
      component.onBlur(blurEvent);
      
      expect(component.isFocused).toBe(false);
      expect(component.blurEvent.emit).toHaveBeenCalledWith(blurEvent);
    });

    it('should update selection state on focus', fakeAsync(() => {
      spyOn(component.selectionChange, 'emit');
      
      const focusEvent = new FocusEvent('focus');
      component.onFocus(focusEvent);
      
      tick(60); // Wait for debounce
      
      expect(selectionService.saveSelection).toHaveBeenCalled();
      expect(component.selectionChange.emit).toHaveBeenCalled();
    }));
  });

  describe('Selection Handling', () => {
    it('should emit selection change on mouse up', fakeAsync(() => {
      spyOn(component.selectionChange, 'emit');
      
      const mouseEvent = new MouseEvent('mouseup');
      component.onMouseUp(mouseEvent);
      
      tick(60); // Wait for debounce and timeout
      
      expect(selectionService.saveSelection).toHaveBeenCalled();
      expect(component.selectionChange.emit).toHaveBeenCalled();
    }));

    it('should emit selection change on touch end', fakeAsync(() => {
      spyOn(component.selectionChange, 'emit');
      
      const touchEvent = new TouchEvent('touchend');
      component.onTouchEnd(touchEvent);
      
      tick(60); // Wait for debounce and timeout
      
      expect(selectionService.saveSelection).toHaveBeenCalled();
      expect(component.selectionChange.emit).toHaveBeenCalled();
    }));
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue', () => {
      const testValue = '<p>Test value</p>';
      component.writeValue(testValue);
      
      expect(component.content).toBe(testValue);
      expect(sanitizerService.sanitize).toHaveBeenCalledWith(testValue);
    });

    it('should handle null value in writeValue', () => {
      component.writeValue(null);
      
      expect(component.content).toBe('');
    });

    it('should register onChange callback', () => {
      const mockOnChange = jasmine.createSpy('onChange');
      component.registerOnChange(mockOnChange);
      
      // Trigger content change
      component.content = '<p>New content</p>';
      component['contentChangeSubject'].next('<p>New content</p>');
      
      // The onChange should be called through the debounced observable
    });

    it('should register onTouched callback', () => {
      const mockOnTouched = jasmine.createSpy('onTouched');
      component.registerOnTouched(mockOnTouched);
      
      const blurEvent = new FocusEvent('blur');
      component.onBlur(blurEvent);
      
      expect(mockOnTouched).toHaveBeenCalled();
    });

    it('should handle disabled state', () => {
      component.setDisabledState(true);
      
      expect(component.readonly).toBe(true);
    });
  });

  describe('Public Methods', () => {
    it('should focus the content area', () => {
      spyOn(contentElement, 'focus');
      
      component.focusElement();
      
      expect(contentElement.focus).toHaveBeenCalled();
    });

    it('should not focus when readonly', () => {
      component.readonly = true;
      spyOn(contentElement, 'focus');
      
      component.focusElement();
      
      expect(contentElement.focus).not.toHaveBeenCalled();
    });

    it('should blur the content area', () => {
      spyOn(contentElement, 'blur');
      
      component.blurElement();
      
      expect(contentElement.blur).toHaveBeenCalled();
    });

    it('should get current content', () => {
      component.content = '<p>Current content</p>';
      
      expect(component.getContent()).toBe('<p>Current content</p>');
    });

    it('should set content', fakeAsync(() => {
      spyOn(component.contentChange, 'emit');
      const newContent = '<p>New content</p>';
      
      component.setContent(newContent);
      tick(150);
      
      expect(component.content).toBe(newContent);
      expect(component.contentChange.emit).toHaveBeenCalledWith(newContent);
    }));

    it('should insert content at cursor', () => {
      const htmlContent = '<strong>Bold text</strong>';
      sanitizerService.sanitize.and.returnValue(htmlContent);
      
      // Mock selection
      const mockRange = {
        deleteContents: jasmine.createSpy(),
        createContextualFragment: jasmine.createSpy().and.returnValue(document.createDocumentFragment()),
        insertNode: jasmine.createSpy(),
        collapse: jasmine.createSpy()
      };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
        removeAllRanges: jasmine.createSpy(),
        addRange: jasmine.createSpy()
      };
      selectionService.getSelection.and.returnValue(mockSelection as any);
      
      component.insertContent(htmlContent);
      
      expect(sanitizerService.sanitize).toHaveBeenCalledWith(htmlContent);
    });

    it('should not insert content when readonly', () => {
      component.readonly = true;
      
      component.insertContent('<p>Test</p>');
      
      expect(sanitizerService.sanitize).not.toHaveBeenCalled();
    });

    it('should clear content', fakeAsync(() => {
      spyOn(component.contentChange, 'emit');
      
      component.clear();
      tick(150);
      
      expect(component.content).toBe('');
      expect(component.contentChange.emit).toHaveBeenCalledWith('');
    }));

    it('should not clear content when readonly', () => {
      component.readonly = true;
      component.content = '<p>Existing content</p>';
      
      component.clear();
      
      expect(component.content).toBe('<p>Existing content</p>');
    });
  });

  describe('List Handling', () => {
    beforeEach(() => {
      // Setup DOM with list structure
      contentElement.innerHTML = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
    });

    it('should handle Enter in empty list item', () => {
      const emptyListItem = document.createElement('li');
      emptyListItem.textContent = '';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(enterEvent, 'preventDefault');
      
      // Mock the private method call
      spyOn(component as any, 'findParentElement').and.returnValue(emptyListItem);
      
      component.onKeydown(enterEvent);
      
      // The method should be called but we can't easily test the private method
      expect(component['findParentElement']).toHaveBeenCalled();
    });

    it('should indent list item on Tab', () => {
      const listItem = contentElement.querySelector('li:last-child')!;
      
      // Mock selection in the list item
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
          commonAncestorContainer: listItem.firstChild
        })
      };
      selectionService.getSelection.and.returnValue(mockSelection as any);
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(tabEvent, 'preventDefault');
      
      component.onKeydown(tabEvent);
      
      expect(tabEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing selection gracefully', () => {
      selectionService.getSelection.and.returnValue(null);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      expect(() => component.onKeydown(enterEvent)).not.toThrow();
    });

    it('should handle missing clipboard data gracefully', () => {
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: null
      });
      
      expect(() => component.onPaste(pasteEvent)).not.toThrow();
    });
  });

  describe('Basic Text Formatting', () => {
    describe('Bold Formatting', () => {
      it('should toggle bold formatting', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.toggleBold();
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'bold' });
      }));

      it('should not toggle bold when readonly', () => {
        component.readonly = true;
        
        component.toggleBold();
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should handle Ctrl+B keyboard shortcut', () => {
        spyOn(component, 'toggleBold');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'b', 
          ctrlKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleBold).toHaveBeenCalled();
      });

      it('should handle Cmd+B keyboard shortcut on Mac', () => {
        spyOn(component, 'toggleBold');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'b', 
          metaKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleBold).toHaveBeenCalled();
      });

      it('should check if bold is active', () => {
        commandService.getCommandState.and.returnValue(true);
        
        const result = component.isBold();
        
        expect(commandService.getCommandState).toHaveBeenCalledWith('bold');
        expect(result).toBe(true);
      });
    });

    describe('Italic Formatting', () => {
      it('should toggle italic formatting', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.toggleItalic();
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'italic' });
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'italic' });
      }));

      it('should not toggle italic when readonly', () => {
        component.readonly = true;
        
        component.toggleItalic();
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should handle Ctrl+I keyboard shortcut', () => {
        spyOn(component, 'toggleItalic');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'i', 
          ctrlKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleItalic).toHaveBeenCalled();
      });

      it('should handle Cmd+I keyboard shortcut on Mac', () => {
        spyOn(component, 'toggleItalic');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'i', 
          metaKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleItalic).toHaveBeenCalled();
      });

      it('should check if italic is active', () => {
        commandService.getCommandState.and.returnValue(true);
        
        const result = component.isItalic();
        
        expect(commandService.getCommandState).toHaveBeenCalledWith('italic');
        expect(result).toBe(true);
      });
    });

    describe('Underline Formatting', () => {
      it('should toggle underline formatting', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.toggleUnderline();
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'underline' });
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'underline' });
      }));

      it('should not toggle underline when readonly', () => {
        component.readonly = true;
        
        component.toggleUnderline();
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should handle Ctrl+U keyboard shortcut', () => {
        spyOn(component, 'toggleUnderline');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'u', 
          ctrlKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleUnderline).toHaveBeenCalled();
      });

      it('should handle Cmd+U keyboard shortcut on Mac', () => {
        spyOn(component, 'toggleUnderline');
        
        const keyEvent = new KeyboardEvent('keydown', { 
          key: 'u', 
          metaKey: true 
        });
        spyOn(keyEvent, 'preventDefault');
        
        component.onKeydown(keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component.toggleUnderline).toHaveBeenCalled();
      });

      it('should check if underline is active', () => {
        commandService.getCommandState.and.returnValue(true);
        
        const result = component.isUnderline();
        
        expect(commandService.getCommandState).toHaveBeenCalledWith('underline');
        expect(result).toBe(true);
      });
    });

    describe('Font Size Formatting', () => {
      it('should set font size', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.setFontSize('18px');
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'fontSize' }, '18px');
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'fontSize' });
      }));

      it('should not set font size when readonly', () => {
        component.readonly = true;
        
        component.setFontSize('18px');
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should get current font size', () => {
        commandService.getCommandValue.and.returnValue('16px');
        
        const result = component.getCurrentFontSize();
        
        expect(commandService.getCommandValue).toHaveBeenCalledWith('fontSize');
        expect(result).toBe('16px');
      });
    });

    describe('Font Color Formatting', () => {
      it('should set font color', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.setFontColor('#ff0000');
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'foreColor' }, '#ff0000');
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'foreColor' });
      }));

      it('should not set font color when readonly', () => {
        component.readonly = true;
        
        component.setFontColor('#ff0000');
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should get current font color', () => {
        commandService.getCommandValue.and.returnValue('#000000');
        
        const result = component.getCurrentFontColor();
        
        expect(commandService.getCommandValue).toHaveBeenCalledWith('foreColor');
        expect(result).toBe('#000000');
      });
    });

    describe('Background Color Formatting', () => {
      it('should set background color', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.setBackgroundColor('#ffff00');
        tick(150);
        
        expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'backColor' }, '#ffff00');
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'backColor' });
      }));

      it('should not set background color when readonly', () => {
        component.readonly = true;
        
        component.setBackgroundColor('#ffff00');
        
        expect(commandService.executeCommand).not.toHaveBeenCalled();
      });

      it('should get current background color', () => {
        commandService.getCommandValue.and.returnValue('#ffffff');
        
        const result = component.getCurrentBackgroundColor();
        
        expect(commandService.getCommandValue).toHaveBeenCalledWith('backColor');
        expect(result).toBe('#ffffff');
      });
    });

    describe('Command Execution Failure', () => {
      it('should handle failed command execution gracefully', () => {
        commandService.executeCommand.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.toggleBold();
        
        expect(commandService.executeCommand).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });
    });
  });

  describe('List Formatting', () => {
    beforeEach(() => {
      // Add list-specific methods to command service spy
      commandService.createBulletList = jasmine.createSpy('createBulletList').and.returnValue(true);
      commandService.createNumberedList = jasmine.createSpy('createNumberedList').and.returnValue(true);
      commandService.indentListItem = jasmine.createSpy('indentListItem').and.returnValue(true);
      commandService.outdentListItem = jasmine.createSpy('outdentListItem').and.returnValue(true);
      commandService.isInList = jasmine.createSpy('isInList').and.returnValue(false);
      commandService.isInBulletList = jasmine.createSpy('isInBulletList').and.returnValue(false);
      commandService.isInNumberedList = jasmine.createSpy('isInNumberedList').and.returnValue(false);
    });

    describe('Bullet List Creation', () => {
      it('should create bullet list', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.createBulletList();
        tick(150);
        
        expect(commandService.createBulletList).toHaveBeenCalled();
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'insertUnorderedList' });
      }));

      it('should not create bullet list when readonly', () => {
        component.readonly = true;
        
        component.createBulletList();
        
        expect(commandService.createBulletList).not.toHaveBeenCalled();
      });

      it('should handle failed bullet list creation', () => {
        commandService.createBulletList.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.createBulletList();
        
        expect(commandService.createBulletList).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });
    });

    describe('Numbered List Creation', () => {
      it('should create numbered list', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.createNumberedList();
        tick(150);
        
        expect(commandService.createNumberedList).toHaveBeenCalled();
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'insertOrderedList' });
      }));

      it('should not create numbered list when readonly', () => {
        component.readonly = true;
        
        component.createNumberedList();
        
        expect(commandService.createNumberedList).not.toHaveBeenCalled();
      });

      it('should handle failed numbered list creation', () => {
        commandService.createNumberedList.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.createNumberedList();
        
        expect(commandService.createNumberedList).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });
    });

    describe('List Indentation', () => {
      it('should indent list item', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.indentList();
        tick(150);
        
        expect(commandService.indentListItem).toHaveBeenCalled();
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'indent' });
      }));

      it('should not indent when readonly', () => {
        component.readonly = true;
        
        component.indentList();
        
        expect(commandService.indentListItem).not.toHaveBeenCalled();
      });

      it('should handle failed indentation', () => {
        commandService.indentListItem.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.indentList();
        
        expect(commandService.indentListItem).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });

      it('should outdent list item', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.outdentList();
        tick(150);
        
        expect(commandService.outdentListItem).toHaveBeenCalled();
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'outdent' });
      }));

      it('should not outdent when readonly', () => {
        component.readonly = true;
        
        component.outdentList();
        
        expect(commandService.outdentListItem).not.toHaveBeenCalled();
      });

      it('should handle failed outdentation', () => {
        commandService.outdentListItem.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.outdentList();
        
        expect(commandService.outdentListItem).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });
    });

    describe('List State Detection', () => {
      it('should check if in list', () => {
        commandService.isInList.and.returnValue(true);
        
        const result = component.isInList();
        
        expect(commandService.isInList).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should check if in bullet list', () => {
        commandService.isInBulletList.and.returnValue(true);
        
        const result = component.isInBulletList();
        
        expect(commandService.isInBulletList).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should check if in numbered list', () => {
        commandService.isInNumberedList.and.returnValue(true);
        
        const result = component.isInNumberedList();
        
        expect(commandService.isInNumberedList).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe('List Keyboard Navigation', () => {
      beforeEach(() => {
        // Setup DOM with list structure
        contentElement.innerHTML = `
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        `;
      });

      it('should handle Tab key in list for indentation', () => {
        const listItem = contentElement.querySelector('li:last-child')!;
        
        // Mock selection in the list item
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => ({
            commonAncestorContainer: listItem.firstChild
          })
        };
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        spyOn(tabEvent, 'preventDefault');
        
        component.onKeydown(tabEvent);
        
        expect(tabEvent.preventDefault).toHaveBeenCalled();
        expect(commandService.indentListItem).toHaveBeenCalled();
      });

      it('should handle Shift+Tab key in list for outdentation', () => {
        const listItem = contentElement.querySelector('li:last-child')!;
        
        // Mock selection in the list item
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => ({
            commonAncestorContainer: listItem.firstChild
          })
        };
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const shiftTabEvent = new KeyboardEvent('keydown', { 
          key: 'Tab', 
          shiftKey: true 
        });
        spyOn(shiftTabEvent, 'preventDefault');
        
        component.onKeydown(shiftTabEvent);
        
        expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
        expect(commandService.outdentListItem).toHaveBeenCalled();
      });

      it('should handle Enter key in empty list item to exit list', () => {
        const emptyListItem = document.createElement('li');
        emptyListItem.textContent = '';
        contentElement.querySelector('ul')!.appendChild(emptyListItem);
        
        // Mock selection in the empty list item
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => ({
            commonAncestorContainer: emptyListItem
          })
        };
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(enterEvent, 'preventDefault');
        spyOn(component as any, 'findParentElement').and.returnValue(emptyListItem);
        spyOn(component as any, 'exitList');
        
        component.onKeydown(enterEvent);
        
        expect(enterEvent.preventDefault).toHaveBeenCalled();
        expect(component['exitList']).toHaveBeenCalledWith(emptyListItem);
      });

      it('should handle Shift+Enter in list item to create line break', () => {
        const listItem = contentElement.querySelector('li:first-child')!;
        
        // Mock selection in the list item
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => ({
            commonAncestorContainer: listItem.firstChild
          })
        };
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const shiftEnterEvent = new KeyboardEvent('keydown', { 
          key: 'Enter', 
          shiftKey: true 
        });
        spyOn(shiftEnterEvent, 'preventDefault');
        spyOn(component as any, 'findParentElement').and.returnValue(listItem);
        spyOn(component as any, 'insertLineBreakInListItem');
        
        component.onKeydown(shiftEnterEvent);
        
        expect(shiftEnterEvent.preventDefault).toHaveBeenCalled();
        expect(component['insertLineBreakInListItem']).toHaveBeenCalled();
      });

      it('should not handle Tab outside of list', () => {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Regular paragraph';
        contentElement.innerHTML = '';
        contentElement.appendChild(paragraph);
        
        // Mock selection in paragraph
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => ({
            commonAncestorContainer: paragraph.firstChild
          })
        };
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        spyOn(tabEvent, 'preventDefault');
        spyOn(component as any, 'findParentElement').and.returnValue(null);
        
        component.onKeydown(tabEvent);
        
        expect(tabEvent.preventDefault).toHaveBeenCalled();
        expect(commandService.indentListItem).not.toHaveBeenCalled();
      });
    });

    describe('List Exit and Line Break', () => {
      it('should exit list and create paragraph', fakeAsync(() => {
        const list = document.createElement('ul');
        const listItem = document.createElement('li');
        listItem.textContent = '';
        list.appendChild(listItem);
        contentElement.appendChild(list);
        
        spyOn(component.contentChange, 'emit');
        spyOn(document, 'createElement').and.returnValue(document.createElement('p'));
        
        // Call the private method directly for testing
        (component as any).exitList(listItem);
        tick(150);
        
        expect(document.createElement).toHaveBeenCalledWith('p');
        expect(component.contentChange.emit).toHaveBeenCalled();
      }));

      it('should insert line break in list item', fakeAsync(() => {
        const mockRange = {
          insertNode: jasmine.createSpy('insertNode'),
          setStartAfter: jasmine.createSpy('setStartAfter'),
          collapse: jasmine.createSpy('collapse')
        };
        
        const mockSelection = {
          rangeCount: 1,
          getRangeAt: () => mockRange,
          removeAllRanges: jasmine.createSpy('removeAllRanges'),
          addRange: jasmine.createSpy('addRange')
        };
        
        selectionService.getSelection.and.returnValue(mockSelection as any);
        spyOn(component.contentChange, 'emit');
        spyOn(document, 'createElement').and.returnValue(document.createElement('br'));
        
        // Call the private method directly for testing
        (component as any).insertLineBreakInListItem();
        tick(150);
        
        expect(document.createElement).toHaveBeenCalledWith('br');
        expect(mockRange.insertNode).toHaveBeenCalled();
        expect(component.contentChange.emit).toHaveBeenCalled();
      }));
    });

    describe('Error Handling in Lists', () => {
      it('should handle missing selection in list operations', () => {
        selectionService.getSelection.and.returnValue(null);
        
        expect(() => component.indentList()).not.toThrow();
        expect(() => component.outdentList()).not.toThrow();
        expect(commandService.indentListItem).not.toHaveBeenCalled();
        expect(commandService.outdentListItem).not.toHaveBeenCalled();
      });

      it('should handle Tab key with missing selection', () => {
        selectionService.getSelection.and.returnValue(null);
        
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        spyOn(tabEvent, 'preventDefault');
        
        expect(() => component.onKeydown(tabEvent)).not.toThrow();
        expect(tabEvent.preventDefault).toHaveBeenCalled();
      });

      it('should handle Enter key with missing selection', () => {
        selectionService.getSelection.and.returnValue(null);
        
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        
        expect(() => component.onKeydown(enterEvent)).not.toThrow();
      });
    });
  });

  describe('Image Management', () => {
    beforeEach(() => {
      // Add image-specific methods to command service spy
      commandService.insertImage = jasmine.createSpy('insertImage').and.returnValue(true);
      commandService.updateImage = jasmine.createSpy('updateImage').and.returnValue(true);
      commandService.removeImage = jasmine.createSpy('removeImage').and.returnValue(true);
      commandService.getImageData = jasmine.createSpy('getImageData').and.returnValue({
        src: 'test.jpg',
        alt: 'Test image',
        title: 'Test title',
        width: 200,
        height: 150
      });
      commandService.isInImage = jasmine.createSpy('isInImage').and.returnValue(false);
      commandService.selectImage = jasmine.createSpy('selectImage').and.returnValue(true);
      commandService.resizeImage = jasmine.createSpy('resizeImage').and.returnValue(true);
      commandService.handleImageDrop = jasmine.createSpy('handleImageDrop').and.returnValue(true);
    });

    describe('Image Insertion', () => {
      it('should insert image at cursor position', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.insertImageAtCursor('test.jpg', 'Test image', 'Test title', 200, 150);
        tick(150);
        
        const expectedImageData = { src: 'test.jpg', alt: 'Test image', title: 'Test title', width: 200, height: 150 };
        expect(commandService.insertImage).toHaveBeenCalledWith(expectedImageData);
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'insertImage' });
      }));

      it('should not insert image when readonly', () => {
        component.readonly = true;
        
        component.insertImageAtCursor('test.jpg', 'Test image');
        
        expect(commandService.insertImage).not.toHaveBeenCalled();
      });

      it('should handle failed image insertion', () => {
        commandService.insertImage.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.insertImageAtCursor('test.jpg', 'Test image');
        
        expect(commandService.insertImage).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });

      it('should setup image handlers after insertion', fakeAsync(() => {
        spyOn(component as any, 'setupImageHandlers');
        
        component.insertImageAtCursor('test.jpg', 'Test image');
        tick(60);
        
        expect(component['setupImageHandlers']).toHaveBeenCalled();
      }));
    });

    describe('Image Selection', () => {
      let mockImage: HTMLImageElement;

      beforeEach(() => {
        mockImage = document.createElement('img');
        mockImage.src = 'test.jpg';
        mockImage.alt = 'Test image';
        contentElement.appendChild(mockImage);
      });

      it('should select image on click', () => {
        spyOn(component, 'selectImage');
        spyOn(component as any, 'addImageSelectionHandlers');
        
        const clickEvent = new MouseEvent('click');
        Object.defineProperty(clickEvent, 'target', { value: mockImage });
        
        component.onClick(clickEvent);
        
        expect(component.selectImage).toHaveBeenCalledWith(mockImage);
        expect(component['addImageSelectionHandlers']).toHaveBeenCalledWith(mockImage);
      });

      it('should clear image selection when clicking elsewhere', () => {
        spyOn(component as any, 'clearImageSelection');
        
        const clickEvent = new MouseEvent('click');
        Object.defineProperty(clickEvent, 'target', { value: contentElement });
        
        component.onClick(clickEvent);
        
        expect(component['clearImageSelection']).toHaveBeenCalled();
      });

      it('should add selected class to image', () => {
        component['addImageSelectionHandlers'](mockImage);
        
        expect(mockImage.classList.contains('selected')).toBe(true);
        expect(mockImage.classList.contains('resizable')).toBe(true);
      });

      it('should clear image selection', () => {
        mockImage.classList.add('selected', 'resizable');
        
        component['clearImageSelection']();
        
        expect(mockImage.classList.contains('selected')).toBe(false);
        expect(mockImage.classList.contains('resizable')).toBe(false);
      });
    });

    describe('Image Removal', () => {
      let mockImage: HTMLImageElement;

      beforeEach(() => {
        mockImage = document.createElement('img');
        mockImage.src = 'test.jpg';
        mockImage.alt = 'Test image';
        contentElement.appendChild(mockImage);
      });

      it('should remove selected image', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component['removeSelectedImage'](mockImage);
        tick(150);
        
        expect(commandService.selectImage).toHaveBeenCalledWith(mockImage);
        expect(commandService.removeImage).toHaveBeenCalled();
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'removeImage' });
      }));

      it('should handle failed image removal', () => {
        commandService.removeImage.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component['removeSelectedImage'](mockImage);
        
        expect(commandService.removeImage).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });

      it('should remove all images', fakeAsync(() => {
        const mockImage2 = document.createElement('img');
        mockImage2.src = 'test2.jpg';
        contentElement.appendChild(mockImage2);
        
        spyOn(component.contentChange, 'emit');
        
        component.removeAllImages();
        tick(150);
        
        expect(contentElement.querySelectorAll('img').length).toBe(0);
        expect(component.contentChange.emit).toHaveBeenCalled();
      }));

      it('should not remove images when readonly', () => {
        component.readonly = true;
        
        component.removeAllImages();
        
        expect(contentElement.querySelectorAll('img').length).toBe(1);
      });
    });

    describe('Image Keyboard Navigation', () => {
      let mockImage: HTMLImageElement;

      beforeEach(() => {
        mockImage = document.createElement('img');
        mockImage.src = 'test.jpg';
        mockImage.alt = 'Test image';
        mockImage.setAttribute('tabindex', '0');
        contentElement.appendChild(mockImage);
      });

      it('should handle Delete key to remove image', () => {
        spyOn(component as any, 'removeSelectedImage');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        spyOn(keyEvent, 'preventDefault');
        
        component['handleImageKeydown'](keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component['removeSelectedImage']).toHaveBeenCalled();
      });

      it('should handle Backspace key to remove image', () => {
        spyOn(component as any, 'removeSelectedImage');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
        spyOn(keyEvent, 'preventDefault');
        
        component['handleImageKeydown'](keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component['removeSelectedImage']).toHaveBeenCalled();
      });

      it('should handle Enter key to edit image properties', () => {
        spyOn(component as any, 'editImageProperties');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(keyEvent, 'preventDefault');
        
        component['handleImageKeydown'](keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component['editImageProperties']).toHaveBeenCalledWith(mockImage);
      });

      it('should handle Escape key to clear selection', () => {
        spyOn(component as any, 'clearImageSelection');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        spyOn(keyEvent, 'preventDefault');
        
        component['handleImageKeydown'](keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component['clearImageSelection']).toHaveBeenCalled();
      });

      it('should handle arrow keys for navigation', () => {
        spyOn(component as any, 'moveImageSelection');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        spyOn(keyEvent, 'preventDefault');
        
        component['handleImageKeydown'](keyEvent);
        
        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(component['moveImageSelection']).toHaveBeenCalledWith('ArrowRight', mockImage);
      });

      it('should not handle keys when readonly', () => {
        component.readonly = true;
        spyOn(component as any, 'removeSelectedImage');
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        
        component['handleImageKeydown'](keyEvent);
        
        expect(component['removeSelectedImage']).not.toHaveBeenCalled();
      });
    });

    describe('Image Resizing', () => {
      let mockImage: HTMLImageElement;

      beforeEach(() => {
        mockImage = document.createElement('img');
        mockImage.src = 'test.jpg';
        mockImage.alt = 'Test image';
        mockImage.width = 200;
        mockImage.height = 150;
        contentElement.appendChild(mockImage);
      });

      it('should resize image by scale', fakeAsync(() => {
        spyOn(component.commandExecuted, 'emit');
        spyOn(component.contentChange, 'emit');
        
        component.resizeImage(1.5);
        tick(150);
        
        expect(commandService.resizeImage).toHaveBeenCalledWith(1.5);
        expect(component.commandExecuted.emit).toHaveBeenCalledWith({ name: 'resizeImage' });
      }));

      it('should not resize image when readonly', () => {
        component.readonly = true;
        
        component.resizeImage(1.5);
        
        expect(commandService.resizeImage).not.toHaveBeenCalled();
      });

      it('should handle failed image resize', () => {
        commandService.resizeImage.and.returnValue(false);
        spyOn(component.commandExecuted, 'emit');
        
        component.resizeImage(1.5);
        
        expect(commandService.resizeImage).toHaveBeenCalled();
        expect(component.commandExecuted.emit).not.toHaveBeenCalled();
      });

      it('should start image resize on mouse down on resize handle', () => {
        spyOn(component as any, 'startImageResize');
        
        // Mock getBoundingClientRect
        spyOn(mockImage, 'getBoundingClientRect').and.returnValue({
          right: 200,
          bottom: 150,
          left: 0,
          top: 0,
          width: 200,
          height: 150,
          x: 0,
          y: 0,
          toJSON: () => ({})
        } as DOMRect);
        
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: 195, // Near right edge
          clientY: 145  // Near bottom edge
        });
        spyOn(mouseEvent, 'preventDefault');
        
        component['handleImageMouseDown'](mouseEvent);
        
        expect(mouseEvent.preventDefault).toHaveBeenCalled();
      });
    });
  });
});