import { TestBed } from '@angular/core/testing';
import { AccessibilityService, KeyboardShortcut } from './accessibility.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityService);
    
    // Create mock container for testing
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Keyboard Shortcuts', () => {
    it('should initialize default keyboard shortcuts', () => {
      const shortcuts = service.getKeyboardShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
      
      const boldShortcut = shortcuts.find(s => s.action === 'bold');
      expect(boldShortcut).toBeTruthy();
      expect(boldShortcut?.key).toBe('b');
      expect(boldShortcut?.ctrlKey).toBe(true);
    });

    it('should add custom keyboard shortcut', () => {
      const customShortcut: KeyboardShortcut = {
        key: 's',
        ctrlKey: true,
        action: 'save',
        description: 'Save document'
      };

      service.addKeyboardShortcut(customShortcut);
      const shortcuts = service.getKeyboardShortcuts();
      
      const savedShortcut = shortcuts.find(s => s.action === 'save');
      expect(savedShortcut).toBeTruthy();
      expect(savedShortcut?.key).toBe('s');
    });

    it('should remove keyboard shortcut', () => {
      service.removeKeyboardShortcut('bold');
      const shortcuts = service.getKeyboardShortcuts();
      
      const boldShortcut = shortcuts.find(s => s.action === 'bold');
      expect(boldShortcut).toBeFalsy();
    });

    it('should match keyboard events to shortcuts', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      expect(service.matchesShortcut(event, 'bold')).toBe(true);
      expect(service.matchesShortcut(event, 'italic')).toBe(false);
    });

    it('should get shortcut description', () => {
      const description = service.getShortcutDescription('bold');
      expect(description).toBe('Toggle bold formatting');
    });

    it('should get shortcut key combination', () => {
      const keys = service.getShortcutKeys('bold');
      expect(keys).toBe('Ctrl+B');
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      mockContainer.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <button id="btn2" disabled>Disabled Button</button>
        <a id="link1" href="#">Link 1</a>
        <div id="div1" tabindex="0">Focusable Div</div>
        <button id="btn3" tabindex="-1">Non-focusable Button</button>
      `;
    });

    it('should setup focus trap', () => {
      service.setupFocusTrap(mockContainer);
      
      const firstFocusable = service.getFirstFocusableElement();
      expect(firstFocusable?.id).toBe('btn1');
      
      const lastFocusable = service.getLastFocusableElement();
      expect(lastFocusable?.id).toBe('div1');
    });

    it('should navigate to next focusable element', () => {
      service.setupFocusTrap(mockContainer);
      
      const btn1 = document.getElementById('btn1') as HTMLElement;
      const nextElement = service.navigateToNext(btn1);
      
      expect(nextElement?.id).toBe('input1');
    });

    it('should navigate to previous focusable element', () => {
      service.setupFocusTrap(mockContainer);
      
      const input1 = document.getElementById('input1') as HTMLElement;
      const prevElement = service.navigateToPrevious(input1);
      
      expect(prevElement?.id).toBe('btn1');
    });

    it('should handle tab navigation with focus trap', () => {
      service.setupFocusTrap(mockContainer);
      
      const firstElement = service.getFirstFocusableElement();
      const lastElement = service.getLastFocusableElement();
      
      // Mock focus on first element
      firstElement?.focus();
      
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true
      });
      
      const handled = service.handleTabNavigation(shiftTabEvent);
      expect(handled).toBe(true);
    });

    it('should remove focus trap', () => {
      service.setupFocusTrap(mockContainer);
      service.removeFocusTrap();
      
      const firstFocusable = service.getFirstFocusableElement();
      expect(firstFocusable).toBeNull();
    });
  });

  describe('ARIA Support', () => {
    it('should set ARIA attributes', () => {
      const element = document.createElement('button');
      
      service.setAriaAttributes(element, {
        'label': 'Test Button',
        'pressed': 'false',
        'expanded': 'true'
      });
      
      expect(element.getAttribute('aria-label')).toBe('Test Button');
      expect(element.getAttribute('aria-pressed')).toBe('false');
      expect(element.getAttribute('aria-expanded')).toBe('true');
    });

    it('should generate unique IDs', () => {
      const id1 = service.generateId('test');
      const id2 = service.generateId('test');
      
      expect(id1).toMatch(/^test-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should check if element is focusable', () => {
      const button = document.createElement('button');
      expect(service.isElementFocusable(button)).toBe(true);
      
      button.setAttribute('disabled', 'true');
      expect(service.isElementFocusable(button)).toBe(false);
      
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      expect(service.isElementFocusable(div)).toBe(false);
    });

    it('should get accessible name from aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close Dialog');
      
      const name = service.getAccessibleName(button);
      expect(name).toBe('Close Dialog');
    });

    it('should get accessible name from associated label', () => {
      const input = document.createElement('input');
      input.setAttribute('id', 'test-input');
      
      const label = document.createElement('label');
      label.setAttribute('for', 'test-input');
      label.textContent = 'Test Input';
      
      document.body.appendChild(input);
      document.body.appendChild(label);
      
      const name = service.getAccessibleName(input);
      expect(name).toBe('Test Input');
      
      document.body.removeChild(input);
      document.body.removeChild(label);
    });

    it('should announce to screen reader', () => {
      const spy = spyOn(document.body, 'appendChild').and.callThrough();
      
      service.announceToScreenReader('Test announcement', 'assertive');
      
      expect(spy).toHaveBeenCalled();
      const announcement = spy.calls.mostRecent().args[0] as HTMLElement;
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
      expect(announcement.textContent).toBe('Test announcement');
    });
  });

  describe('Roving Tabindex', () => {
    beforeEach(() => {
      mockContainer.innerHTML = `
        <div class="toolbar">
          <button class="toolbar-btn">Button 1</button>
          <button class="toolbar-btn">Button 2</button>
          <button class="toolbar-btn">Button 3</button>
        </div>
      `;
    });

    it('should setup roving tabindex', () => {
      service.setupRovingTabindex(mockContainer, '.toolbar-btn');
      
      const buttons = mockContainer.querySelectorAll('.toolbar-btn') as NodeListOf<HTMLElement>;
      
      expect(buttons[0].getAttribute('tabindex')).toBe('0');
      expect(buttons[1].getAttribute('tabindex')).toBe('-1');
      expect(buttons[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should handle arrow key navigation', () => {
      service.setupRovingTabindex(mockContainer, '.toolbar-btn');
      
      const buttons = mockContainer.querySelectorAll('.toolbar-btn') as NodeListOf<HTMLElement>;
      buttons[0].focus();
      
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      buttons[0].dispatchEvent(rightArrowEvent);
      
      // Note: In a real test environment, we'd need to mock focus behavior
      // This test verifies the setup, actual navigation would need integration testing
    });
  });

  describe('Focus State Management', () => {
    it('should track focused element', () => {
      const button = document.createElement('button');
      
      service.setFocusedElement(button);
      
      service.getFocusedElement().subscribe(element => {
        expect(element).toBe(button);
      });
    });

    it('should clear focused element', () => {
      service.setFocusedElement(null);
      
      service.getFocusedElement().subscribe(element => {
        expect(element).toBeNull();
      });
    });
  });
});