import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToolbarTool } from '../../models/toolbar.interface';
import { getToolbarIconMarkup } from './toolbar-icons';

/**
 * Individual toolbar button component with icon and label support
 */
@Component({
  selector: 'wysiwyg-toolbar-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="wysiwyg-toolbar-button"
      [class.wysiwyg-toolbar-button--active]="active"
      [class.wysiwyg-toolbar-button--disabled]="disabled || tool?.disabled"
      [class]="tool?.cssClass"
      [disabled]="disabled || tool?.disabled"
      [title]="getTitle()"
      [attr.aria-label]="getAriaLabel()"
      [attr.aria-pressed]="active"
      (click)="handleClick()"
      (keydown.enter)="handleClick()"
      (keydown.space)="handleClick($event)">
      
      <span 
        *ngIf="tool?.icon" 
        class="wysiwyg-toolbar-button__icon"
        [innerHTML]="getSafeIcon()"
        aria-hidden="true">
      </span>
      
      <span 
        *ngIf="tool?.label && (!tool?.icon || showLabel)" 
        class="wysiwyg-toolbar-button__label">
        {{ tool?.label }}
      </span>
      
      <!-- Visual indicator for dialog buttons -->
      <span 
        *ngIf="tool?.type === 'dialog'"
        class="wysiwyg-toolbar-button__dialog-indicator"
        aria-hidden="true">
        ...
      </span>
    </button>
  `,
  styleUrls: ['./toolbar-button.component.scss']
})
export class ToolbarButtonComponent {
  @Input() tool: ToolbarTool | null = null;
  @Input() active = false;
  @Input() disabled = false;
  @Input() showLabel = false;

  @Output() buttonClick = new EventEmitter<ToolbarTool>();

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Handle button click events
   */
  handleClick(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.disabled || this.tool?.disabled || !this.tool) {
      return;
    }

    this.buttonClick.emit(this.tool);
  }

  /**
   * Get the title attribute for the button
   */
  getTitle(): string {
    if (!this.tool) {
      return '';
    }

    // Special handling for toggleHtmlView - show what clicking will do
    if (this.tool.command === 'toggleHtmlView') {
      return this.active ? 'Switch to Visual Mode' : 'View HTML Code';
    }

    return this.tool.title || this.tool.label || this.getCommandDisplayName(this.tool.command);
  }

  /**
   * Get the aria-label for accessibility
   */
  getAriaLabel(): string {
    if (!this.tool) {
      return '';
    }

    const baseName = this.tool.label || this.getCommandDisplayName(this.tool.command);
    
    if (this.active) {
      return `${baseName} (active)`;
    }

    if (this.tool.type === 'dialog') {
      return `${baseName} (opens dialog)`;
    }

    return baseName;
  }

  /**
   * Get icon HTML for the tool
   */
  getIcon(): string {
    if (!this.tool?.icon) {
      return '';
    }

    if (this.tool.command === 'toggleHtmlView') {
      return this.active ? getToolbarIconMarkup('eye') : getToolbarIconMarkup('code');
    }

    return getToolbarIconMarkup(this.tool?.icon);
  }

  getSafeIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getIcon());
  }

  /**
   * Get display name for command
   */
  private getCommandDisplayName(command: string): string {
    const commandNames: Record<string, string> = {
      'bold': 'Bold',
      'italic': 'Italic',
      'underline': 'Underline',
      'strikethrough': 'Strikethrough',
      'fontSize': 'Font Size',
      'fontColor': 'Text Color',
      'backgroundColor': 'Background Color',
      'justifyLeft': 'Align Left',
      'justifyCenter': 'Align Center',
      'justifyRight': 'Align Right',
      'justifyFull': 'Justify',
      'insertUnorderedList': 'Bullet List',
      'insertOrderedList': 'Numbered List',
      'indent': 'Increase Indent',
      'outdent': 'Decrease Indent',
      'createLink': 'Insert Link',
      'unlink': 'Remove Link',
      'insertImage': 'Insert Image',
      'toggleHtmlView': 'Toggle HTML View',
      'undo': 'Undo',
      'redo': 'Redo',
      'removeFormat': 'Clear Formatting',
      'selectAll': 'Select All'
    };

    return commandNames[command] || command;
  }
}
