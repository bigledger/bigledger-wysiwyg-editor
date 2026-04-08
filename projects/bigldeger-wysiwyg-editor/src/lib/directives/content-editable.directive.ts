import { 
  Directive, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  Inject, 
  PLATFORM_ID,
  HostListener,
  Output,
  EventEmitter
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Directive to enhance contenteditable behavior with better cross-browser support
 * and additional functionality for WYSIWYG editing
 */
@Directive({
  selector: '[wysiwygContentEditable]',
  standalone: true
})
export class ContentEditableDirective implements OnInit, OnDestroy {
  @Output() contentEditableInput = new EventEmitter<Event>();
  @Output() contentEditableKeydown = new EventEmitter<KeyboardEvent>();
  @Output() contentEditablePaste = new EventEmitter<ClipboardEvent>();

  private mutationObserver?: MutationObserver;
  private isComposing = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeDirective();
    }
  }

  ngOnDestroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  private initializeDirective(): void {
    const element = this.elementRef.nativeElement;
    
    // Ensure the element has proper attributes for accessibility
    this.setupAccessibility();
    
    // Set up mutation observer to track DOM changes
    this.setupMutationObserver();
    
    // Ensure proper initial state
    this.ensureProperStructure();
  }

  private setupAccessibility(): void {
    const element = this.elementRef.nativeElement;
    
    // Set ARIA attributes if not already set
    if (!element.getAttribute('role')) {
      element.setAttribute('role', 'textbox');
    }
    
    if (!element.getAttribute('aria-multiline')) {
      element.setAttribute('aria-multiline', 'true');
    }
    
    // Ensure proper tabindex
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  private setupMutationObserver(): void {
    if (!window.MutationObserver) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldEmitChange = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || 
            mutation.type === 'characterData' || 
            mutation.type === 'attributes') {
          shouldEmitChange = true;
        }
      });
      
      if (shouldEmitChange && !this.isComposing) {
        // Emit a synthetic input event
        const event = new Event('input', { bubbles: true });
        this.contentEditableInput.emit(event);
      }
    });

    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  private ensureProperStructure(): void {
    const element = this.elementRef.nativeElement;
    
    // If element is empty, add a paragraph to maintain structure
    if (element.innerHTML.trim() === '' || element.innerHTML === '<br>') {
      element.innerHTML = '<p><br></p>';
    }
    
    // Ensure we don't have orphaned text nodes at the root level
    this.wrapOrphanedTextNodes();
  }

  private wrapOrphanedTextNodes(): void {
    const element = this.elementRef.nativeElement;
    const childNodes = Array.from(element.childNodes);
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        // Wrap orphaned text node in a paragraph
        const paragraph = document.createElement('p');
        paragraph.textContent = node.textContent;
        element.replaceChild(paragraph, node);
      }
    });
  }

  @HostListener('compositionstart', ['$event'])
  onCompositionStart(event: CompositionEvent): void {
    this.isComposing = true;
  }

  @HostListener('compositionend', ['$event'])
  onCompositionEnd(event: CompositionEvent): void {
    this.isComposing = false;
    // Emit input event after composition ends
    const inputEvent = new Event('input', { bubbles: true });
    this.contentEditableInput.emit(inputEvent);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (!this.isComposing) {
      this.handleInput(event);
      this.contentEditableInput.emit(event);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    this.handleKeydown(event);
    this.contentEditableKeydown.emit(event);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    this.handlePaste(event);
    this.contentEditablePaste.emit(event);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    // Handle drag and drop
    event.preventDefault();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle file drops (images, etc.)
      this.handleFileDrop(event, files);
    } else {
      // Handle text/HTML drops
      const htmlData = event.dataTransfer?.getData('text/html');
      const textData = event.dataTransfer?.getData('text/plain');
      
      const content = htmlData || textData;
      if (content) {
        this.handleContentDrop(event, content);
      }
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  private handleInput(event: Event): void {
    // Clean up any unwanted elements or attributes
    this.cleanupContent();
    
    // Ensure proper structure is maintained
    this.maintainStructure();
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Handle special key combinations
    if (event.key === 'Enter') {
      this.handleEnterKey(event);
    } else if (event.key === 'Backspace') {
      this.handleBackspaceKey(event);
    } else if (event.key === 'Delete') {
      this.handleDeleteKey(event);
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    // The component will handle the actual paste logic
    // This directive just ensures proper structure after paste
    setTimeout(() => {
      this.cleanupContent();
      this.maintainStructure();
    }, 10);
  }

  private handleEnterKey(event: KeyboardEvent): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // If we're at the end of the content and there's no proper block element,
    // ensure we create a proper paragraph
    if (this.isAtEndOfContent(range) && !this.isInBlockElement(container)) {
      event.preventDefault();
      this.insertParagraphAtEnd();
    }
  }

  private handleBackspaceKey(event: KeyboardEvent): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Prevent deletion of the last paragraph if it would leave the editor empty
    if (this.wouldLeaveEditorEmpty(range)) {
      event.preventDefault();
      this.clearCurrentParagraph();
    }
  }

  private handleDeleteKey(event: KeyboardEvent): void {
    // Similar logic to backspace
    this.handleBackspaceKey(event);
  }

  private handleFileDrop(event: DragEvent, files: FileList): void {
    // Emit a custom event that the component can handle
    const customEvent = new CustomEvent('fileDrop', {
      detail: { files, event },
      bubbles: true
    });
    this.elementRef.nativeElement.dispatchEvent(customEvent);
  }

  private handleContentDrop(event: DragEvent, content: string): void {
    // Insert content at drop position
    const range = this.getRangeFromPoint(event.clientX, event.clientY);
    if (range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Let the component handle content insertion
      const customEvent = new CustomEvent('contentDrop', {
        detail: { content, event },
        bubbles: true
      });
      this.elementRef.nativeElement.dispatchEvent(customEvent);
    }
  }

  private cleanupContent(): void {
    const element = this.elementRef.nativeElement;
    
    // Remove empty paragraphs except the last one
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
      if (index < paragraphs.length - 1 && this.isEmpty(p)) {
        p.remove();
      }
    });
    
    // Remove unwanted attributes
    this.removeUnwantedAttributes();
  }

  private maintainStructure(): void {
    const element = this.elementRef.nativeElement;
    
    // Ensure we always have at least one paragraph
    if (this.isEmpty(element)) {
      element.innerHTML = '<p><br></p>';
    }
    
    // Wrap any orphaned text nodes
    this.wrapOrphanedTextNodes();
  }

  private removeUnwantedAttributes(): void {
    const element = this.elementRef.nativeElement;
    const allowedAttributes = [
      'style', 'class', 'href', 'src', 'alt', 'title', 'target', 'rel',
      'width', 'height', 'controls', 'playsinline', 'preload', 'poster',
      'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy', 'loading',
      'colspan', 'rowspan', 'cellpadding', 'cellspacing', 'border',
      'contenteditable'
    ];
    
    // Remove unwanted attributes from all elements
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }

  private isAtEndOfContent(range: Range): boolean {
    const element = this.elementRef.nativeElement;
    const lastChild = element.lastElementChild || element.lastChild;
    
    if (!lastChild) return true;
    
    return range.endContainer === lastChild || 
           (lastChild.contains && lastChild.contains(range.endContainer));
  }

  private isInBlockElement(node: Node): boolean {
    const blockElements = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'];
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
    
    while (current && current !== this.elementRef.nativeElement) {
      if (blockElements.includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }

  private wouldLeaveEditorEmpty(range: Range): boolean {
    const element = this.elementRef.nativeElement;
    const paragraphs = element.querySelectorAll('p');
    
    return paragraphs.length === 1 && 
           range.startOffset === 0 && 
           this.isEmpty(paragraphs[0]);
  }

  private insertParagraphAtEnd(): void {
    const element = this.elementRef.nativeElement;
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<br>';
    element.appendChild(paragraph);
    
    // Move cursor to the new paragraph
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  private clearCurrentParagraph(): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const paragraph = this.findParentParagraph(range.startContainer);
    
    if (paragraph) {
      paragraph.innerHTML = '<br>';
      range.setStart(paragraph, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private findParentParagraph(node: Node): Element | null {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
    
    while (current && current !== this.elementRef.nativeElement) {
      if (current.tagName === 'P') {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }

  private isEmpty(element: Element): boolean {
    const text = element.textContent?.trim() || '';
    const html = element.innerHTML.trim();
    return text === '' || html === '<br>' || html === '';
  }

  private getRangeFromPoint(x: number, y: number): Range | null {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y);
    } else if ((document as any).caretPositionFromPoint) {
      const position = (document as any).caretPositionFromPoint(x, y);
      if (position) {
        const range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
        return range;
      }
    }
    return null;
  }
}
