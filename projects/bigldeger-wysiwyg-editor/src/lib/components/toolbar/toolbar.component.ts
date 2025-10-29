import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { ToolbarConfig, ToolbarTool } from '../../models/toolbar.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionState } from '../../models/selection-state.interface';
import { AccessibilityService } from '../../services/accessibility.service';

/**
 * Toolbar component that renders formatting tools based on configuration
 */
@Component({
  selector: 'wysiwyg-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #toolbarContainer
      class="wysiwyg-toolbar"
      [class.wysiwyg-toolbar--sticky]="config?.sticky"
      [class.wysiwyg-toolbar--dark]="config?.theme === 'dark'"
      [class.wysiwyg-toolbar--light]="config?.theme === 'light'"
      [class.wysiwyg-toolbar--disabled]="disabled"
      [id]="toolbarId"
      role="toolbar"
      [attr.aria-label]="'Formatting toolbar'"
      [attr.aria-orientation]="'horizontal'">
      
      <div class="wysiwyg-toolbar__content">
        <ng-container *ngFor="let tool of config?.tools; trackBy: trackByTool; let i = index">
          
          <!-- Button Tool -->
          <button
            *ngIf="tool.type === 'button'"
            type="button"
            class="wysiwyg-toolbar__button"
            [class.wysiwyg-toolbar__button--active]="isToolActive(tool)"
            [class.wysiwyg-toolbar__button--disabled]="tool.disabled || disabled"
            [class]="tool.cssClass"
            [disabled]="tool.disabled || disabled"
            [title]="getToolTitle(tool)"
            [attr.aria-label]="getToolAriaLabel(tool)"
            [attr.aria-pressed]="isToolActive(tool)"
            [attr.aria-describedby]="getToolDescriptionId(tool)"
            [attr.tabindex]="i === 0 ? '0' : '-1'"
            (click)="executeCommand(tool)"
            (keydown)="handleToolKeydown($event, tool)"
            (focus)="onToolFocus($event)">
            
            <span 
              *ngIf="tool.icon" 
              class="wysiwyg-toolbar__icon"
              [innerHTML]="getToolIcon(tool)"
              aria-hidden="true">
            </span>
            
            <span 
              *ngIf="tool.label && !tool.icon" 
              class="wysiwyg-toolbar__label">
              {{ tool.label }}
            </span>
          </button>

          <!-- Dropdown Tool -->
          <div
            *ngIf="tool.type === 'dropdown'"
            class="wysiwyg-toolbar__dropdown"
            [class.wysiwyg-toolbar__dropdown--disabled]="tool.disabled || disabled">
            
            <button
              type="button"
              class="wysiwyg-toolbar__dropdown-trigger"
              [class.wysiwyg-toolbar__dropdown-trigger--active]="isDropdownOpen(tool)"
              [disabled]="tool.disabled || disabled"
              [title]="getToolTitle(tool)"
              [attr.aria-label]="getDropdownAriaLabel(tool)"
              [attr.aria-expanded]="isDropdownOpen(tool)"
              [attr.aria-haspopup]="'menu'"
              [attr.aria-controls]="getDropdownMenuId(tool)"
              [id]="getDropdownTriggerId(tool)"
              [attr.tabindex]="i === 0 ? '0' : '-1'"
              (click)="toggleDropdown(tool)"
              (keydown)="handleDropdownKeydown($event, tool)"
              (focus)="onToolFocus($event)">
              
              <span 
                *ngIf="tool.icon" 
                class="wysiwyg-toolbar__icon"
                [innerHTML]="getToolIcon(tool)"
                aria-hidden="true">
              </span>
              
              <span 
                *ngIf="tool.label" 
                class="wysiwyg-toolbar__label">
                {{ tool.label }}
              </span>
              
              <span class="wysiwyg-toolbar__dropdown-arrow" aria-hidden="true">▼</span>
            </button>

            <div
              *ngIf="isDropdownOpen(tool)"
              class="wysiwyg-toolbar__dropdown-menu"
              [id]="getDropdownMenuId(tool)"
              role="menu"
              [attr.aria-labelledby]="getDropdownTriggerId(tool)"
              (click)="$event.stopPropagation()"
              (keydown)="handleDropdownMenuKeydown($event, tool)">
              
              <button
                *ngFor="let option of tool.options; trackBy: trackByOption; let optionIndex = index"
                type="button"
                class="wysiwyg-toolbar__dropdown-option"
                [class.wysiwyg-toolbar__dropdown-option--disabled]="option.disabled"
                [class.wysiwyg-toolbar__dropdown-option--selected]="isOptionSelected(tool, option)"
                [disabled]="option.disabled"
                role="menuitem"
                [attr.aria-selected]="isOptionSelected(tool, option)"
                [attr.tabindex]="optionIndex === 0 ? '0' : '-1'"
                (click)="executeDropdownCommand(tool, option)"
                (focus)="onDropdownOptionFocus($event)">
                
                <span 
                  *ngIf="option.icon" 
                  class="wysiwyg-toolbar__icon"
                  [innerHTML]="getOptionIcon(option)"
                  aria-hidden="true">
                </span>
                
                <span class="wysiwyg-toolbar__label">{{ option.label }}</span>
                
                <span 
                  *ngIf="isOptionSelected(tool, option)"
                  class="wysiwyg-toolbar__selected-indicator"
                  aria-hidden="true">✓</span>
              </button>
            </div>
          </div>

          <!-- Dialog Tool -->
          <button
            *ngIf="tool.type === 'dialog'"
            type="button"
            class="wysiwyg-toolbar__button wysiwyg-toolbar__button--dialog"
            [class.wysiwyg-toolbar__button--active]="isToolActive(tool)"
            [class.wysiwyg-toolbar__button--disabled]="tool.disabled || disabled"
            [class]="tool.cssClass"
            [disabled]="tool.disabled || disabled"
            [title]="getToolTitle(tool)"
            [attr.aria-label]="getDialogAriaLabel(tool)"
            [attr.aria-haspopup]="'dialog'"
            [attr.tabindex]="i === 0 ? '0' : '-1'"
            (click)="executeCommand(tool)"
            (keydown)="handleToolKeydown($event, tool)"
            (focus)="onToolFocus($event)">
            
            <span 
              *ngIf="tool.icon" 
              class="wysiwyg-toolbar__icon"
              [innerHTML]="getToolIcon(tool)"
              aria-hidden="true">
            </span>
            
            <span 
              *ngIf="tool.label && !tool.icon" 
              class="wysiwyg-toolbar__label">
              {{ tool.label }}
            </span>
            
            <span 
              class="wysiwyg-toolbar__dialog-indicator"
              aria-hidden="true">...</span>
          </button>

        </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() config: ToolbarConfig | null = null;
  @Input() disabled = false;
  @Input() selectionState: SelectionState | null = null;

  @Output() command = new EventEmitter<EditorCommand>();

  @ViewChild('toolbarContainer', { static: false }) toolbarContainer!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();
  private openDropdowns = new Set<string>();
  toolbarId: string;
  private boundDocumentClickHandler!: (event: MouseEvent) => void;
  private boundGlobalKeydownHandler!: (event: KeyboardEvent) => void;

  constructor(private accessibilityService: AccessibilityService) {
    this.toolbarId = this.accessibilityService.generateId('wysiwyg-toolbar');
  }

  ngOnInit(): void {
    // Close dropdowns when clicking outside
    this.boundDocumentClickHandler = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.boundDocumentClickHandler);
    
    // Set up keyboard navigation
    this.boundGlobalKeydownHandler = this.handleGlobalKeydown.bind(this);
    document.addEventListener('keydown', this.boundGlobalKeydownHandler);
  }

  ngAfterViewInit(): void {
    // Set up roving tabindex for toolbar buttons
    if (this.toolbarContainer) {
      this.setupToolbarNavigation();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.boundDocumentClickHandler);
    document.removeEventListener('keydown', this.boundGlobalKeydownHandler);
  }

  /**
   * Track function for toolbar tools
   */
  trackByTool(index: number, tool: ToolbarTool): string {
    return tool.command + tool.type;
  }

  /**
   * Track function for dropdown options
   */
  trackByOption(index: number, option: any): string {
    return option.value;
  }

  /**
   * Check if a tool is currently active
   */
  isToolActive(tool: ToolbarTool): boolean {
    if (!this.selectionState?.formats) {
      return false;
    }

    const formats = this.selectionState.formats;
    
    switch (tool.command) {
      case 'bold':
        return formats.bold || false;
      case 'italic':
        return formats.italic || false;
      case 'underline':
        return formats.underline || false;
      case 'strikethrough':
        return formats.strikethrough || false;
      case 'justifyLeft':
        return formats.alignment === 'left';
      case 'justifyCenter':
        return formats.alignment === 'center';
      case 'justifyRight':
        return formats.alignment === 'right';
      case 'justifyFull':
        return formats.alignment === 'justify';
      case 'toggleHtmlView':
        return (this.selectionState as any).htmlMode || false;
      default:
        return false;
    }
  }

  /**
   * Check if a dropdown is currently open
   */
  isDropdownOpen(tool: ToolbarTool): boolean {
    return this.openDropdowns.has(tool.command);
  }

  /**
   * Toggle dropdown open/closed state
   */
  toggleDropdown(tool: ToolbarTool): void {
    if (this.openDropdowns.has(tool.command)) {
      this.openDropdowns.delete(tool.command);
    } else {
      // Close other dropdowns first
      this.openDropdowns.clear();
      this.openDropdowns.add(tool.command);
      
      // Position the dropdown menu after it opens
      setTimeout(() => this.positionDropdownMenu(tool), 0);
    }
  }

  /**
   * Close all open dropdowns
   */
  private closeAllDropdowns(): void {
    this.openDropdowns.clear();
  }

  /**
   * Position dropdown menu relative to its trigger button
   */
  private positionDropdownMenu(tool: ToolbarTool): void {
    const trigger = document.getElementById(this.getDropdownTriggerId(tool));
    const menu = document.getElementById(this.getDropdownMenuId(tool));
    
    if (!trigger || !menu) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const menuWidth = menu.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate vertical position - prefer below, but go above if not enough space
    let top = triggerRect.bottom + 2;
    if (top + menuHeight > viewportHeight - 10) {
      top = triggerRect.top - menuHeight - 2;
    }
    
    // Calculate horizontal position - prefer left-aligned, but adjust if near edge
    let left = triggerRect.left;
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }
    
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }

  /**
   * Handle clicks on document to close dropdowns only when clicking outside toolbar
   */
  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const container = this.toolbarContainer?.nativeElement;
    if (!target || !container) {
      this.closeAllDropdowns();
      return;
    }
    const isInside = container.contains(target);
    if (!isInside) {
      this.closeAllDropdowns();
    }
  }

  /**
   * Execute a toolbar command
   */
  executeCommand(tool: ToolbarTool): void {
    if (tool.disabled || this.disabled) {
      return;
    }

    const command: EditorCommand = {
      name: tool.command,
      options: {
        showUI: false,
        preventDefault: true
      }
    };

    this.command.emit(command);
  }

  /**
   * Execute a dropdown command with selected option
   */
  executeDropdownCommand(tool: ToolbarTool, option: any): void {
    if (tool.disabled || this.disabled || option.disabled) {
      return;
    }

    // Map fontFamily command to fontName for document.execCommand compatibility
    let commandName = tool.command;
    if (tool.command === 'fontFamily') {
      commandName = 'fontName';
    }

    const command: EditorCommand = {
      name: commandName,
      value: option.value,
      options: {
        showUI: false,
        preventDefault: true
      }
    };

    this.command.emit(command);
    this.openDropdowns.delete(tool.command);
  }

  /**
   * Get icon HTML for a tool
   */
  getToolIcon(tool: ToolbarTool): string {
    if (!tool.icon) {
      return '';
    }

    // Special handling for toggleHtmlView - show different icon based on active state
    if (tool.command === 'toggleHtmlView') {
      const isActive = this.isToolActive(tool);
      // HTML mode (active): show eye icon to indicate "view visual mode"
      // Visual mode (inactive): show code icon to indicate "view HTML code"
      return isActive 
        ? '<span style="font-size: 18px;">👁</span>' 
        : '<span style="font-size: 16px; font-weight: bold;">&lt;/&gt;</span>';
    }

    // Return basic icon mapping - can be extended with icon library
    const iconMap: Record<string, string> = {
      'bold': '<strong>B</strong>',
      'italic': '<em>I</em>',
      'underline': '<u>U</u>',
      'strikethrough': '<s>S</s>',
      'fontSize': 'A',
      'fontFamily': 'Aa',
      'fontColor': '🎨',
      'backgroundColor': '🖍️',
      'justifyLeft': '⬅️',
      'justifyCenter': '↔️',
      'justifyRight': '➡️',
      'justifyFull': '↕️',
      'insertUnorderedList': '•',
      'insertOrderedList': '1.',
      'createLink': '🔗',
      'insertImage': '🖼️',
      'insertTable': '⊞',
      'code': '<span style="font-size: 16px; font-weight: bold;">&lt;/&gt;</span>',
      'undo': '↶',
      'redo': '↷'
    };

    return iconMap[tool.icon] || tool.icon;
  }

  /**
   * Get icon HTML for a dropdown option
   */
  getOptionIcon(option: any): string {
    if (!option.icon) {
      return '';
    }
    return option.icon;
  }

  /**
   * Get tool title with keyboard shortcut
   */
  getToolTitle(tool: ToolbarTool): string {
    // Special handling for toggleHtmlView - show what clicking will do
    if (tool.command === 'toggleHtmlView') {
      const isActive = this.isToolActive(tool);
      return isActive ? 'Switch to Visual Mode' : 'View HTML Code';
    }

    const shortcut = this.accessibilityService.getShortcutKeys(tool.command);
    const title = tool.title || tool.label || tool.command;
    return shortcut ? `${title} (${shortcut})` : title;
  }

  /**
   * Get ARIA label for tool
   */
  getToolAriaLabel(tool: ToolbarTool): string {
    const label = tool.ariaLabel || tool.label || tool.command;
    const shortcut = this.accessibilityService.getShortcutKeys(tool.command);
    return shortcut ? `${label}, keyboard shortcut ${shortcut}` : label;
  }

  /**
   * Get ARIA label for dropdown
   */
  getDropdownAriaLabel(tool: ToolbarTool): string {
    const label = tool.ariaLabel || tool.label || tool.command;
    return `${label} menu`;
  }

  /**
   * Get ARIA label for dialog tool
   */
  getDialogAriaLabel(tool: ToolbarTool): string {
    const label = tool.ariaLabel || tool.label || tool.command;
    return `Open ${label} dialog`;
  }

  /**
   * Get description ID for tool
   */
  getToolDescriptionId(tool: ToolbarTool): string {
    return `${this.toolbarId}-${tool.command}-desc`;
  }

  /**
   * Get dropdown menu ID
   */
  getDropdownMenuId(tool: ToolbarTool): string {
    return `${this.toolbarId}-${tool.command}-menu`;
  }

  /**
   * Get dropdown trigger ID
   */
  getDropdownTriggerId(tool: ToolbarTool): string {
    return `${this.toolbarId}-${tool.command}-trigger`;
  }

  /**
   * Check if dropdown option is selected
   */
  isOptionSelected(tool: ToolbarTool, option: any): boolean {
    if (!this.selectionState?.formats) {
      return false;
    }

    const formats = this.selectionState.formats;
    
    switch (tool.command) {
      case 'fontSize':
        return formats.fontSize === option.value;
      case 'fontFamily':
        return formats.fontFamily === option.value;
      case 'fontColor':
        return formats.fontColor === option.value;
      case 'backgroundColor':
        return formats.backgroundColor === option.value;
      default:
        return false;
    }
  }

  /**
   * Handle keyboard navigation for tools
   */
  handleToolKeydown(event: KeyboardEvent, tool: ToolbarTool): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.executeCommand(tool);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextTool(event.target as HTMLElement);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousTool(event.target as HTMLElement);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstTool();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastTool();
        break;
    }
  }

  /**
   * Handle keyboard navigation for dropdown triggers
   */
  handleDropdownKeydown(event: KeyboardEvent, tool: ToolbarTool): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        this.toggleDropdown(tool);
        if (this.isDropdownOpen(tool)) {
          // Focus first option
          setTimeout(() => {
            const menu = document.getElementById(this.getDropdownMenuId(tool));
            const firstOption = menu?.querySelector('button[role="menuitem"]') as HTMLElement;
            if (firstOption) {
              firstOption.focus();
            }
          });
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.focusNextTool(event.target as HTMLElement);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPreviousTool(event.target as HTMLElement);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstTool();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastTool();
        break;
      case 'Escape':
        event.preventDefault();
        this.openDropdowns.delete(tool.command);
        break;
    }
  }

  /**
   * Handle keyboard navigation within dropdown menus
   */
  handleDropdownMenuKeydown(event: KeyboardEvent, tool: ToolbarTool): void {
    const menu = event.currentTarget as HTMLElement;
    const options = menu.querySelectorAll('button[role="menuitem"]:not([disabled])') as NodeListOf<HTMLElement>;
    const currentOption = event.target as HTMLElement;
    const currentIndex = Array.from(options).indexOf(currentOption);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % options.length;
        options[nextIndex].focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        options[prevIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        options[0].focus();
        break;
      case 'End':
        event.preventDefault();
        options[options.length - 1].focus();
        break;
      case 'Escape':
        event.preventDefault();
        this.openDropdowns.delete(tool.command);
        // Return focus to trigger
        const trigger = document.getElementById(this.getDropdownTriggerId(tool));
        if (trigger) {
          trigger.focus();
        }
        break;
      case 'Tab':
        // Allow tab to close dropdown and move to next tool
        this.openDropdowns.delete(tool.command);
        break;
    }
  }

  /**
   * Handle tool focus events
   */
  onToolFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    this.accessibilityService.setFocusedElement(target);
    
    // Update tabindex for roving tabindex
    this.updateToolTabIndex(target);
  }

  /**
   * Handle dropdown option focus events
   */
  onDropdownOptionFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    this.accessibilityService.setFocusedElement(target);
  }

  /**
   * Focus next tool in toolbar
   */
  private focusNextTool(currentElement: HTMLElement): void {
    const tools = this.getToolElements();
    const currentIndex = tools.indexOf(currentElement);
    if (currentIndex >= 0 && currentIndex < tools.length - 1) {
      tools[currentIndex + 1].focus();
    } else if (tools.length > 0) {
      tools[0].focus(); // Wrap to first
    }
  }

  /**
   * Focus previous tool in toolbar
   */
  private focusPreviousTool(currentElement: HTMLElement): void {
    const tools = this.getToolElements();
    const currentIndex = tools.indexOf(currentElement);
    if (currentIndex > 0) {
      tools[currentIndex - 1].focus();
    } else if (tools.length > 0) {
      tools[tools.length - 1].focus(); // Wrap to last
    }
  }

  /**
   * Focus first tool in toolbar
   */
  private focusFirstTool(): void {
    const tools = this.getToolElements();
    if (tools.length > 0) {
      tools[0].focus();
    }
  }

  /**
   * Focus last tool in toolbar
   */
  private focusLastTool(): void {
    const tools = this.getToolElements();
    if (tools.length > 0) {
      tools[tools.length - 1].focus();
    }
  }

  /**
   * Get all focusable tool elements
   */
  private getToolElements(): HTMLElement[] {
    if (!this.toolbarContainer) {
      return [];
    }

    const selector = 'button:not([disabled]), [role="button"]:not([disabled])';
    return Array.from(this.toolbarContainer.nativeElement.querySelectorAll(selector));
  }

  /**
   * Update tabindex for roving tabindex pattern
   */
  private updateToolTabIndex(focusedElement: HTMLElement): void {
    const tools = this.getToolElements();
    tools.forEach(tool => {
      tool.setAttribute('tabindex', tool === focusedElement ? '0' : '-1');
    });
  }

  /**
   * Set up toolbar keyboard navigation
   */
  private setupToolbarNavigation(): void {
    if (!this.toolbarContainer) {
      return;
    }

    // Set up roving tabindex
    const tools = this.getToolElements();
    tools.forEach((tool, index) => {
      tool.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
  }

  /**
   * Handle global keyboard shortcuts
   */
  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Only handle shortcuts when toolbar has focus or is in focus trap
    const activeElement = document.activeElement as HTMLElement;
    const isToolbarFocused = this.toolbarContainer?.nativeElement.contains(activeElement);
    
    if (!isToolbarFocused) {
      return;
    }

    // Handle Escape to close dropdowns
    if (event.key === 'Escape') {
      this.closeAllDropdowns();
      return;
    }

    // Check for keyboard shortcuts
    const shortcuts = this.accessibilityService.getKeyboardShortcuts();
    for (const shortcut of shortcuts) {
      if (this.accessibilityService.matchesShortcut(event, shortcut.action)) {
        event.preventDefault();
        this.handleShortcutAction(shortcut.action);
        break;
      }
    }
  }

  /**
   * Handle shortcut actions
   */
  private handleShortcutAction(action: string): void {
    const command: EditorCommand = {
      name: action,
      options: {
        showUI: false,
        preventDefault: true
      }
    };

    this.command.emit(command);
  }
}