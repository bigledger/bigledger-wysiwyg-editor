import { Injectable } from '@angular/core';
import { EditorCommand } from '../models/editor-command.interface';
import { LinkData } from '../components/dialogs/link-dialog/link-dialog.component';
import { ImageData } from '../models/image.interface';
import { SelectionService } from './selection.service';
import { BrowserCompatibilityService } from './browser-compatibility.service';
import { ErrorHandlerService } from './error-handler.service';
import { HistoryService } from './history.service';

/**
 * Service for executing editor commands and managing formatting operations
 */
@Injectable({
  providedIn: 'root'
})
export class CommandService {
  constructor(
    private selectionService: SelectionService,
    private browserCompatibilityService: BrowserCompatibilityService,
    private errorHandlerService: ErrorHandlerService,
    private historyService: HistoryService
  ) {}

  /**
   * Execute a formatting command
   */
  executeCommand(command: EditorCommand, value?: string): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Restore selection before executing command
      // Note: We don't restore here as we want to work with current selection

      // Execute the command
      const success = document.execCommand(command.name, command.options?.showUI || false, value);

      if (!success) {
        return this.executeFallbackCommand(command, value);
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError(command.name, { command: command.name, value }, false);
      return false;
    }
  }

  /**
   * Execute fallback command for unsupported browsers
   */
  private executeFallbackCommand(command: EditorCommand, value?: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    
    try {
      switch (command.name) {
        case 'bold':
          return this.wrapSelectionWithTag('strong');
        case 'italic':
          return this.wrapSelectionWithTag('em');
        case 'underline':
          return this.wrapSelectionWithTag('u');
        case 'strikethrough':
          return this.wrapSelectionWithTag('s');
        case 'fontSize':
          return this.wrapSelectionWithStyle('font-size', value || '14px');
        case 'foreColor':
          return this.wrapSelectionWithStyle('color', value || '#000000');
        case 'backColor':
          return this.wrapSelectionWithStyle('background-color', value || '#ffffff');
        default:
          return false;
      }
    } catch (error) {
      this.errorHandlerService.handleCommandError('executeFallbackCommand', { command: command.name }, false);
      return false;
    }
  }

  /**
   * Wrap selection with HTML tag
   */
  private wrapSelectionWithTag(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    
    const wrapper = document.createElement(tagName);
    wrapper.appendChild(selectedContent);
    
    range.insertNode(wrapper);
    
    // Update selection to include the new wrapper
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
    
    return true;
  }

  /**
   * Wrap selection with CSS style
   */
  private wrapSelectionWithStyle(property: string, value: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    
    const wrapper = document.createElement('span');
    wrapper.style.setProperty(property, value);
    wrapper.appendChild(selectedContent);
    
    range.insertNode(wrapper);
    
    // Update selection to include the new wrapper
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
    
    return true;
  }

  /**
   * Create a link from current selection
   */
  createLink(url: string, text?: string, title?: string, target?: string): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      // If text is provided and different from selection, replace selection
      if (text && text !== selection.toString()) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Create link
      const success = document.execCommand('createLink', false, url);
      
      if (success) {
        // Add additional attributes if provided
        const link = this.getSelectedLink();
        if (link) {
          if (title) {
            link.setAttribute('title', title);
          }
          if (target) {
            link.setAttribute('target', target);
          }
        }
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('createLink', { url }, false);
      return false;
    }
  }

  /**
   * Update existing link
   */
  updateLink(url: string, text?: string, title?: string, target?: string): boolean {
    try {
      const link = this.getSelectedLink();
      if (!link) {
        return false;
      }

      // Update URL
      link.setAttribute('href', url);

      // Update text if provided
      if (text && text !== link.textContent) {
        link.textContent = text;
      }

      // Update title
      if (title) {
        link.setAttribute('title', title);
      } else {
        link.removeAttribute('title');
      }

      // Update target
      if (target) {
        link.setAttribute('target', target);
      } else {
        link.removeAttribute('target');
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('updateLink', { url }, false);
      return false;
    }
  }

  /**
   * Remove link from selection
   */
  removeLink(): boolean {
    try {
      return document.execCommand('unlink', false);
    } catch (error) {
      this.errorHandlerService.handleCommandError('removeLink', {}, false);
      return false;
    }
  }

  /**
   * Get link data from current selection
   */
  getLinkData(): LinkData | null {
    const link = this.getSelectedLink();
    if (!link) {
      return null;
    }

    return {
      url: link.getAttribute('href') || '',
      text: link.textContent || '',
      title: link.getAttribute('title') || undefined,
      target: (link.getAttribute('target') as '_blank' | '_self' | '_parent' | '_top') || undefined
    };
  }

  /**
   * Get selected link element
   */
  private getSelectedLink(): HTMLAnchorElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let element = selection.anchorNode;
    
    // Traverse up to find link element
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    while (element && (element as Element).tagName !== 'A') {
      element = element.parentNode;
    }

    return element as HTMLAnchorElement;
  }

  /**
   * Insert image at current selection
   */
  insertImage(imageData: ImageData): boolean {
    try {
      // Create image element
      const img = document.createElement('img');
      img.src = imageData.src;
      img.alt = imageData.alt || '';
      
      if (imageData.title) {
        img.title = imageData.title;
      }
      
      if (imageData.width) {
        img.width = imageData.width;
      }
      
      if (imageData.height) {
        img.height = imageData.height;
      }

      // Insert at current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        
        // Move cursor after image
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertImage', { src: imageData.src }, false);
      return false;
    }
  }

  /**
   * Update existing image
   */
  updateImage(imageData: ImageData): boolean {
    try {
      const img = this.getSelectedImage();
      if (!img) {
        return false;
      }

      img.src = imageData.src;
      img.alt = imageData.alt || '';
      
      if (imageData.title) {
        img.title = imageData.title;
      } else {
        img.removeAttribute('title');
      }
      
      if (imageData.width) {
        img.width = imageData.width;
      } else {
        img.removeAttribute('width');
      }
      
      if (imageData.height) {
        img.height = imageData.height;
      } else {
        img.removeAttribute('height');
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('updateImage', { src: imageData.src }, false);
      return false;
    }
  }

  /**
   * Remove image from selection
   */
  removeImage(): boolean {
    try {
      const img = this.getSelectedImage();
      if (!img) {
        return false;
      }

      img.remove();
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('removeImage', {}, false);
      return false;
    }
  }

  /**
   * Get image data from current selection
   */
  getImageData(): ImageData | null {
    const img = this.getSelectedImage();
    if (!img) {
      return null;
    }

    return {
      src: img.src,
      alt: img.alt,
      title: img.title || undefined,
      width: img.width || undefined,
      height: img.height || undefined
    };
  }

  /**
   * Get selected image element
   */
  private getSelectedImage(): HTMLImageElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let element = selection.anchorNode;
    
    // Check if selection is an image
    if (element && element.nodeType === Node.ELEMENT_NODE && (element as Element).tagName === 'IMG') {
      return element as HTMLImageElement;
    }

    // Check if parent is an image
    if (element && element.parentNode && (element.parentNode as Element).tagName === 'IMG') {
      return element.parentNode as HTMLImageElement;
    }

    return null;
  }

  /**
   * Check if command is supported
   */
  isCommandSupported(commandName: string): boolean {
    try {
      return document.queryCommandSupported(commandName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if command is enabled
   */
  isCommandEnabled(commandName: string): boolean {
    try {
      return document.queryCommandEnabled(commandName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get command state
   */
  getCommandState(commandName: string): boolean {
    try {
      return document.queryCommandState(commandName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get command value
   */
  getCommandValue(commandName: string): string {
    try {
      return document.queryCommandValue(commandName);
    } catch (error) {
      return '';
    }
  }

  /**
   * Create bullet list
   */
  createBulletList(): boolean {
    return this.executeCommand({ name: 'insertUnorderedList' });
  }

  /**
   * Create numbered list
   */
  createNumberedList(): boolean {
    return this.executeCommand({ name: 'insertOrderedList' });
  }

  /**
   * Indent list item
   */
  indentListItem(): boolean {
    return this.executeCommand({ name: 'indent' });
  }

  /**
   * Outdent list item
   */
  outdentListItem(): boolean {
    return this.executeCommand({ name: 'outdent' });
  }

  /**
   * Check if cursor is in a list
   */
  isInList(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let element = selection.anchorNode;
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    while (element) {
      if ((element as Element).tagName === 'UL' || (element as Element).tagName === 'OL') {
        return true;
      }
      element = element.parentNode;
    }

    return false;
  }

  /**
   * Check if cursor is in a bullet list
   */
  isInBulletList(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let element = selection.anchorNode;
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    while (element) {
      if ((element as Element).tagName === 'UL') {
        return true;
      }
      element = element.parentNode;
    }

    return false;
  }

  /**
   * Check if cursor is in a numbered list
   */
  isInNumberedList(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let element = selection.anchorNode;
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    while (element) {
      if ((element as Element).tagName === 'OL') {
        return true;
      }
      element = element.parentNode;
    }

    return false;
  }

  /**
   * Check if cursor is in an image
   */
  isInImage(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let element = selection.anchorNode;
    if (element && element.nodeType === Node.ELEMENT_NODE && (element as Element).tagName === 'IMG') {
      return true;
    }

    if (element && element.parentNode && (element.parentNode as Element).tagName === 'IMG') {
      return true;
    }

    return false;
  }

  /**
   * Select image element
   */
  selectImage(imgElement: HTMLImageElement): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      const range = document.createRange();
      range.selectNode(imgElement);
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('selectImage', { element: 'HTMLImageElement' }, false);
      return false;
    }
  }

  /**
   * Resize image by scale factor
   */
  resizeImage(scale: number): boolean {
    try {
      const img = this.getSelectedImage();
      if (!img) {
        return false;
      }

      const currentWidth = img.width || img.naturalWidth;
      const currentHeight = img.height || img.naturalHeight;

      img.width = Math.round(currentWidth * scale);
      img.height = Math.round(currentHeight * scale);

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('resizeImage', { scale }, false);
      return false;
    }
  }

  /**
   * Handle image drop event
   */
  handleImageDrop(event: DragEvent, container: HTMLElement): boolean {
    try {
      event.preventDefault();
      
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) {
        return false;
      }

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        return false;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          this.insertImage({
            src,
            alt: file.name,
            title: file.name
          });
        }
      };
      reader.readAsDataURL(file);

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('handleImageDrop', { fileType: 'image' }, false);
      return false;
    }
  }

  /**
   * Execute multiple commands in batch with grouping
   */
  executeCommands(commands: any[]): boolean {
    try {
      // Save current selection once for all commands
      this.selectionService.saveSelection();

      // Start a command group for batch operations
      const groupId = this.historyService.startGroup(`Batch operation: ${commands.length} commands`);

      let allSuccessful = true;
      
      for (const commandData of commands) {
        const command = commandData.command;
        const value = commandData.value;
        
        const success = document.execCommand(command.name, command.options?.showUI || false, value);
        
        if (!success) {
          // Try fallback for this command
          const fallbackSuccess = this.executeFallbackCommand(command, value);
          if (!fallbackSuccess) {
            allSuccessful = false;
          }
        }
      }

      // End the command group
      this.historyService.endGroup(groupId);

      return allSuccessful;
    } catch (error) {
      this.errorHandlerService.handleCommandError('executeCommands', { commandCount: commands.length }, false);
      return false;
    }
  }

  /**
   * Remove all formatting from selected text
   */
  removeFormatting(): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute removeFormat command
      const success = document.execCommand('removeFormat', false);

      if (!success) {
        // Fallback: wrap selection in plain text
        return this.removeFormattingFallback();
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('removeFormatting', {}, false);
      return false;
    }
  }

  /**
   * Fallback method to remove formatting
   */
  private removeFormattingFallback(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    try {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        range.deleteContents();
        range.insertNode(document.createTextNode(selectedText));
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Insert HTML at current cursor position
   */
  insertHTML(html: string): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute insertHTML command
      const success = document.execCommand('insertHTML', false, html);

      if (!success) {
        // Fallback: insert HTML manually
        return this.insertHTMLFallback(html);
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertHTML', { html }, false);
      return false;
    }
  }

  /**
   * Fallback method to insert HTML
   */
  private insertHTMLFallback(html: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    try {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create a temporary container to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Insert each child node
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      range.insertNode(fragment);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Insert plain text at current cursor position
   */
  insertText(text: string): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute insertText command
      const success = document.execCommand('insertText', false, text);

      if (!success) {
        // Fallback: insert text manually
        return this.insertTextFallback(text);
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertText', { text }, false);
      return false;
    }
  }

  /**
   * Fallback method to insert text
   */
  private insertTextFallback(text: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    try {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));

      // Move cursor to end of inserted text
      range.setStartAfter(range.endContainer);
      range.setEndAfter(range.endContainer);
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Align text to the left
   */
  alignLeft(): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute justifyLeft command
      const success = document.execCommand('justifyLeft', false);

      if (!success) {
        // Fallback: set text-align style
        return this.alignTextFallback('left');
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('alignLeft', {}, false);
      return false;
    }
  }

  /**
   * Align text to the center
   */
  alignCenter(): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute justifyCenter command
      const success = document.execCommand('justifyCenter', false);

      if (!success) {
        // Fallback: set text-align style
        return this.alignTextFallback('center');
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('alignCenter', {}, false);
      return false;
    }
  }

  /**
   * Align text to the right
   */
  alignRight(): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute justifyRight command
      const success = document.execCommand('justifyRight', false);

      if (!success) {
        // Fallback: set text-align style
        return this.alignTextFallback('right');
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('alignRight', {}, false);
      return false;
    }
  }

  /**
   * Justify text alignment
   */
  alignJustify(): boolean {
    try {
      // Save current selection
      this.selectionService.saveSelection();

      // Execute justifyFull command
      const success = document.execCommand('justifyFull', false);

      if (!success) {
        // Fallback: set text-align style
        return this.alignTextFallback('justify');
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError('alignJustify', {}, false);
      return false;
    }
  }

  /**
   * Fallback method for text alignment
   */
  private alignTextFallback(alignment: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    try {
      const range = selection.getRangeAt(0);
      const blockElement = this.findParentBlockElement(range.commonAncestorContainer);
      
      if (blockElement) {
        blockElement.style.textAlign = alignment;
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find the parent block element for alignment
   */
  private findParentBlockElement(node: Node): HTMLElement | null {
    let element = node;
    
    // If it's a text node, get its parent
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode!;
    }

    // Find the closest block element
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      const tagName = (element as Element).tagName.toLowerCase();
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tagName)) {
        return element as HTMLElement;
      }
      element = element.parentNode!;
    }

    return null;
  }

  /**
   * Get current text alignment
   */
  getCurrentAlignment(): string {
    try {
      // Check command states first
      if (this.getCommandState('justifyCenter')) {
        return 'center';
      }
      if (this.getCommandState('justifyRight')) {
        return 'right';
      }
      if (this.getCommandState('justifyFull')) {
        return 'justify';
      }
      if (this.getCommandState('justifyLeft')) {
        return 'left';
      }

      // Fallback: check computed style
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const blockElement = this.findParentBlockElement(range.commonAncestorContainer);
        
        if (blockElement) {
          const computedStyle = window.getComputedStyle(blockElement);
          const textAlign = computedStyle.textAlign;
          
          if (['center', 'right', 'justify'].includes(textAlign)) {
            return textAlign;
          }
        }
      }

      // Default to left
      return 'left';
    } catch (error) {
      return 'left';
    }
  }

  /**
   * Check if text is aligned left
   */
  isAlignedLeft(): boolean {
    return this.getCurrentAlignment() === 'left';
  }

  /**
   * Check if text is aligned center
   */
  isAlignedCenter(): boolean {
    return this.getCurrentAlignment() === 'center';
  }

  /**
   * Check if text is aligned right
   */
  isAlignedRight(): boolean {
    return this.getCurrentAlignment() === 'right';
  }

  /**
   * Check if text is justified
   */
  isAlignedJustify(): boolean {
    return this.getCurrentAlignment() === 'justify';
  }

  /**
   * Undo the last action
   */
  undo(): boolean {
    try {
      const previousState = this.historyService.undo();
      if (previousState) {
        // Restore content and selection
        this.restoreHistoryState(previousState);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandlerService.handleCommandError('undo', {}, false);
      return false;
    }
  }

  /**
   * Redo the next action
   */
  redo(): boolean {
    try {
      const nextState = this.historyService.redo();
      if (nextState) {
        // Restore content and selection
        this.restoreHistoryState(nextState);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandlerService.handleCommandError('redo', {}, false);
      return false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyService.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyService.canRedo();
  }

  /**
   * Save current state to history with optional grouping
   */
  saveState(element: HTMLElement, command: string, groupId?: string): void {
    try {
      const content = element.innerHTML;
      const selection = this.historyService.getSelectionPosition(element);
      
      const state = this.historyService.createState(content, command, selection);
      
      if (groupId) {
        this.historyService.addStateWithGrouping(state, groupId);
      } else {
        this.historyService.addState(state);
      }
    } catch (error) {
      this.errorHandlerService.handleCommandError('saveState', { command }, false);
    }
  }

  /**
   * Initialize history for an element
   */
  initializeHistory(element: HTMLElement): void {
    try {
      // Clear existing history
      this.historyService.clear();
      
      // Save initial state
      const content = element.innerHTML;
      const selection = this.historyService.getSelectionPosition(element);
      
      const initialState = this.historyService.createState(content, 'initialize', selection);
      this.historyService.addState(initialState);
    } catch (error) {
      this.errorHandlerService.handleCommandError('initializeHistory', {}, false);
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.historyService.clear();
  }

  /**
   * Get history service instance
   */
  getHistoryService(): HistoryService {
    return this.historyService;
  }

  /**
   * Restore a history state
   */
  private restoreHistoryState(state: any): void {
    // Find the editor element - this would typically be passed in or stored
    const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement;
    
    if (editorElement && state.content !== undefined) {
      // Restore content
      editorElement.innerHTML = state.content;
      
      // Restore selection if available
      if (state.selection) {
        this.historyService.restoreSelectionPosition(editorElement, state.selection);
      }
    }
  }

  /**
   * Start a command group for complex operations
   */
  startCommandGroup(description?: string): string {
    return this.historyService.startGroup(description);
  }

  /**
   * End a command group
   */
  endCommandGroup(groupId: string): void {
    this.historyService.endGroup(groupId);
  }

  /**
   * Undo entire group of commands
   */
  undoGroup(): boolean {
    try {
      const groupStates = this.historyService.undoGroup();
      if (groupStates && groupStates.length > 0) {
        // Restore the state before the group
        this.restoreHistoryState(groupStates[groupStates.length - 1]);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandlerService.handleCommandError('undoGroup', {}, false);
      return false;
    }
  }

  /**
   * Redo entire group of commands
   */
  redoGroup(): boolean {
    try {
      const groupStates = this.historyService.redoGroup();
      if (groupStates && groupStates.length > 0) {
        // Restore the final state of the group
        this.restoreHistoryState(groupStates[groupStates.length - 1]);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandlerService.handleCommandError('redoGroup', {}, false);
      return false;
    }
  }

  /**
   * Create a new history branch
   */
  createHistoryBranch(name: string): string {
    return this.historyService.createBranch(name);
  }

  /**
   * Switch to a different history branch
   */
  switchHistoryBranch(branchId: string): boolean {
    const success = this.historyService.switchBranch(branchId);
    if (success) {
      // Restore the current state of the new branch
      const currentState = this.historyService.getCurrentState();
      if (currentState) {
        this.restoreHistoryState(currentState);
      }
    }
    return success;
  }

  /**
   * Get all available history branches
   */
  getHistoryBranches(): any[] {
    return this.historyService.getBranches();
  }

  /**
   * Compress history to optimize memory usage
   */
  compressHistory(): void {
    this.historyService.compressHistory();
  }

  /**
   * Get memory usage statistics
   */
  getHistoryMemoryStats(): any {
    return this.historyService.getMemoryStats();
  }

  /**
   * Execute a complex operation with automatic grouping
   */
  executeComplexOperation(operations: Array<{ command: EditorCommand; value?: string }>, description?: string): boolean {
    const groupId = this.startCommandGroup(description || 'Complex operation');
    
    try {
      let allSuccessful = true;
      
      for (const operation of operations) {
        const success = this.executeCommand(operation.command, operation.value);
        if (!success) {
          allSuccessful = false;
        }
      }
      
      return allSuccessful;
    } finally {
      this.endCommandGroup(groupId);
    }
  }

  /**
   * Execute command with enhanced history tracking
   */
  executeCommandWithHistory(command: EditorCommand, value?: string, element?: HTMLElement): boolean {
    // Save state before command execution
    if (element) {
      this.saveState(element, command.name);
    }

    // Execute the command
    const success = this.executeCommand(command, value);

    // Save state after command execution if successful
    if (success && element) {
      this.saveState(element, command.name);
    }

    return success;
  }
}