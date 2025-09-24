import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionState } from '../models/selection-state.interface';
import { EditorCommand } from '../models/editor-command.interface';
import { SelectionService } from './selection.service';
import { CommandService } from './command.service';
import { DebounceService } from './debounce.service';

/**
 * Central service for managing editor state and coordinating operations
 * Provides observables for content changes and selection state
 */
@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private contentSubject = new BehaviorSubject<string>('');
  private selectionStateSubject = new BehaviorSubject<SelectionState | null>(null);
  private focusStateSubject = new BehaviorSubject<boolean>(false);
  private readonlyStateSubject = new BehaviorSubject<boolean>(false);
  private dirtyStateSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string>();

  private editorElement: HTMLElement | null = null;
  private initialContent = '';

  constructor(
    private selectionService: SelectionService,
    private commandService: CommandService,
    private debounceService: DebounceService
  ) {
    // Set up debounced content changes
    this.debounceService.debouncedContentChange$.subscribe(content => {
      this.contentSubject.next(content);
      this.updateDirtyState(content);
    });

    // Set up debounced selection changes
    this.debounceService.debouncedSelectionChange$.subscribe(selection => {
      this.selectionStateSubject.next(selection);
    });
  }

  /**
   * Observable for content changes
   */
  get content$(): Observable<string> {
    return this.contentSubject.asObservable();
  }

  /**
   * Observable for selection state changes
   */
  get selectionState$(): Observable<SelectionState | null> {
    return this.selectionStateSubject.asObservable();
  }

  /**
   * Observable for focus state changes
   */
  get focusState$(): Observable<boolean> {
    return this.focusStateSubject.asObservable();
  }

  /**
   * Observable for readonly state changes
   */
  get readonlyState$(): Observable<boolean> {
    return this.readonlyStateSubject.asObservable();
  }

  /**
   * Observable for dirty state changes (content modified)
   */
  get dirtyState$(): Observable<boolean> {
    return this.dirtyStateSubject.asObservable();
  }

  /**
   * Observable for error messages
   */
  get errors$(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  /**
   * Get current content value
   */
  getCurrentContent(): string {
    return this.contentSubject.value;
  }

  /**
   * Get current selection state
   */
  getCurrentSelectionState(): SelectionState | null {
    return this.selectionStateSubject.value;
  }

  /**
   * Get current focus state
   */
  isFocused(): boolean {
    return this.focusStateSubject.value;
  }

  /**
   * Get current readonly state
   */
  isReadonly(): boolean {
    return this.readonlyStateSubject.value;
  }

  /**
   * Get current dirty state
   */
  isDirty(): boolean {
    return this.dirtyStateSubject.value;
  }

  /**
   * Set the editor element reference
   */
  setEditorElement(element: HTMLElement): void {
    this.editorElement = element;
  }

  /**
   * Set editor content and update state
   */
  setContent(content: string, markClean: boolean = false): void {
    if (this.editorElement) {
      this.editorElement.innerHTML = content;
    }
    
    this.contentSubject.next(content);
    
    if (markClean) {
      this.initialContent = content;
      this.dirtyStateSubject.next(false);
    } else {
      this.updateDirtyState(content);
    }
  }

  /**
   * Update content from editor element (debounced)
   */
  updateContentFromElement(): void {
    if (this.editorElement) {
      const content = this.editorElement.innerHTML;
      this.debounceService.emitContentChange(content);
    }
  }

  /**
   * Update content immediately (for programmatic changes)
   */
  updateContentImmediately(): void {
    if (this.editorElement) {
      const content = this.editorElement.innerHTML;
      this.contentSubject.next(content);
      this.updateDirtyState(content);
    }
  }

  /**
   * Update selection state (debounced)
   */
  updateSelectionState(): void {
    try {
      const selectionState = this.selectionService.saveSelection();
      this.debounceService.emitSelectionChange(selectionState);
    } catch (error) {
      this.handleError('Failed to update selection state');
    }
  }

  /**
   * Update selection state immediately (for commands)
   */
  updateSelectionStateImmediately(): void {
    try {
      const selectionState = this.selectionService.saveSelection();
      this.selectionStateSubject.next(selectionState);
    } catch (error) {
      this.handleError('Failed to update selection state');
    }
  }

  /**
   * Execute a command and update state
   */
  executeCommand(command: EditorCommand): boolean {
    try {
      if (this.isReadonly()) {
        this.handleError('Cannot execute command in readonly mode');
        return false;
      }

      const result = this.commandService.executeCommand(command, command.value);
      
      if (result) {
        // Update content and selection immediately after command execution
        this.updateContentImmediately();
        this.updateSelectionStateImmediately();
      }
      
      return result;
    } catch (error) {
      this.handleError(`Failed to execute command: ${command.name}`);
      return false;
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    try {
      if (this.editorElement && !this.isReadonly()) {
        this.editorElement.focus();
        this.focusStateSubject.next(true);
      }
    } catch (error) {
      this.handleError('Failed to focus editor');
    }
  }

  /**
   * Blur the editor
   */
  blur(): void {
    try {
      if (this.editorElement) {
        this.editorElement.blur();
        this.focusStateSubject.next(false);
      }
    } catch (error) {
      this.handleError('Failed to blur editor');
    }
  }

  /**
   * Set readonly state
   */
  setReadonly(readonly: boolean): void {
    this.readonlyStateSubject.next(readonly);
    
    if (this.editorElement) {
      this.editorElement.contentEditable = readonly ? 'false' : 'true';
    }
  }

  /**
   * Handle focus event from editor element
   */
  onFocus(): void {
    this.focusStateSubject.next(true);
    this.updateSelectionState();
  }

  /**
   * Handle blur event from editor element
   */
  onBlur(): void {
    this.focusStateSubject.next(false);
  }

  /**
   * Handle input event from editor element
   */
  onInput(): void {
    this.updateContentFromElement();
    this.updateSelectionState();
  }

  /**
   * Handle selection change event
   */
  onSelectionChange(): void {
    // Only update if editor is focused to avoid unnecessary updates
    if (this.isFocused()) {
      this.updateSelectionState();
    }
  }

  /**
   * Reset editor to initial state
   */
  reset(): void {
    this.setContent(this.initialContent, true);
    this.focusStateSubject.next(false);
    this.selectionStateSubject.next(null);
  }

  /**
   * Clear all content
   */
  clear(): void {
    this.setContent('', false);
  }

  /**
   * Get editor statistics
   */
  getStats(): { characters: number; words: number; paragraphs: number } {
    const content = this.getCurrentContent();
    const textContent = this.stripHtml(content);
    
    return {
      characters: textContent.length,
      words: textContent.trim() ? textContent.trim().split(/\s+/).length : 0,
      paragraphs: content.split(/<\/p>|<br\s*\/?>/i).filter(p => p.trim()).length || 1
    };
  }

  /**
   * Check if editor has content
   */
  hasContent(): boolean {
    const content = this.getCurrentContent();
    const textContent = this.stripHtml(content);
    return textContent.trim().length > 0;
  }

  /**
   * Save current state for undo/redo
   */
  saveState(): void {
    // This would integrate with HistoryService if needed
    // For now, just update the current state
    this.updateContentFromElement();
    this.updateSelectionState();
  }

  /**
   * Destroy the service and clean up
   */
  destroy(): void {
    this.contentSubject.complete();
    this.selectionStateSubject.complete();
    this.focusStateSubject.complete();
    this.readonlyStateSubject.complete();
    this.dirtyStateSubject.complete();
    this.errorSubject.complete();
    this.debounceService.destroy();
    this.editorElement = null;
  }

  /**
   * Private method to update dirty state
   */
  private updateDirtyState(content: string): void {
    const isDirty = content !== this.initialContent;
    this.dirtyStateSubject.next(isDirty);
  }

  /**
   * Private method to handle errors
   */
  private handleError(message: string): void {
    console.error(`EditorService: ${message}`);
    this.errorSubject.next(message);
  }

  /**
   * Private method to strip HTML tags from content
   */
  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}