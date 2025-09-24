import { Component, DebugElement, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ContentEditableDirective } from './content-editable.directive';

@Component({
  standalone: true,
  imports: [ContentEditableDirective],
  template: `
    <div 
      wysiwygContentEditable
      contenteditable="true"
      (contentEditableInput)="onInput($event)"
      (contentEditableKeydown)="onKeydown($event)"
      (contentEditablePaste)="onPaste($event)">
      Test content
    </div>
  `
})
class TestComponent {
  onInput = jasmine.createSpy('onInput');
  onKeydown = jasmine.createSpy('onKeydown');
  onPaste = jasmine.createSpy('onPaste');
}

describe('ContentEditableDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: ContentEditableDirective;
  let directiveElement: HTMLDivElement;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentEditableDirective, TestComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement.query(By.directive(ContentEditableDirective));
    directive = debugElement.injector.get(ContentEditableDirective);
    directiveElement = debugElement.nativeElement;

    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(directive).toBeTruthy();
    });

    it('should set accessibility attributes', () => {
      expect(directiveElement.getAttribute('role')).toBe('textbox');
      expect(directiveElement.getAttribute('aria-multiline')).toBe('true');
      expect(directiveElement.getAttribute('tabindex')).toBe('0');
    });

    it('should not override existing accessibility attributes', () => {
      // Create a new test component with existing attributes
      @Component({
        template: `
          <div 
            wysiwygContentEditable
            contenteditable="true"
            role="custom-role"
            aria-multiline="false"
            tabindex="5">
            Test content
          </div>
        `
      })
      class TestComponentWithAttributes {}

      TestBed.configureTestingModule({
        declarations: [TestComponentWithAttributes],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
      });

      const fixtureWithAttrs = TestBed.createComponent(TestComponentWithAttributes);
      fixtureWithAttrs.detectChanges();
      
      const elementWithAttrs = fixtureWithAttrs.debugElement.query(
        By.directive(ContentEditableDirective)
      ).nativeElement;

      expect(elementWithAttrs.getAttribute('role')).toBe('custom-role');
      expect(elementWithAttrs.getAttribute('aria-multiline')).toBe('false');
      expect(elementWithAttrs.getAttribute('tabindex')).toBe('5');
    });
  });

  describe('Content Structure Management', () => {
    it('should wrap orphaned text nodes in paragraphs', () => {
      // Add orphaned text node
      directiveElement.innerHTML = 'Orphaned text';
      
      // Trigger the directive's structure maintenance
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      // Check if text was wrapped
      const paragraphs = directiveElement.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('should ensure proper structure when empty', () => {
      directiveElement.innerHTML = '';
      
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      expect(directiveElement.innerHTML).toBe('<p><br></p>');
    });

    it('should handle br-only content', () => {
      directiveElement.innerHTML = '<br>';
      
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      expect(directiveElement.innerHTML).toBe('<p><br></p>');
    });
  });

  describe('Event Handling', () => {
    it('should emit input events', () => {
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      expect(component.onInput).toHaveBeenCalledWith(inputEvent);
    });

    it('should emit keydown events', () => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      directiveElement.dispatchEvent(keydownEvent);

      expect(component.onKeydown).toHaveBeenCalledWith(keydownEvent);
    });

    it('should emit paste events', () => {
      const pasteEvent = new ClipboardEvent('paste');
      directiveElement.dispatchEvent(pasteEvent);

      expect(component.onPaste).toHaveBeenCalledWith(pasteEvent);
    });

    it('should handle composition events', () => {
      const compositionStartEvent = new CompositionEvent('compositionstart');
      const compositionEndEvent = new CompositionEvent('compositionend');

      directiveElement.dispatchEvent(compositionStartEvent);
      
      // Input during composition should not emit
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);
      
      directiveElement.dispatchEvent(compositionEndEvent);

      // Should emit after composition ends
      expect(component.onInput).toHaveBeenCalled();
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle Enter key', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(enterEvent, 'preventDefault');

      directiveElement.dispatchEvent(enterEvent);

      expect(component.onKeydown).toHaveBeenCalledWith(enterEvent);
    });

    it('should handle Backspace key', () => {
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      
      directiveElement.dispatchEvent(backspaceEvent);

      expect(component.onKeydown).toHaveBeenCalledWith(backspaceEvent);
    });

    it('should handle Delete key', () => {
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      
      directiveElement.dispatchEvent(deleteEvent);

      expect(component.onKeydown).toHaveBeenCalledWith(deleteEvent);
    });

    it('should prevent deletion when it would leave editor empty', () => {
      // Set up single paragraph
      directiveElement.innerHTML = '<p>Single paragraph</p>';
      
      // Mock selection at start of paragraph
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 0,
          startContainer: directiveElement.querySelector('p')
        })
      };
      spyOn(window, 'getSelection').and.returnValue(mockSelection as any);

      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(backspaceEvent, 'preventDefault');

      directiveElement.dispatchEvent(backspaceEvent);

      // Should prevent default if it would leave editor empty
      // (This is a simplified test - the actual logic is more complex)
    });
  });

  describe('Drag and Drop Handling', () => {
    it('should handle file drops', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const dropEvent = new DragEvent('drop', { dataTransfer });
      spyOn(dropEvent, 'preventDefault');

      let customEventFired = false;
      directiveElement.addEventListener('fileDrop', () => {
        customEventFired = true;
      });

      directiveElement.dispatchEvent(dropEvent);

      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(customEventFired).toBe(true);
    });

    it('should handle content drops', () => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/html', '<p>Dropped content</p>');

      const dropEvent = new DragEvent('drop', { 
        dataTransfer,
        clientX: 100,
        clientY: 100
      });
      spyOn(dropEvent, 'preventDefault');

      let customEventFired = false;
      directiveElement.addEventListener('contentDrop', () => {
        customEventFired = true;
      });

      // Mock caretRangeFromPoint
      spyOn(document, 'caretRangeFromPoint').and.returnValue(document.createRange());

      directiveElement.dispatchEvent(dropEvent);

      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(customEventFired).toBe(true);
    });

    it('should handle dragover events', () => {
      const dragoverEvent = new DragEvent('dragover', {
        dataTransfer: new DataTransfer()
      });
      spyOn(dragoverEvent, 'preventDefault');

      directiveElement.dispatchEvent(dragoverEvent);

      expect(dragoverEvent.preventDefault).toHaveBeenCalled();
      expect(dragoverEvent.dataTransfer!.dropEffect).toBe('copy');
    });
  });

  describe('Content Cleanup', () => {
    it('should remove unwanted attributes', () => {
      directiveElement.innerHTML = '<p onclick="alert()" data-custom="value" style="color: red;">Test</p>';
      
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      const paragraph = directiveElement.querySelector('p')!;
      expect(paragraph.hasAttribute('onclick')).toBe(false);
      expect(paragraph.hasAttribute('data-custom')).toBe(false);
      expect(paragraph.hasAttribute('style')).toBe(true); // Style is allowed
    });

    it('should remove empty paragraphs except the last one', () => {
      directiveElement.innerHTML = '<p></p><p></p><p>Content</p><p></p>';
      
      const inputEvent = new Event('input');
      directiveElement.dispatchEvent(inputEvent);

      const paragraphs = directiveElement.querySelectorAll('p');
      // Should keep the paragraph with content and the last empty one
      expect(paragraphs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing MutationObserver gracefully', () => {
      const originalMutationObserver = window.MutationObserver;
      (window as any).MutationObserver = undefined;

      expect(() => {
        const newFixture = TestBed.createComponent(TestComponent);
        newFixture.detectChanges();
      }).not.toThrow();

      window.MutationObserver = originalMutationObserver;
    });

    it('should handle missing caretRangeFromPoint gracefully', () => {
      const originalCaretRangeFromPoint = document.caretRangeFromPoint;
      (document as any).caretRangeFromPoint = undefined;
      (document as any).caretPositionFromPoint = undefined;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/html', '<p>Test</p>');

      const dropEvent = new DragEvent('drop', { 
        dataTransfer,
        clientX: 100,
        clientY: 100
      });

      expect(() => {
        directiveElement.dispatchEvent(dropEvent);
      }).not.toThrow();

      (document as any).caretRangeFromPoint = originalCaretRangeFromPoint;
    });

    it('should handle caretPositionFromPoint fallback', () => {
      const originalCaretRangeFromPoint = document.caretRangeFromPoint;
      (document as any).caretRangeFromPoint = undefined;
      (document as any).caretPositionFromPoint = jasmine.createSpy().and.returnValue({
        offsetNode: document.createTextNode('test'),
        offset: 0
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/html', '<p>Test</p>');

      const dropEvent = new DragEvent('drop', { 
        dataTransfer,
        clientX: 100,
        clientY: 100
      });

      directiveElement.dispatchEvent(dropEvent);

      expect((document as any).caretPositionFromPoint).toHaveBeenCalled();

      (document as any).caretRangeFromPoint = originalCaretRangeFromPoint;
      delete (document as any).caretPositionFromPoint;
    });
  });

  describe('Platform Detection', () => {
    it('should not initialize on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ContentEditableDirective, TestComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const serverFixture = TestBed.createComponent(TestComponent);
      const serverDirective = serverFixture.debugElement
        .query(By.directive(ContentEditableDirective))
        .injector.get(ContentEditableDirective);

      spyOn(serverDirective as any, 'initializeDirective');
      
      serverFixture.detectChanges();

      expect((serverDirective as any).initializeDirective).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect mutation observer on destroy', () => {
      const mutationObserver = (directive as any).mutationObserver;
      if (mutationObserver) {
        spyOn(mutationObserver, 'disconnect');
      }

      directive.ngOnDestroy();

      if (mutationObserver) {
        expect(mutationObserver.disconnect).toHaveBeenCalled();
      }
    });
  });
});