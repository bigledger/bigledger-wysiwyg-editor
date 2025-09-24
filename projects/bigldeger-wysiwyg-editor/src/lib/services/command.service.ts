import { Injectable } from '@angular/core';
import { EditorCommand } from '../models/editor-command.interface';
import { LinkData } from '../components/dialogs/link-dialog/link-dialog.component';
import { ImageData } from '../models/image.interface';
import { SelectionService } from './selection.service';
import { BrowserCompatibilityService } from './browser-compatibility.service';
import { ErrorHandlerService } from './error-handler.service';

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
    private errorHandlerService: ErrorHandlerService
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
}