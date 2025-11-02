import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  forwardRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';

import { SelectionState } from '../../models/selection-state.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { CommandService } from '../../services/command.service';
import { ContentEditableDirective } from '../../directives/content-editable.directive';
import { TableHandlerService } from '../../services/table-handler.service';
import { NestedTableService } from '../../services/nested-table.service';

@Component({
  selector: 'wysiwyg-editor-content',
  standalone: true,
  imports: [CommonModule, ContentEditableDirective],
  host: {
    'style': 'display: flex; flex-direction: column; width: 100%; flex: 1;'
  },
  template: `
    <div 
      *ngIf="!htmlMode"
      #contentArea
      class="wysiwyg-content"
      [class.readonly]="readonly"
      [class.focused]="isFocused"
      [style.height]="height"
      [style.min-height]="minHeight"
      [style.max-height]="maxHeight"
      [attr.contenteditable]="!readonly"
      [attr.data-placeholder]="placeholder"
      [attr.aria-label]="ariaLabel || 'Rich text editor'"
      [attr.aria-multiline]="true"
      [attr.role]="'textbox'"
      [attr.spellcheck]="spellCheck"
      wysiwygContentEditable
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
      (keyup)="onKeyup($event)"
      (paste)="onPaste($event)"
      (focus)="onFocus($event)"
      (blur)="onBlur($event)"
      (mouseup)="onMouseUp($event)"
      (touchend)="onTouchEnd($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="onClick($event)">
    </div>
    
    <textarea
      *ngIf="htmlMode"
      #htmlTextarea
      class="wysiwyg-html-view"
      [style.height]="height"
      [style.min-height]="minHeight"
      [style.max-height]="maxHeight"
      [value]="content"
      [readonly]="readonly"
      [attr.spellcheck]="false"
      [attr.aria-label]="'HTML code editor'"
      (input)="onHtmlInput($event)"
      (focus)="onFocus($event)"
      (blur)="onBlur($event)">{{content}}</textarea>
  `,
  styleUrls: ['./editor-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorContentComponent),
      multi: true
    }
  ]
})
export class EditorContentComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('contentArea', { static: false }) contentArea!: ElementRef<HTMLDivElement>;
  @ViewChild('htmlTextarea', { static: false }) htmlTextarea!: ElementRef<HTMLTextAreaElement>;

  @Input() content: string = '';
  @Input() placeholder: string = '';
  @Input() readonly: boolean = false;
  @Input() height: string = '300px';
  @Input() minHeight: string = '100px';
  @Input() maxHeight: string = '600px';
  @Input() spellCheck: boolean = true;
  @Input() ariaLabel: string = '';

  private _htmlMode: boolean = false;
  @Input()
  set htmlMode(value: boolean) {
    const oldValue = this._htmlMode;
    this._htmlMode = value;

    if (oldValue !== value) {
      this.onHtmlModeChange(value);
    }
  }
  get htmlMode(): boolean {
    return this._htmlMode;
  }

  @Output() contentChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectionState>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() commandExecuted = new EventEmitter<EditorCommand>();

  isFocused = false;
  private destroy$ = new Subject<void>();
  private contentChangeSubject = new Subject<string>();
  private selectionChangeSubject = new Subject<void>();

  // ControlValueAccessor implementation
  private onChange = (value: string) => { };
  private onTouched = () => { };

  constructor(
    private selectionService: SelectionService,
    private sanitizerService: HTMLSanitizerService,
    private commandService: CommandService,
    private tableHandlerService: TableHandlerService,
    public nestedTableService: NestedTableService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Debounce content changes to avoid excessive emissions
    this.contentChangeSubject
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(content => {
        this.contentChange.emit(content);
        this.onChange(content);
      });

    // Debounce selection changes
    this.selectionChangeSubject
      .pipe(
        debounceTime(50),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.emitSelectionChange();
      });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeContent();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && !changes['content'].firstChange) {
      // Content changed from parent, update the view
      if (this.htmlMode && this.htmlTextarea?.nativeElement) {
        this.htmlTextarea.nativeElement.value = this.content;
      } else if (!this.htmlMode) {
        // DON'T update content area if user is actively editing
        // This prevents cursor jumping and handle duplication when typing in tables
        if (!this.isFocused) {
          this.updateContentArea();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up table handlers
    this.tableHandlerService.cleanup();
    
    // Clean up nested table service
    this.nestedTableService.cleanup();
  }

  // ControlValueAccessor methods
  writeValue(value: string | null): void {
    this.content = value || '';
    this.updateContentArea();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.readonly = isDisabled;
  }

  private initializeContent(): void {
    if (this.contentArea?.nativeElement) {
      this.updateContentArea();
      this.initializeImageHandlers();
      this.initializeTableHandlers();
    }
  }

  private updateContentArea(): void {
    if (!this.contentArea?.nativeElement) return;

    const element = this.contentArea.nativeElement;
    const sanitizedContent = this.sanitizerService.sanitize(this.content);

    if (element.innerHTML !== sanitizedContent) {
      element.innerHTML = sanitizedContent;
      this.initializeImageHandlers();
      // Only initialize tables once - they have __resizeInitialized flag
      // This prevents re-initialization when typing in cells
      this.initializeTableHandlers();
    }
  }

  /**
   * Handle HTML mode change
   */
  private onHtmlModeChange(isHtmlMode: boolean): void {
    if (isHtmlMode) {
      // Switching to HTML mode - get content from contentArea and format it
      if (this.contentArea?.nativeElement) {
        this.content = this.formatHtml(this.contentArea.nativeElement.innerHTML);

        // Force change detection and update textarea
        this.cdr.detectChanges();

        setTimeout(() => {
          if (this.htmlTextarea?.nativeElement) {
            this.htmlTextarea.nativeElement.value = this.content;
            this.cdr.detectChanges();
          }
        }, 50);
      }
    } else {
      // Switching to visual mode - get content from textarea and update contentArea
      if (this.htmlTextarea?.nativeElement) {
        this.content = this.htmlTextarea.nativeElement.value;
      }

      // Force change detection and update contentArea
      this.cdr.detectChanges();

      setTimeout(() => {
        this.updateContentArea();
        this.cdr.detectChanges();

        // Emit content change to sync with parent
        this.contentChangeSubject.next(this.content);
      }, 50);
    }
  }

  /**
   * Format HTML for better readability
   */
  private formatHtml(html: string): string {
    if (!html) return '';

    // Remove extra whitespace
    let formatted = html.trim();

    // Add line breaks after closing tags
    formatted = formatted.replace(/(<\/[^>]+>)/g, '$1\n');

    // Add line breaks before opening tags (except inline elements)
    formatted = formatted.replace(/(<(?:div|p|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|section|article|header|footer|nav|aside)[^>]*>)/g, '\n$1');

    // Add line breaks after self-closing tags
    formatted = formatted.replace(/(<(?:br|img|hr|input)[^>]*\/?>)/g, '$1\n');

    // Indent nested elements
    const lines = formatted.split('\n').filter(line => line.trim());
    let indentLevel = 0;
    const indentSize = 2;

    formatted = lines.map((line) => {
      const trimmed = line.trim();

      // Decrease indent for closing tags
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indented = ' '.repeat(indentLevel * indentSize) + trimmed;

      // Increase indent for opening tags (but not self-closing or inline elements)
      if (trimmed.startsWith('<') &&
        !trimmed.startsWith('</') &&
        !trimmed.endsWith('/>') &&
        !trimmed.match(/<(span|a|strong|em|b|i|u|code|small|mark)[^>]*>/)) {
        indentLevel++;
      }

      return indented;
    }).join('\n');

    return formatted;
  }

  onInput(event: Event): void {
    if (this.readonly) return;

    const target = event.target as HTMLDivElement;
    const content = target.innerHTML;

    this.content = content;
    this.contentChangeSubject.next(content);
    this.selectionChangeSubject.next();
  }

  onHtmlInput(event: Event): void {
    if (this.readonly) return;

    const target = event.target as HTMLTextAreaElement;
    const content = target.value;

    this.content = content;
    this.contentChangeSubject.next(content);

    // Also trigger selection change to update toolbar state
    this.selectionChangeSubject.next();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.readonly) return;

    // Handle special key combinations
    if (event.ctrlKey || event.metaKey) {
      this.handleShortcuts(event);
    }

    // Handle Enter key in different contexts
    if (event.key === 'Enter') {
      this.handleEnterKey(event);
    }

    // Handle Tab key for indentation
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }

    // Handle Backspace and Delete
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.handleDeleteKey(event);
    }
  }

  onKeyup(event: KeyboardEvent): void {
    // Update selection state after key operations
    this.selectionChangeSubject.next();
  }

  onPaste(event: ClipboardEvent): void {
    if (this.readonly) return;

    event.preventDefault();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    let pastedContent = '';

    // Try to get HTML content first, then fall back to plain text
    if (clipboardData.types.includes('text/html')) {
      pastedContent = clipboardData.getData('text/html');
    } else {
      const plainText = clipboardData.getData('text/plain');
      pastedContent = this.escapeHtml(plainText);
    }

    // Sanitize the pasted content
    const sanitizedContent = this.sanitizerService.sanitize(pastedContent);

    // Insert the sanitized content at the current cursor position
    this.insertHtmlAtCursor(sanitizedContent);

    // Trigger content change
    this.updateContentFromDOM();
  }

  onFocus(event: FocusEvent): void {
    this.isFocused = true;
    this.focusEvent.emit(event);
    this.selectionChangeSubject.next();
  }

  onBlur(event: FocusEvent): void {
    this.isFocused = false;
    this.onTouched();
    this.blurEvent.emit(event);
  }

  onMouseUp(event: MouseEvent): void {
    // Update selection state after mouse operations
    setTimeout(() => {
      this.selectionChangeSubject.next();
    }, 10);
  }

  onTouchEnd(event: TouchEvent): void {
    // Update selection state after touch operations
    setTimeout(() => {
      this.selectionChangeSubject.next();
    }, 10);
  }

  onDragOver(event: DragEvent): void {
    if (this.readonly) return;

    // Check if dragged item contains files
    const hasFiles = event.dataTransfer?.types.includes('Files');
    if (hasFiles) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';

      // Add visual feedback for drag over
      this.contentArea.nativeElement.classList.add('drag-over');
    }
  }

  onDrop(event: DragEvent): void {
    if (this.readonly) return;

    // Remove drag over visual feedback
    this.contentArea.nativeElement.classList.remove('drag-over');

    const success = this.commandService.handleImageDrop(event, this.contentArea.nativeElement);

    if (success) {
      const command: EditorCommand = { name: 'insertImage' };
      this.commandExecuted.emit(command);
      setTimeout(() => {
        this.updateContentFromDOM();
        this.selectionChangeSubject.next();
        this.setupImageHandlers();
      }, 100); // Allow time for FileReader to complete
    }
  }

  onDragLeave(event: DragEvent): void {
    // Remove drag over visual feedback when leaving the drop zone
    if (!this.contentArea.nativeElement.contains(event.relatedTarget as Node)) {
      this.contentArea.nativeElement.classList.remove('drag-over');
    }
  }

  onClick(event: MouseEvent): void {
    const target = event.target as Element;

    // Check if clicking inside a table cell (for nested table insertion)
    if (target.tagName === 'TD' || target.tagName === 'TH') {
      this.nestedTableService.handleCellClick(event as MouseEvent);
      // Don't return - continue to handle table selection
    }

    // Handle table selection
    if (target && target.tagName === 'TABLE') {
      const tableElement = target as HTMLTableElement;
      this.tableHandlerService.selectTable(tableElement);
      event.preventDefault();
      return;
    }

    // Check if clicking inside a table
    const tableParent = this.findParentElement(target as Node, 'TABLE');
    if (tableParent) {
      this.tableHandlerService.selectTable(tableParent as HTMLTableElement);
      return;
    }

    // Handle image selection
    if (target && target.tagName === 'IMG') {
      const imgElement = target as HTMLImageElement;
      this.selectImage(imgElement);
      this.addImageSelectionHandlers(imgElement);
      event.preventDefault();
    } else {
      // Clear image selection if clicking elsewhere
      this.clearImageSelection();
      // Clear table selection if clicking elsewhere
      this.tableHandlerService.deselectTable();
      // Clear cell toolbar if clicking elsewhere
      this.nestedTableService.hideCellToolbar();
    }
  }

  private handleShortcuts(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    // Handle basic formatting shortcuts
    switch (key) {
      case 'b':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleBold();
        }
        break;
      case 'i':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleItalic();
        }
        break;
      case 'u':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleUnderline();
        }
        break;
      default:
        // Let other shortcuts bubble up to parent components
        break;
    }
  }

  private handleEnterKey(event: KeyboardEvent): void {
    // Handle Enter key behavior in different contexts
    const selection = this.selectionService.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check if we're in a list item
    const listItem = this.findParentElement(container, 'LI');
    if (listItem) {
      this.handleEnterInList(event, listItem);
      return;
    }

    // Default behavior - create new paragraph
    // Let browser handle this naturally
  }

  private handleTabKey(event: KeyboardEvent): void {
    event.preventDefault();

    const selection = this.selectionService.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check if we're in a list item
    const listItem = this.findParentElement(container, 'LI');
    if (listItem) {
      this.handleTabInList(event, listItem);
      return;
    }

    // Insert tab character or spaces
    this.insertHtmlAtCursor('&nbsp;&nbsp;&nbsp;&nbsp;');
    this.updateContentFromDOM();
  }

  private handleDeleteKey(event: KeyboardEvent): void {
    // Handle special delete scenarios
    const selection = this.selectionService.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Let browser handle normal delete operations
    // We'll update content after the operation
    setTimeout(() => {
      this.updateContentFromDOM();
    }, 10);
  }

  private handleEnterInList(event: KeyboardEvent, listItem: Element): void {
    const isEmpty = listItem.textContent?.trim() === '';

    if (isEmpty && !event.shiftKey) {
      // Exit list on empty item
      event.preventDefault();
      this.exitList(listItem);
    } else if (event.shiftKey) {
      // Shift+Enter creates a line break within the list item
      event.preventDefault();
      this.insertLineBreakInListItem();
    }
    // Otherwise, let browser create new list item
  }

  private handleTabInList(event: KeyboardEvent, listItem: Element): void {
    if (event.shiftKey) {
      // Outdent
      const success = this.commandService.outdentListItem();
      if (success) {
        this.updateContentFromDOM();
      }
    } else {
      // Indent
      const success = this.commandService.indentListItem();
      if (success) {
        this.updateContentFromDOM();
      }
    }
  }

  private exitList(listItem: Element): void {
    const list = listItem.parentElement;
    if (!list) return;

    // Create a new paragraph after the list
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<br>';

    if (list.parentElement) {
      list.parentElement.insertBefore(paragraph, list.nextSibling);
    }

    // Remove the empty list item
    listItem.remove();

    // If list is now empty, remove it
    if (list.children.length === 0) {
      list.remove();
    }

    // Move cursor to the new paragraph
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    this.updateContentFromDOM();
  }

  private insertLineBreakInListItem(): void {
    const selection = this.selectionService.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const br = document.createElement('br');
    range.insertNode(br);

    // Move cursor after the line break
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    this.updateContentFromDOM();
  }



  private insertHtmlAtCursor(html: string): void {
    const selection = this.selectionService.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);

    // Move cursor to end of inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private updateContentFromDOM(): void {
    if (!this.contentArea?.nativeElement) return;

    const content = this.contentArea.nativeElement.innerHTML;
    this.content = content;
    this.contentChangeSubject.next(content);
  }

  private emitSelectionChange(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const selectionState = this.selectionService.saveSelection();
    this.selectionChange.emit(selectionState);
  }

  private findParentElement(node: Node, tagName: string): Element | null {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;

    while (current && current !== this.contentArea?.nativeElement) {
      if (current.tagName === tagName) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods for external control
  focusElement(): void {
    if (this.contentArea?.nativeElement && !this.readonly) {
      this.contentArea.nativeElement.focus();
    }
  }

  blurElement(): void {
    if (this.contentArea?.nativeElement) {
      this.contentArea.nativeElement.blur();
    }
  }

  getContent(): string {
    return this.content;
  }

  setContent(content: string): void {
    this.content = content;
    this.updateContentArea();
    this.contentChangeSubject.next(content);
  }

  insertContent(html: string): void {
    if (this.readonly) return;

    const sanitizedHtml = this.sanitizerService.sanitize(html);
    this.insertHtmlAtCursor(sanitizedHtml);
    this.updateContentFromDOM();
  }

  clear(): void {
    if (this.readonly) return;

    this.setContent('');
  }

  // Formatting methods
  toggleBold(): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'bold' };
    const success = this.commandService.executeCommand(command);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  toggleItalic(): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'italic' };
    const success = this.commandService.executeCommand(command);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  toggleUnderline(): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'underline' };
    const success = this.commandService.executeCommand(command);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Font size formatting
  setFontSize(size: string): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'fontSize' };
    const success = this.commandService.executeCommand(command, size);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Font color formatting
  setFontColor(color: string): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'foreColor' };
    const success = this.commandService.executeCommand(command, color);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Background color formatting
  setBackgroundColor(color: string): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'backColor' };
    const success = this.commandService.executeCommand(command, color);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Check if formatting is active
  isBold(): boolean {
    return this.commandService.getCommandState('bold');
  }

  isItalic(): boolean {
    return this.commandService.getCommandState('italic');
  }

  isUnderline(): boolean {
    return this.commandService.getCommandState('underline');
  }

  getCurrentFontSize(): string {
    return this.commandService.getCommandValue('fontSize');
  }

  getCurrentFontColor(): string {
    return this.commandService.getCommandValue('foreColor');
  }

  getCurrentBackgroundColor(): string {
    return this.commandService.getCommandValue('backColor');
  }

  // List formatting methods
  createBulletList(): void {
    if (this.readonly) return;

    const success = this.commandService.createBulletList();

    if (success) {
      const command: EditorCommand = { name: 'insertUnorderedList' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  createNumberedList(): void {
    if (this.readonly) return;

    const success = this.commandService.createNumberedList();

    if (success) {
      const command: EditorCommand = { name: 'insertOrderedList' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  indentList(): void {
    if (this.readonly) return;

    const success = this.commandService.indentListItem();

    if (success) {
      const command: EditorCommand = { name: 'indent' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  outdentList(): void {
    if (this.readonly) return;

    const success = this.commandService.outdentListItem();

    if (success) {
      const command: EditorCommand = { name: 'outdent' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Check list states
  isInList(): boolean {
    return this.commandService.isInList();
  }

  isInBulletList(): boolean {
    return this.commandService.isInBulletList();
  }

  isInNumberedList(): boolean {
    return this.commandService.isInNumberedList();
  }

  // Image manipulation methods
  insertImage(src: string, alt: string, title?: string, width?: number, height?: number): void {
    if (this.readonly) return;

    const imageData = { src, alt, title, width, height };
    const success = this.commandService.insertImage(imageData);

    if (success) {
      const command: EditorCommand = { name: 'insertImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  updateImage(src: string, alt: string, title?: string, width?: number, height?: number): void {
    if (this.readonly) return;

    const imageData = { src, alt, title, width, height };
    const success = this.commandService.updateImage(imageData);

    if (success) {
      const command: EditorCommand = { name: 'updateImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  removeImage(): void {
    if (this.readonly) return;

    const success = this.commandService.removeImage();

    if (success) {
      const command: EditorCommand = { name: 'removeImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  getImageData(): { src: string; alt: string; title?: string; width?: number; height?: number } | null {
    return this.commandService.getImageData();
  }

  isInImage(): boolean {
    return this.commandService.isInImage();
  }

  selectImage(imgElement: HTMLImageElement): void {
    const success = this.commandService.selectImage(imgElement);

    if (success) {
      this.selectionChangeSubject.next();
    }
  }

  resizeImage(scale: number): void {
    if (this.readonly) return;

    const success = this.commandService.resizeImage(scale);

    if (success) {
      const command: EditorCommand = { name: 'resizeImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  // Enhanced image management methods
  private setupImageHandlers(): void {
    if (!this.contentArea?.nativeElement) return;

    const images = this.contentArea.nativeElement.querySelectorAll('img');
    images.forEach(img => {
      this.addImageEventListeners(img);
    });
  }

  private addImageEventListeners(img: HTMLImageElement): void {
    // Remove existing listeners to avoid duplicates
    this.removeImageEventListeners(img);

    // Add click handler for selection
    img.addEventListener('click', this.handleImageClick.bind(this));

    // Add keyboard handler for selected images
    img.addEventListener('keydown', this.handleImageKeydown.bind(this));

    // Make image focusable
    img.setAttribute('tabindex', '0');

    // Add resize handles on selection
    img.addEventListener('mousedown', this.handleImageMouseDown.bind(this));
  }

  private removeImageEventListeners(img: HTMLImageElement): void {
    img.removeEventListener('click', this.handleImageClick.bind(this));
    img.removeEventListener('keydown', this.handleImageKeydown.bind(this));
    img.removeEventListener('mousedown', this.handleImageMouseDown.bind(this));
  }

  private handleImageClick(event: MouseEvent): void {
    if (this.readonly) return;

    const img = event.target as HTMLImageElement;
    this.selectImage(img);
    this.addImageSelectionHandlers(img);
    event.stopPropagation();
    event.preventDefault();
  }

  private handleImageKeydown(event: KeyboardEvent): void {
    if (this.readonly) return;

    const img = event.target as HTMLImageElement;

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.removeSelectedImage(img);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        this.moveImageSelection(event.key, img);
        break;
      case 'Enter':
        event.preventDefault();
        this.editImageProperties(img);
        break;
      case 'Escape':
        event.preventDefault();
        this.clearImageSelection();
        break;
    }
  }

  private handleImageMouseDown(event: MouseEvent): void {
    if (this.readonly) return;

    const img = event.target as HTMLImageElement;

    // Check if clicking on resize handle (bottom-right corner)
    const rect = img.getBoundingClientRect();
    const handleSize = 12;
    const isResizeHandle =
      event.clientX >= rect.right - handleSize &&
      event.clientY >= rect.bottom - handleSize;

    if (isResizeHandle) {
      event.preventDefault();
      this.startImageResize(img, event);
    }
  }

  private addImageSelectionHandlers(img: HTMLImageElement): void {
    // Clear any existing selections
    this.clearImageSelection();

    // Add selected class
    img.classList.add('selected');

    // Add resize handles
    this.addResizeHandles(img);

    // Focus the image for keyboard navigation
    img.focus();
  }

  private clearImageSelection(): void {
    if (!this.contentArea?.nativeElement) return;

    const selectedImages = this.contentArea.nativeElement.querySelectorAll('img.selected');
    selectedImages.forEach(img => {
      img.classList.remove('selected');
      this.removeResizeHandles(img as HTMLImageElement);
    });
  }

  private addResizeHandles(img: HTMLImageElement): void {
    // Add resizable class for CSS styling
    img.classList.add('resizable');
  }

  private removeResizeHandles(img: HTMLImageElement): void {
    img.classList.remove('resizable');
  }

  private removeSelectedImage(img: HTMLImageElement): void {
    // Select the image first to ensure proper removal
    this.commandService.selectImage(img);

    const success = this.commandService.removeImage();

    if (success) {
      const command: EditorCommand = { name: 'removeImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  private moveImageSelection(direction: string, currentImg: HTMLImageElement): void {
    const images = Array.from(this.contentArea.nativeElement.querySelectorAll('img'));
    const currentIndex = images.indexOf(currentImg);

    let nextIndex = currentIndex;

    switch (direction) {
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = Math.min(images.length - 1, currentIndex + 1);
        break;
    }

    if (nextIndex !== currentIndex && images[nextIndex]) {
      this.selectImage(images[nextIndex] as HTMLImageElement);
      this.addImageSelectionHandlers(images[nextIndex] as HTMLImageElement);
    }
  }

  private editImageProperties(img: HTMLImageElement): void {
    // Emit event to parent component to open image dialog
    const imageData = {
      src: img.src,
      alt: img.alt,
      title: img.title || undefined,
      width: img.width || undefined,
      height: img.height || undefined
    };

    // This would typically trigger opening an image properties dialog
    const command: EditorCommand = { name: 'editImage', value: imageData };
    this.commandExecuted.emit(command);
  }

  private startImageResize(img: HTMLImageElement, startEvent: MouseEvent): void {
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const startWidth = img.offsetWidth;
    const startHeight = img.offsetHeight;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Use the larger delta to maintain aspect ratio
      const delta = Math.max(deltaX, deltaY);

      const newWidth = Math.max(50, startWidth + delta); // Minimum width of 50px
      const newHeight = newWidth / aspectRatio;

      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;

      // Update the actual width/height attributes
      img.width = newWidth;
      img.height = newHeight;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Emit resize command
      const command: EditorCommand = { name: 'resizeImage' };
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Enhanced image insertion with better positioning
  insertImageAtCursor(src: string, alt: string, title?: string, width?: number, height?: number): void {
    if (this.readonly) return;

    const imageData = { src, alt, title, width, height };
    const success = this.commandService.insertImage(imageData);

    if (success) {
      const command: EditorCommand = { name: 'insertImage' };
      this.commandExecuted.emit(command);
      setTimeout(() => {
        this.updateContentFromDOM();
        this.selectionChangeSubject.next();
        this.setupImageHandlers();

        // Select the newly inserted image
        const images = this.contentArea.nativeElement.querySelectorAll('img');
        const lastImage = images[images.length - 1] as HTMLImageElement;
        if (lastImage && lastImage.src === src) {
          this.selectImage(lastImage);
          this.addImageSelectionHandlers(lastImage);
        }
      }, 50);
    }
  }

  // Batch image operations
  removeAllImages(): void {
    if (this.readonly) return;

    const images = this.contentArea.nativeElement.querySelectorAll('img');
    images.forEach(img => img.remove());

    this.updateContentFromDOM();
    this.selectionChangeSubject.next();
  }

  getImageCount(): number {
    return this.contentArea.nativeElement.querySelectorAll('img').length;
  }

  getAllImages(): HTMLImageElement[] {
    return Array.from(this.contentArea.nativeElement.querySelectorAll('img'));
  }

  // Initialize image handlers when content is set
  private initializeImageHandlers(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.setupImageHandlers();
      }, 0);
    }
  }

  // Initialize table handlers when content is set
  private initializeTableHandlers(): void {
    if (isPlatformBrowser(this.platformId) && this.contentArea?.nativeElement) {
      setTimeout(() => {
        this.tableHandlerService.initializeTableHandlers(this.contentArea.nativeElement);
      }, 0);
    }
  }
}