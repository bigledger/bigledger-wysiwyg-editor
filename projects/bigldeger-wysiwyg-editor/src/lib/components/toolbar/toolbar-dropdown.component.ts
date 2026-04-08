import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToolbarTool, ToolOption } from '../../models/toolbar.interface';
import { getToolbarIconMarkup } from './toolbar-icons';

/**
 * Dropdown component for font size, color, and other options
 */
@Component({
  selector: 'wysiwyg-toolbar-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="wysiwyg-toolbar-dropdown"
      [class.wysiwyg-toolbar-dropdown--disabled]="disabled || tool?.disabled"
      [class.wysiwyg-toolbar-dropdown--open]="isOpen"
      [class]="tool?.cssClass"
      [attr.data-command]="tool?.command">
      
      <button
        #triggerButton
        type="button"
        class="wysiwyg-toolbar-dropdown__trigger"
        [class.wysiwyg-toolbar-dropdown__trigger--active]="isOpen"
        [disabled]="disabled || tool?.disabled"
        [title]="getTitle()"
        [attr.aria-label]="getAriaLabel()"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="true"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (keydown.space)="toggle($event)"
        (keydown.arrowdown)="openAndFocusFirst($event)"
        (keydown.arrowup)="openAndFocusLast($event)">
        
        <span 
          *ngIf="tool?.icon" 
          class="wysiwyg-toolbar-dropdown__icon"
          [innerHTML]="getSafeIcon()"
          aria-hidden="true">
        </span>
        
        <span 
          *ngIf="tool?.label" 
          class="wysiwyg-toolbar-dropdown__label">
          {{ getCurrentValueLabel() || tool?.label }}
        </span>
        
        <span 
          class="wysiwyg-toolbar-dropdown__arrow"
          [class.wysiwyg-toolbar-dropdown__arrow--up]="isOpen"
          aria-hidden="true">
          ▼
        </span>
      </button>

      <div
        *ngIf="isOpen"
        #dropdownMenu
        class="wysiwyg-toolbar-dropdown__menu"
        role="menu"
        [attr.aria-labelledby]="getTriggerId()"
        (click)="$event.stopPropagation()"
        (keydown.escape)="close()"
        (keydown.arrowdown)="focusNext($event)"
        (keydown.arrowup)="focusPrevious($event)"
        (keydown.home)="focusFirst($event)"
        (keydown.end)="focusLast($event)">
        
        <button
          *ngFor="let option of tool?.options; trackBy: trackByOption; let i = index"
          #optionButton
          type="button"
          class="wysiwyg-toolbar-dropdown__option"
          [class.wysiwyg-toolbar-dropdown__option--disabled]="option.disabled"
          [class.wysiwyg-toolbar-dropdown__option--selected]="isOptionSelected(option)"
          [disabled]="option.disabled"
          role="menuitem"
          [attr.aria-selected]="isOptionSelected(option)"
          [attr.data-font-family]="tool?.command === 'fontFamily' ? option.value : null"
          (click)="selectOption(option)"
          (keydown.enter)="selectOption(option)"
          (keydown.space)="selectOption(option, $event)">
          
          <span 
            *ngIf="option.icon" 
            class="wysiwyg-toolbar-dropdown__option-icon"
            [innerHTML]="getSafeOptionIcon(option)"
            aria-hidden="true">
          </span>
          
          <span class="wysiwyg-toolbar-dropdown__option-label">
            {{ option.label }}
          </span>
          
          <span 
            *ngIf="isOptionSelected(option)"
            class="wysiwyg-toolbar-dropdown__option-check"
            aria-hidden="true">
            ✓
          </span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./toolbar-dropdown.component.scss']
})
export class ToolbarDropdownComponent implements OnInit, OnDestroy {
  @Input() tool: ToolbarTool | null = null;
  @Input() disabled = false;
  @Input() value: any = null;

  @Output() optionSelect = new EventEmitter<{ tool: ToolbarTool; option: ToolOption }>();

  @ViewChild('triggerButton', { static: false }) triggerButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('dropdownMenu', { static: false }) dropdownMenu!: ElementRef<HTMLDivElement>;

