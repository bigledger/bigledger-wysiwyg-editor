import { Injectable, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

/**
 * Service for managing accessibility features in the WYSIWYG editor
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private focusedElement$ = new BehaviorSubject<HTMLElement | null>(null);
  private keyboardShortcuts: KeyboardShortcut[] = [];
  private focusableElements: FocusableElement[] = [];
  private trapFocus = false;
  private focusTrapContainer: HTMLElement | null = null;

  constructor() {
    this.initializeKeyboardShortcuts();
  }

  /**
   * Get the currently focused element
   */
  getFocusedElement(): Observable<HTMLElement | null> {
    return this.focusedElement$.asObservable();
  }

  /**
   * Set the currently focused element
   */
  setFocusedElement(element: HTMLElement | null): void {
    this.focusedElement$.next(element);
  }

  /**
   * Initialize default keyboard shortcuts
   */
  private initializeKeyboardShortcuts(): void {
    this.keyboardShortcuts = [
      { key: 'b', ctrlKey: true, action: 'bold', description: 'Toggle bold formatting' },
      { key: 'i', ctrlKey: true, action: 'italic', description: 'Toggle italic formatting' },
      { key: 'u', ctrlKey: true, action: 'underline', description: 'Toggle underline formatting' },
      { key: 'k', ctrlKey: true, action: 'createLink', description: 'Insert or edit link' },
      { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo last action' },
      { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo last action' },
      { key: 'z', ctrlKey: true, shiftKey: true, action: 'redo', description: 'Redo last action' },
      { key: 'a', ctrlKey: true, action: 'selectAll', description: 'Select all content' },
      { key: 'Enter', action: 'activateButton', description: 'Activate focused button' },
      { key: ' ', action: 'activateButton', description: 'Activate focused button' },
      { key: 'Escape', action: 'closeDialog', description: 'Close open dialog or dropdown' },
      { key: 'Tab', action: 'navigateNext', description: 'Move to next focusable element' },
      { key: 'Tab', shiftKey: true, action: 'navigatePrevious', description: 'Move to previous focusable element' },
      { key: 'ArrowDown', action: 'navigateDown', description: 'Navigate down in menus' },
      { key: 'ArrowUp', action: 'navigateUp', description: 'Navigate up in menus' },
      { key: 'ArrowLeft', action: 'navigateLeft', description: 'Navigate left in toolbar' },
      { key: 'ArrowRight', action: 'navigateRight', description: 'Navigate right in toolbar' },
      { key: 'Home', action: 'navigateFirst', description: 'Move to first element' },
      { key: 'End', action: 'navigateLast', description: 'Move to last element' }
    ];
  }

  /**
   * Get keyboard shortcuts
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return [...this.keyboardShortcuts];
  }

  /**
   * Add a custom keyboard shortcut
   */
  addKeyboardShortcut(shortcut: KeyboardShortcut): void {
    this.keyboardShortcuts.push(shortcut);
  }

  /**
   * Remove a keyboard shortcut
   */
  removeKeyboardShortcut(action: string): void {
    this.keyboardShortcuts = this.keyboardShortcuts.filter(s => s.action !== action);
  }

  /**
   * Check if a keyboard event matches a shortcut
   */
  matchesShortcut(event: KeyboardEvent, action: string): boolean {
    const shortcut = this.keyboardShortcuts.find(s => s.action === action);
    if (!shortcut) return false;

    return (
      event.key === shortcut.key &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.metaKey === !!shortcut.metaKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.altKey === !!shortcut.altKey
    );
  }

  /**
   * Get shortcut description for an action
   */
  getShortcutDescription(action: string): string {
    const shortcut = this.keyboardShortcuts.find(s => s.action === action);
    return shortcut?.description || '';
  }

  /**
   * Get shortcut key combination for an action
   */
  getShortcutKeys(action: string): string {
    const shortcut = this.keyboardShortcuts.find(s => s.action === action);
    if (!shortcut) return '';

    const keys: string[] = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.metaKey) keys.push('Cmd');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());

    return keys.join('+');
  }

  /**
   * Set up focus trap for dialogs
   */
  setupFocusTrap(container: HTMLElement): void {
    this.focusTrapContainer = container;
    this.trapFocus = true;
    this.updateFocusableElements();
    
    // Focus first focusable element
    const firstFocusable = this.getFirstFocusableElement();
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap(): void {
    this.trapFocus = false;
    this.focusTrapContainer = null;
    this.focusableElements = [];
  }

  /**
   * Update list of focusable elements
   */
  updateFocusableElements(): void {
    if (!this.focusTrapContainer) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = this.focusTrapContainer.querySelectorAll(focusableSelectors);
    
    this.focusableElements = Array.from(elements).map((element, index) => ({
      element: element as HTMLElement,
      tabIndex: (element as HTMLElement).tabIndex || 0,
      role: element.getAttribute('role') || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined
    }));
  }

  /**
   * Get first focusable element
   */
  getFirstFocusableElement(): HTMLElement | null {
    return this.focusableElements.length > 0 ? this.focusableElements[0].element : null;
  }

  /**
   * Get last focusable element
   */
  getLastFocusableElement(): HTMLElement | null {
    return this.focusableElements.length > 0 
      ? this.focusableElements[this.focusableElements.length - 1].element 
      : null;
  }

  /**
   * Navigate to next focusable element
   */
  navigateToNext(currentElement: HTMLElement): HTMLElement | null {
    const currentIndex = this.focusableElements.findIndex(f => f.element === currentElement);
    if (currentIndex === -1) return null;

    const nextIndex = (currentIndex + 1) % this.focusableElements.length;
    return this.focusableElements[nextIndex].element;
  }

  /**
   * Navigate to previous focusable element
   */
  navigateToPrevious(currentElement: HTMLElement): HTMLElement | null {
    const currentIndex = this.focusableElements.findIndex(f => f.element === currentElement);
    if (currentIndex === -1) return null;

    const prevIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
    return this.focusableElements[prevIndex].element;
  }

  /**
   * Handle Tab key navigation with focus trap
   */
  handleTabNavigation(event: KeyboardEvent): boolean {
    if (!this.trapFocus || !this.focusTrapContainer) return false;

    const activeElement = document.activeElement as HTMLElement;
    
    if (event.shiftKey) {
      // Shift+Tab - navigate backwards
      if (activeElement === this.getFirstFocusableElement()) {
        event.preventDefault();
        const lastElement = this.getLastFocusableElement();
        if (lastElement) {
          lastElement.focus();
        }
        return true;
      }
    } else {
      // Tab - navigate forwards
      if (activeElement === this.getLastFocusableElement()) {
        event.preventDefault();
        const firstElement = this.getFirstFocusableElement();
        if (firstElement) {
          firstElement.focus();
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Announce text to screen readers
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Set ARIA attributes on an element
   */
  setAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  }

  /**
   * Generate unique ID for ARIA relationships
   */
  generateId(prefix: string = 'wysiwyg'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is visible and focusable
   */
  isElementFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('tabindex') === '-1') {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  /**
   * Get accessible name for an element
   */
  getAccessibleName(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check associated label
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent || '';
      }
    }

    // Check title attribute
    const title = element.getAttribute('title');
    if (title) return title;

    // Fall back to text content
    return element.textContent || '';
  }

  /**
   * Set up roving tabindex for toolbar navigation
   */
  setupRovingTabindex(container: HTMLElement, selector: string): void {
    const elements = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    
    elements.forEach((element, index) => {
      element.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      element.addEventListener('keydown', (event) => {
        this.handleRovingTabindexNavigation(event, elements, element);
      });

      element.addEventListener('focus', () => {
        // Update tabindex when element receives focus
        elements.forEach(el => el.setAttribute('tabindex', '-1'));
        element.setAttribute('tabindex', '0');
      });
    });
  }

  /**
   * Handle keyboard navigation for roving tabindex
   */
  private handleRovingTabindexNavigation(
    event: KeyboardEvent, 
    elements: NodeListOf<HTMLElement>, 
    currentElement: HTMLElement
  ): void {
    const currentIndex = Array.from(elements).indexOf(currentElement);
    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = (currentIndex + 1) % elements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = elements.length - 1;
        break;
      default:
        return;
    }

    if (targetIndex !== currentIndex) {
      elements[targetIndex].focus();
    }
  }
}