  isOpen = false;
  private clickOutsideListener?: (event: Event) => void;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.setupClickOutsideListener();
  }

  ngOnDestroy(): void {
    this.removeClickOutsideListener();
  }

  /**
   * Track function for dropdown options
   */
  trackByOption(index: number, option: ToolOption): string {
    return option.value;
  }

  /**
   * Toggle dropdown open/closed state
   */
  toggle(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.disabled || this.tool?.disabled) {
      return;
    }

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open dropdown
   */
  open(): void {
    if (this.disabled || this.tool?.disabled) {
      return;
    }

    this.isOpen = true;
    
    // Focus first option after menu is rendered
    setTimeout(() => {
      this.focusFirst();
    });
  }

  /**
   * Close dropdown
   */
  close(): void {
    this.isOpen = false;
    
    // Return focus to trigger button
    if (this.triggerButton) {
      this.triggerButton.nativeElement.focus();
    }
  }

  /**
   * Open dropdown and focus first option
   */
  openAndFocusFirst(event: Event): void {
    event.preventDefault();
    this.open();
  }

  /**
   * Open dropdown and focus last option
   */
  openAndFocusLast(event: Event): void {
    event.preventDefault();
    this.open();
    setTimeout(() => {
      this.focusLast();
    });
  }

  /**
   * Select an option
   */
  selectOption(option: ToolOption, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (option.disabled || this.disabled || this.tool?.disabled || !this.tool) {
      return;
    }

    this.optionSelect.emit({ tool: this.tool, option });
    this.close();
  }

  /**
   * Check if an option is currently selected
   */
  isOptionSelected(option: ToolOption): boolean {
    return this.value === option.value;
  }

  /**
   * Get the label for the currently selected value
   */
  getCurrentValueLabel(): string {
    if (!this.tool?.options || this.value === null || this.value === undefined) {
      return '';
    }

    const selectedOption = this.tool.options.find(option => option.value === this.value);
    return selectedOption?.label || '';
  }

  /**
   * Get the title attribute for the trigger button
   */
  getTitle(): string {
    if (!this.tool) {
      return '';
    }

    const currentLabel = this.getCurrentValueLabel();
    const baseTitle = this.tool.label || this.getCommandDisplayName(this.tool.command);
    
    return currentLabel ? `${baseTitle}: ${currentLabel}` : baseTitle;
  }

  /**
   * Get the aria-label for accessibility
   */
  getAriaLabel(): string {
    if (!this.tool) {
      return '';
    }

    const baseLabel = this.tool.label || this.getCommandDisplayName(this.tool.command);
    const currentLabel = this.getCurrentValueLabel();
    
    if (currentLabel) {
      return `${baseLabel}, current selection: ${currentLabel}`;
    }
    
    return `${baseLabel} dropdown`;
  }

  /**
   * Get unique ID for the trigger button
   */
  getTriggerId(): string {
    return `toolbar-dropdown-${this.tool?.command || 'unknown'}`;
  }

  /**
   * Get icon HTML for the tool
   */
  getIcon(): string {
    return getToolbarIconMarkup(this.tool?.icon);
  }

  getSafeIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getIcon());
  }

  /**
   * Get icon HTML for an option
   */
  getOptionIcon(option: ToolOption): string {
    // Handle color swatches
    if (option.icon && (option.icon.startsWith('#') || option.icon.startsWith('rgb'))) {
      return `<span class="color-swatch" style="background-color: ${option.icon}"></span>`;
    }

    return getToolbarIconMarkup(option.icon);
  }

  getSafeOptionIcon(option: ToolOption): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getOptionIcon(option));
  }

  /**
   * Focus management methods
   */
  focusFirst(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const firstOption = this.getOptionButtons()[0];
    if (firstOption) {
      firstOption.focus();
    }
  }

  focusLast(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const options = this.getOptionButtons();
    const lastOption = options[options.length - 1];
    if (lastOption) {
      lastOption.focus();
    }
  }

  focusNext(event: Event): void {
    event.preventDefault();
    
    const options = this.getOptionButtons();
    const currentIndex = options.findIndex(option => option === document.activeElement);
    
    if (currentIndex < options.length - 1) {
      options[currentIndex + 1].focus();
    } else {
      options[0].focus(); // Wrap to first
    }
  }

  focusPrevious(event: Event): void {
    event.preventDefault();
    
    const options = this.getOptionButtons();
    const currentIndex = options.findIndex(option => option === document.activeElement);
    
    if (currentIndex > 0) {
      options[currentIndex - 1].focus();
    } else {
      options[options.length - 1].focus(); // Wrap to last
    }
  }

  private getOptionButtons(): HTMLButtonElement[] {
    if (!this.dropdownMenu) {
      return [];
    }
    
    return Array.from(
      this.dropdownMenu.nativeElement.querySelectorAll('.wysiwyg-toolbar-dropdown__option:not([disabled])')
    ) as HTMLButtonElement[];
  }

  /**
   * Setup click outside listener
   */
  private setupClickOutsideListener(): void {
    this.clickOutsideListener = (event: Event) => {
      if (this.isOpen && !this.isClickInside(event)) {
        this.close();
      }
    };
    
    document.addEventListener('click', this.clickOutsideListener);
  }

  /**
   * Remove click outside listener
   */
  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener);
      this.clickOutsideListener = undefined;
    }
  }

  /**
   * Check if click is inside the dropdown
   */
  private isClickInside(event: Event): boolean {
    const target = event.target as Element;
    const dropdown = this.triggerButton?.nativeElement.closest('.wysiwyg-toolbar-dropdown');
    
    return dropdown ? dropdown.contains(target) : false;
  }

  /**
   * Get display name for command
   */
  private getCommandDisplayName(command: string): string {
    const commandNames: Record<string, string> = {
      'fontSize': 'Font Size',
      'fontColor': 'Text Color',
      'backgroundColor': 'Background Color',
      'fontFamily': 'Font Family',
      'lineHeight': 'Line Height'
    };

    return commandNames[command] || command;
  }
}
