import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { ToolbarConfig, ToolbarTool, ToolOption, ToolOptionPreset } from '../../models/toolbar.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionState } from '../../models/selection-state.interface';
import { AccessibilityService } from '../../services/accessibility.service';
import { getToolbarIconMarkup } from './toolbar-icons';

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
          <span
            *ngIf="tool.separatorBefore && i > 0"
            class="wysiwyg-toolbar__divider"
            aria-hidden="true">
          </span>
          
          <!-- Button Tool -->
          <button
            *ngIf="tool.type === 'button'"
            type="button"
            class="wysiwyg-toolbar__button"
            [class.wysiwyg-toolbar__button--active]="isToolActive(tool)"
            [class.wysiwyg-toolbar__button--disabled]="tool.disabled || disabled"
            [class]="tool.cssClass"
            [disabled]="tool.disabled || disabled"
            [attr.data-tooltip]="getToolTitle(tool)"
            [attr.aria-label]="getToolAriaLabel(tool)"
            [attr.aria-pressed]="isToolActive(tool)"
            [attr.aria-describedby]="getToolDescriptionId(tool)"
            [attr.tabindex]="i === 0 ? '0' : '-1'"
            (mousedown)="preserveSelectionOnMouseDown($event)"
            (click)="executeCommand(tool)"
            (keydown)="handleToolKeydown($event, tool)"
            (focus)="onToolFocus($event)">
            
            <span 
              *ngIf="tool.icon" 
              class="wysiwyg-toolbar__icon"
              [innerHTML]="getSafeToolIcon(tool)"
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
            [attr.data-command]="tool.command"
            [class.wysiwyg-toolbar__dropdown--disabled]="tool.disabled || disabled">
            
            <button
              type="button"
              class="wysiwyg-toolbar__dropdown-trigger"
              [class.wysiwyg-toolbar__dropdown-trigger--active]="isDropdownOpen(tool)"
              [disabled]="tool.disabled || disabled"
              [attr.data-tooltip]="getToolTitle(tool)"
              [attr.aria-label]="getDropdownAriaLabel(tool)"
              [attr.aria-expanded]="isDropdownOpen(tool)"
              [attr.aria-haspopup]="'menu'"
              [attr.aria-controls]="getDropdownMenuId(tool)"
              [id]="getDropdownTriggerId(tool)"
              [attr.tabindex]="i === 0 ? '0' : '-1'"
              (mousedown)="preserveSelectionOnMouseDown($event)"
              (click)="toggleDropdown(tool)"
              (keydown)="handleDropdownKeydown($event, tool)"
              (focus)="onToolFocus($event)">
              
              <span 
                *ngIf="tool.icon" 
                class="wysiwyg-toolbar__icon"
                [innerHTML]="getSafeToolIcon(tool)"
                aria-hidden="true">
              </span>
              
              <span 
                *ngIf="tool.label" 
                class="wysiwyg-toolbar__label"
                [style.font-family]="getDropdownPreviewFont(tool)">
                {{ getDropdownDisplayLabel(tool) }}
              </span>
              
              <span
                class="wysiwyg-toolbar__dropdown-arrow"
                [innerHTML]="getSafeUtilityIcon('chevronDown')"
                aria-hidden="true">
              </span>
            </button>

            <div
              *ngIf="isDropdownOpen(tool)"
              class="wysiwyg-toolbar__dropdown-menu"
              [class.wysiwyg-toolbar__dropdown-menu--above]="getDropdownPlacement(tool) === 'above'"
              [class.wysiwyg-toolbar__dropdown-menu--align-end]="getDropdownAlignment(tool) === 'end'"
              [id]="getDropdownMenuId(tool)"
              role="menu"
              [attr.aria-labelledby]="getDropdownTriggerId(tool)"
              (click)="$event.stopPropagation()"
              (keydown)="handleDropdownMenuKeydown($event, tool)">
              <div class="wysiwyg-toolbar__dropdown-menu-header">
                <span class="wysiwyg-toolbar__dropdown-menu-title">{{ tool.label || tool.command }}</span>
                <span
                  *ngIf="getDropdownCurrentLabel(tool) as currentLabel"
                  class="wysiwyg-toolbar__dropdown-menu-current"
                  [style.font-family]="getDropdownCurrentFont(tool)">
                  {{ currentLabel }}
                </span>
              </div>

              <div class="wysiwyg-toolbar__dropdown-menu-body">
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
                  (mousedown)="preserveSelectionOnMouseDown($event)"
                  (click)="executeDropdownCommand(tool, option)"
                  (focus)="onDropdownOptionFocus($event)">
                  
                  <span 
                    *ngIf="option.icon" 
                    class="wysiwyg-toolbar__icon"
                    [innerHTML]="getSafeOptionIcon(option)"
                    aria-hidden="true">
                  </span>

                  <span
                    *ngIf="!option.icon && tool.command === 'fontFamily'"
                    class="wysiwyg-toolbar__option-preview"
                    [style.font-family]="option.value"
                    aria-hidden="true">
                    Aa
                  </span>
                  
                  <span
                    class="wysiwyg-toolbar__label"
                    [ngStyle]="getOptionPreviewStyles(tool, option)"
                    [ngClass]="option.previewClass"
                    [style.font-family]="tool.command === 'fontFamily' ? option.value : null">
                    {{ option.label }}
                  </span>
                  
                  <span 
                    *ngIf="isOptionSelected(tool, option)"
                    class="wysiwyg-toolbar__selected-indicator"
                    [innerHTML]="getSafeUtilityIcon('check')"
                    aria-hidden="true">
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Group Tool (expandable second row) -->
          <ng-container *ngIf="tool.type === 'group'">
            <button
              type="button"
              class="wysiwyg-toolbar__button wysiwyg-toolbar__button--group-toggle"
              [class.wysiwyg-toolbar__button--active]="isGroupExpanded(tool)"
              [disabled]="tool.disabled || disabled"
              [attr.data-tooltip]="getToolTitle(tool)"
              [attr.aria-label]="getGroupAriaLabel(tool)"
              [attr.aria-expanded]="isGroupExpanded(tool)"
              [attr.tabindex]="i === 0 ? '0' : '-1'"
              (mousedown)="preserveSelectionOnMouseDown($event)"
              (click)="toggleGroup(tool)"
              (keydown)="handleToolKeydown($event, tool)"
              (focus)="onToolFocus($event)">
              <span
                *ngIf="tool.icon"
                class="wysiwyg-toolbar__icon"
                [innerHTML]="getSafeToolIcon(tool)"
                aria-hidden="true">
              </span>
              <span *ngIf="tool.label && !tool.icon" class="wysiwyg-toolbar__label">{{ tool.label }}</span>
            </button>
          </ng-container>

          <!-- Dialog Tool -->
          <button
            *ngIf="tool.type === 'dialog'"
            type="button"
            class="wysiwyg-toolbar__button wysiwyg-toolbar__button--dialog"
            [class.wysiwyg-toolbar__button--active]="isToolActive(tool)"
            [class.wysiwyg-toolbar__button--disabled]="tool.disabled || disabled"
            [class]="tool.cssClass"
            [disabled]="tool.disabled || disabled"
            [attr.data-tooltip]="getToolTitle(tool)"
            [attr.aria-label]="getDialogAriaLabel(tool)"
            [attr.aria-haspopup]="'dialog'"
            [attr.tabindex]="i === 0 ? '0' : '-1'"
            (mousedown)="onDialogButtonMousedown(tool, $event)"
            (click)="executeCommand(tool)"
            (keydown)="handleToolKeydown($event, tool)"
            (focus)="onToolFocus($event)">
            
            <span 
              *ngIf="tool.icon" 
              class="wysiwyg-toolbar__icon"
              [innerHTML]="getSafeToolIcon(tool)"
              aria-hidden="true">
            </span>
            
            <span 
              *ngIf="tool.label && !tool.icon" 
              class="wysiwyg-toolbar__label">
              {{ tool.label }}
            </span>
            
            <span 
              class="wysiwyg-toolbar__dialog-indicator"
              [innerHTML]="getSafeUtilityIcon('dialog')"
              aria-hidden="true">
            </span>
          </button>

        </ng-container>
      </div>

      <!-- Group expanded rows -->
      <ng-container *ngFor="let tool of config?.tools">
        <div
          *ngIf="tool.type === 'group' && isGroupExpanded(tool) && tool.tools?.length"
          class="wysiwyg-toolbar__group-row"
          role="toolbar"
          [attr.aria-label]="(tool.label || 'More') + ' tools'">
          <ng-container *ngFor="let subTool of tool.tools; trackBy: trackByTool; let si = index">
            <span
              *ngIf="subTool.separatorBefore && si > 0"
              class="wysiwyg-toolbar__divider"
              aria-hidden="true">
            </span>

            <!-- Sub-Button -->
            <button
              *ngIf="subTool.type === 'button'"
              type="button"
              class="wysiwyg-toolbar__button"
              [class.wysiwyg-toolbar__button--active]="isToolActive(subTool)"
              [class.wysiwyg-toolbar__button--disabled]="subTool.disabled || disabled"
              [disabled]="subTool.disabled || disabled"
              [attr.data-tooltip]="getToolTitle(subTool)"
              [attr.aria-label]="getToolAriaLabel(subTool)"
              [attr.aria-pressed]="isToolActive(subTool)"
              [attr.tabindex]="si === 0 ? '0' : '-1'"
              (mousedown)="preserveSelectionOnMouseDown($event)"
              (click)="executeCommand(subTool)"
              (focus)="onToolFocus($event)">
              <span
                *ngIf="subTool.icon"
                class="wysiwyg-toolbar__icon"
                [innerHTML]="getSafeToolIcon(subTool)"
                aria-hidden="true">
              </span>
              <span *ngIf="subTool.label && !subTool.icon" class="wysiwyg-toolbar__label">{{ subTool.label }}</span>
            </button>

            <!-- Sub-Dropdown -->
            <div
              *ngIf="subTool.type === 'dropdown'"
              class="wysiwyg-toolbar__dropdown"
              [attr.data-command]="subTool.command"
              [class.wysiwyg-toolbar__dropdown--disabled]="subTool.disabled || disabled">
              <button
                type="button"
                class="wysiwyg-toolbar__dropdown-trigger"
                [class.wysiwyg-toolbar__dropdown-trigger--active]="isDropdownOpen(subTool)"
                [disabled]="subTool.disabled || disabled"
                [attr.data-tooltip]="getToolTitle(subTool)"
                [attr.aria-label]="getDropdownAriaLabel(subTool)"
                [attr.aria-expanded]="isDropdownOpen(subTool)"
                [attr.aria-haspopup]="'menu'"
                [attr.aria-controls]="getDropdownMenuId(subTool)"
                [id]="getDropdownTriggerId(subTool)"
                [attr.tabindex]="si === 0 ? '0' : '-1'"
                (mousedown)="preserveSelectionOnMouseDown($event)"
                (click)="toggleDropdown(subTool)"
                (focus)="onToolFocus($event)">
                <span
                  *ngIf="subTool.icon"
                  class="wysiwyg-toolbar__icon"
                  [innerHTML]="getSafeToolIcon(subTool)"
                  aria-hidden="true">
                </span>
                <span
                  *ngIf="subTool.label"
                  class="wysiwyg-toolbar__label"
                  [style.font-family]="getDropdownPreviewFont(subTool)">
                  {{ getDropdownDisplayLabel(subTool) }}
                </span>
                <span
                  class="wysiwyg-toolbar__dropdown-arrow"
                  [innerHTML]="getSafeUtilityIcon('chevronDown')"
                  aria-hidden="true">
                </span>
              </button>
              <div
                *ngIf="isDropdownOpen(subTool)"
                class="wysiwyg-toolbar__dropdown-menu"
                [class.wysiwyg-toolbar__dropdown-menu--above]="getDropdownPlacement(subTool) === 'above'"
                [class.wysiwyg-toolbar__dropdown-menu--align-end]="getDropdownAlignment(subTool) === 'end'"
                [id]="getDropdownMenuId(subTool)"
                role="menu"
                [attr.aria-labelledby]="getDropdownTriggerId(subTool)"
                (click)="$event.stopPropagation()"
                (keydown)="handleDropdownMenuKeydown($event, subTool)">
                <div class="wysiwyg-toolbar__dropdown-menu-header">
                  <span class="wysiwyg-toolbar__dropdown-menu-title">{{ subTool.label || subTool.command }}</span>
                  <span
                    *ngIf="getDropdownCurrentLabel(subTool) as currentLabel"
                    class="wysiwyg-toolbar__dropdown-menu-current"
                    [style.font-family]="getDropdownCurrentFont(subTool)">
                    {{ currentLabel }}
                  </span>
                </div>
                <div class="wysiwyg-toolbar__dropdown-menu-body">
                  <button
                    *ngFor="let option of subTool.options; trackBy: trackByOption; let optionIndex = index"
                    type="button"
                    class="wysiwyg-toolbar__dropdown-option"
                    [class.wysiwyg-toolbar__dropdown-option--disabled]="option.disabled"
                    [class.wysiwyg-toolbar__dropdown-option--selected]="isOptionSelected(subTool, option)"
                    [disabled]="option.disabled"
                    role="menuitem"
                    [attr.aria-selected]="isOptionSelected(subTool, option)"
                    [attr.tabindex]="optionIndex === 0 ? '0' : '-1'"
                    (mousedown)="preserveSelectionOnMouseDown($event)"
                    (click)="executeDropdownCommand(subTool, option)"
                    (focus)="onDropdownOptionFocus($event)">
                    <span
                      *ngIf="option.icon"
                      class="wysiwyg-toolbar__icon"
                      [innerHTML]="getSafeOptionIcon(option)"
                      aria-hidden="true">
                    </span>
                    <span
                      *ngIf="!option.icon && subTool.command === 'fontFamily'"
                      class="wysiwyg-toolbar__option-preview"
                      [style.font-family]="option.value"
                      aria-hidden="true">
                      Aa
                    </span>
                    <span
                      class="wysiwyg-toolbar__label"
                      [ngStyle]="getOptionPreviewStyles(subTool, option)"
                      [ngClass]="option.previewClass"
                      [style.font-family]="subTool.command === 'fontFamily' ? option.value : null">
                      {{ option.label }}
                    </span>
                    <span
                      *ngIf="isOptionSelected(subTool, option)"
                      class="wysiwyg-toolbar__selected-indicator"
                      [innerHTML]="getSafeUtilityIcon('check')"
                      aria-hidden="true">
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Sub-Dialog -->
            <button
              *ngIf="subTool.type === 'dialog'"
              type="button"
              class="wysiwyg-toolbar__button wysiwyg-toolbar__button--dialog"
              [class.wysiwyg-toolbar__button--active]="isToolActive(subTool)"
              [class.wysiwyg-toolbar__button--disabled]="subTool.disabled || disabled"
              [disabled]="subTool.disabled || disabled"
              [attr.data-tooltip]="getToolTitle(subTool)"
              [attr.aria-label]="getDialogAriaLabel(subTool)"
              [attr.aria-haspopup]="'dialog'"
              [attr.tabindex]="si === 0 ? '0' : '-1'"
              (mousedown)="onDialogButtonMousedown(subTool, $event)"
              (click)="executeCommand(subTool)"
              (focus)="onToolFocus($event)">
              <span
                *ngIf="subTool.icon"
                class="wysiwyg-toolbar__icon"
                [innerHTML]="getSafeToolIcon(subTool)"
                aria-hidden="true">
              </span>
              <span *ngIf="subTool.label && !subTool.icon" class="wysiwyg-toolbar__label">{{ subTool.label }}</span>
              <span
                class="wysiwyg-toolbar__dialog-indicator"
                [innerHTML]="getSafeUtilityIcon('dialog')"
                aria-hidden="true">
              </span>
            </button>
          </ng-container>
        </div>
      </ng-container>
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
  private dropdownPlacements = new Map<string, 'below' | 'above'>();
  private dropdownAlignments = new Map<string, 'start' | 'end'>();
  private expandedGroups = new Set<string>();
  toolbarId: string;
  private pendingAnchorRect: DOMRect | null = null;
  private boundDocumentClickHandler!: (event: MouseEvent) => void;
  private boundGlobalKeydownHandler!: (event: KeyboardEvent) => void;

  constructor(
    private accessibilityService: AccessibilityService,
    private sanitizer: DomSanitizer
  ) {
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
  trackByOption(index: number, option: ToolOption): string {
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
      case 'subscript':
        return formats.subscript || false;
      case 'superscript':
        return formats.superscript || false;
      case 'quote':
        return this.normalizeBlockFormatValue(formats.blockFormat) === 'blockquote';
      case 'justifyLeft':
        return formats.alignment === 'left';
      case 'justifyCenter':
        return formats.alignment === 'center';
      case 'justifyRight':
        return formats.alignment === 'right';
      case 'justifyFull':
        return formats.alignment === 'justify';
      case 'toggleHtmlView':
        return this.selectionState.htmlMode || false;
      case 'fullscreen':
        return this.selectionState.fullscreenMode || false;
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
      this.dropdownPlacements.delete(tool.command);
      this.dropdownAlignments.delete(tool.command);
    } else {
      // Close other dropdowns first
      this.openDropdowns.clear();
      this.dropdownPlacements.clear();
      this.dropdownAlignments.clear();
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
    this.dropdownPlacements.clear();
    this.dropdownAlignments.clear();
  }

  /**
   * Check if a group is currently expanded
   */
  isGroupExpanded(tool: ToolbarTool): boolean {
    return this.expandedGroups.has(tool.command);
  }

  /**
   * Toggle a group expanded/collapsed
   */
  toggleGroup(tool: ToolbarTool): void {
    if (this.expandedGroups.has(tool.command)) {
      this.expandedGroups.delete(tool.command);
    } else {
      this.expandedGroups.add(tool.command);
    }
    // Close any open dropdowns when toggling group
    this.closeAllDropdowns();
  }

  /**
   * Get ARIA label for group toggle button
   */
  getGroupAriaLabel(tool: ToolbarTool): string {
    const label = tool.ariaLabel || tool.label || 'More';
    return this.isGroupExpanded(tool) ? `Collapse ${label}` : `Expand ${label}`;
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
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const minMenuWidth = Math.max(
      Math.round(triggerRect.width + 24),
      tool.command === 'fontFamily' ? 240 : 184
    );
    const maxMenuWidth = Math.min(tool.command === 'fontFamily' ? 320 : 260, viewportWidth - 20);

    menu.style.minWidth = `${minMenuWidth}px`;
    menu.style.maxWidth = `${maxMenuWidth}px`;

    const menuHeight = menu.offsetHeight;
    const menuWidth = menu.offsetWidth;
    const spaceBelow = viewportHeight - triggerRect.bottom - 10;
    const spaceAbove = triggerRect.top - 10;
    const placement = spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? 'below' : 'above';
    const alignment = triggerRect.left + menuWidth <= viewportWidth - 10 || triggerRect.right - menuWidth < 10
      ? 'start'
      : 'end';

    this.dropdownPlacements.set(tool.command, placement);
    this.dropdownAlignments.set(tool.command, alignment);
  }

  getDropdownPlacement(tool: ToolbarTool): 'below' | 'above' {
    return this.dropdownPlacements.get(tool.command) || 'below';
  }

  getDropdownAlignment(tool: ToolbarTool): 'start' | 'end' {
    return this.dropdownAlignments.get(tool.command) || 'start';
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
   * Capture the toolbar button rect at mousedown time (most reliable moment)
   * and preserve the editor selection.
   */
  onDialogButtonMousedown(tool: ToolbarTool, event: MouseEvent): void {
    this.preserveSelectionOnMouseDown(event);
    const btn = event.currentTarget as HTMLElement;
    this.pendingAnchorRect = btn ? btn.getBoundingClientRect() : null;
  }

  /**
   * Execute a toolbar command
   */
  executeCommand(tool: ToolbarTool): void {
    if (tool.disabled || this.disabled) {
      this.pendingAnchorRect = null;
      return;
    }

    const params: Record<string, any> = {};
    if (this.pendingAnchorRect) {
      params['anchorRect'] = this.pendingAnchorRect;
    }
    this.pendingAnchorRect = null;

    const command: EditorCommand = {
      name: tool.command,
      options: {
        showUI: false,
        preventDefault: true,
        params
      }
    };

    this.command.emit(command);
  }

  /**
   * Execute a dropdown command with selected option
   */
  executeDropdownCommand(tool: ToolbarTool, option: ToolOption): void {
    if (tool.disabled || this.disabled || option.disabled) {
      return;
    }

    // Map fontFamily command to fontName for document.execCommand compatibility
    let commandName = tool.command;
    if (tool.command === 'fontFamily') {
      commandName = 'fontName';
    } else if (tool.command === 'paragraphFormat') {
      commandName = 'formatBlock';
    }

    const command: EditorCommand = {
      name: commandName,
      value: option.value,
      options: {
        showUI: false,
        preventDefault: true,
        params: {
          preset: option.preset,
          presetOptions: tool.options || []
        }
      }
    };

    this.command.emit(command);
    this.openDropdowns.delete(tool.command);
  }

  /**
   * Prevent toolbar clicks from stealing the editor selection before commands run.
   */
  preserveSelectionOnMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
  }

  /**
   * Get icon HTML for a tool
   */
  getToolIcon(tool: ToolbarTool): string {
    if (tool.command === 'toggleHtmlView') {
      const isActive = this.isToolActive(tool);
      return isActive ? getToolbarIconMarkup('eye') : getToolbarIconMarkup('code');
    }

    if (tool.command === 'fullscreen') {
      return this.isToolActive(tool)
        ? getToolbarIconMarkup('fullscreenExit')
        : getToolbarIconMarkup('fullscreen');
    }

    return getToolbarIconMarkup(tool.icon);
  }

  /**
   * Get icon HTML for a dropdown option
   */
  getOptionIcon(option: ToolOption): string {
    return getToolbarIconMarkup(option.icon);
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

    if (tool.command === 'fullscreen') {
      return this.isToolActive(tool) ? 'Exit Fullscreen' : 'Enter Fullscreen';
    }

    const shortcut = this.accessibilityService.getShortcutKeys(tool.command);
    const currentOption = tool.type === 'dropdown' ? this.getCurrentDropdownOption(tool) : null;
    const baseTitle = tool.title || tool.label || tool.command;
    const title = currentOption ? `${baseTitle}: ${currentOption.label}` : baseTitle;
    return shortcut ? `${title} (${shortcut})` : title;
  }

  /**
   * Get ARIA label for tool
   */
  getToolAriaLabel(tool: ToolbarTool): string {
    if (tool.command === 'toggleHtmlView') {
      return this.isToolActive(tool) ? 'Switch to visual mode' : 'View HTML code';
    }

    if (tool.command === 'fullscreen') {
      return this.isToolActive(tool) ? 'Exit fullscreen mode' : 'Enter fullscreen mode';
    }

    const label = tool.ariaLabel || tool.label || tool.command;
    const shortcut = this.accessibilityService.getShortcutKeys(tool.command);
    return shortcut ? `${label}, keyboard shortcut ${shortcut}` : label;
  }

  /**
   * Get ARIA label for dropdown
   */
  getDropdownAriaLabel(tool: ToolbarTool): string {
    const label = tool.ariaLabel || tool.label || tool.command;
    const currentOption = this.getCurrentDropdownOption(tool);
    return currentOption ? `${label}, current selection ${currentOption.label}` : `${label} menu`;
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
  isOptionSelected(tool: ToolbarTool, option: ToolOption): boolean {
    if (!this.selectionState?.formats) {
      return false;
    }

    const formats = this.selectionState.formats;
    
    switch (tool.command) {
      case 'fontSize':
        return this.normalizeFontSizeValue(formats.fontSize) === this.normalizeFontSizeValue(option.value);
      case 'fontFamily':
        return this.normalizeFontFamilyValue(formats.fontFamily) === this.normalizeFontFamilyValue(option.value);
      case 'fontColor':
        return this.normalizeColorValue(formats.fontColor) === this.normalizeColorValue(option.value);
      case 'backgroundColor':
        return this.normalizeColorValue(formats.backgroundColor) === this.normalizeColorValue(option.value);
      case 'paragraphFormat':
        return this.normalizeBlockFormatValue(formats.blockFormat) === this.normalizeBlockFormatValue(option.value);
      case 'paragraphStyle':
        return this.matchesParagraphStyleOption(tool, option);
      case 'inlineClass':
      case 'inlineStyle':
        return this.matchesInlinePresetOption(tool, option);
      case 'lineHeight':
        return this.normalizeLineHeightValue(formats.lineHeight) === this.normalizeLineHeightValue(option.value);
      default:
        return false;
    }
  }

  getDropdownDisplayLabel(tool: ToolbarTool): string {
    return this.getCurrentDropdownOption(tool)?.label || tool.label || tool.command;
  }

  getDropdownPreviewFont(tool: ToolbarTool): string | null {
    return tool.command === 'fontFamily' ? this.getCurrentDropdownOption(tool)?.value || null : null;
  }

  getDropdownCurrentLabel(tool: ToolbarTool): string | null {
    return this.getCurrentDropdownOption(tool)?.label || null;
  }

  getDropdownCurrentFont(tool: ToolbarTool): string | null {
    return tool.command === 'fontFamily' ? this.getCurrentDropdownOption(tool)?.value || null : null;
  }

  getUtilityIcon(name: 'chevronDown' | 'check' | 'dialog'): string {
    return getToolbarIconMarkup(name);
  }

  getSafeToolIcon(tool: ToolbarTool): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getToolIcon(tool));
  }

  getSafeOptionIcon(option: ToolOption): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getOptionIcon(option));
  }

  getSafeUtilityIcon(name: 'chevronDown' | 'check' | 'dialog'): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getUtilityIcon(name));
  }

  getOptionPreviewStyles(tool: ToolbarTool, option: ToolOption): Record<string, string> | null {
    if (option.previewStyles) {
      return option.previewStyles;
    }

    if (tool.command === 'paragraphStyle' && option.preset?.styles) {
      return option.preset.styles;
    }

    return null;
  }

  private getCurrentDropdownOption(tool: ToolbarTool): ToolOption | null {
    if (!tool.options?.length || !this.selectionState?.formats) {
      return null;
    }

    return tool.options.find(option => this.isOptionSelected(tool, option)) || null;
  }

  private normalizeFontFamilyValue(value?: string | null): string {
    return (value || '')
      .replace(/['"]/g, '')
      .split(',')[0]
      .trim()
      .toLowerCase();
  }

  private normalizeFontSizeValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const normalized = value.trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      const sizeMap: Record<string, string> = {
        '1': '10px',
        '2': '12px',
        '3': '14px',
        '4': '16px',
        '5': '18px',
        '6': '24px',
        '7': '32px'
      };

      return sizeMap[normalized] || normalized;
    }

    if (normalized.endsWith('px')) {
      const pixelValue = Number.parseFloat(normalized);
      return Number.isFinite(pixelValue) ? `${Math.round(pixelValue)}px` : normalized;
    }

    if (normalized.endsWith('pt')) {
      const pointValue = Number.parseFloat(normalized);
      return Number.isFinite(pointValue) ? `${Math.round(pointValue * (4 / 3))}px` : normalized;
    }

    return normalized;
  }

  private normalizeColorValue(value?: string | null): string {
    return (value || '').trim().toLowerCase();
  }

  private normalizeBlockFormatValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const normalized = value
      .replace(/[<>'"]/g, '')
      .trim()
      .toLowerCase();

    if (normalized === 'normal' || normalized === 'paragraph' || normalized === 'div') {
      return 'p';
    }

    return normalized;
  }

  private normalizeLineHeightValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'normal') {
      return 'normal';
    }

    const numericValue = Number.parseFloat(normalized);
    if (Number.isFinite(numericValue)) {
      return Number.parseFloat(numericValue.toFixed(2)).toString();
    }

    return normalized;
  }

  private matchesParagraphStyleOption(tool: ToolbarTool, option: ToolOption): boolean {
    const blockElement = this.getSelectionBlockElement();
    if (!blockElement) {
      return false;
    }

    const preset = option.preset;
    if (!preset) {
      return this.normalizeBlockFormatValue(this.selectionState?.formats.blockFormat) === this.normalizeBlockFormatValue(option.value);
    }

    const matchesPreset = this.matchesPresetElement(blockElement, preset);
    if (!matchesPreset) {
      return false;
    }

    const hasExplicitStyling = this.getPresetClassNames(preset).length > 0 || Object.keys(preset.styles || {}).length > 0;
    if (hasExplicitStyling) {
      return true;
    }

    return !tool.options?.some(otherOption => {
      if (otherOption === option || !otherOption.preset) {
        return false;
      }

      const otherPresetHasExplicitStyling =
        this.getPresetClassNames(otherOption.preset).length > 0 ||
        Object.keys(otherOption.preset.styles || {}).length > 0;

      return otherPresetHasExplicitStyling && this.matchesPresetElement(blockElement, otherOption.preset);
    });
  }

  private matchesInlinePresetOption(tool: ToolbarTool, option: ToolOption): boolean {
    const preset = option.preset;
    if (!preset) {
      return false;
    }

    const inlineElement = this.getSelectionInlineElement();
    const hasExplicitStyling = this.getPresetClassNames(preset).length > 0 || Object.keys(preset.styles || {}).length > 0;

    if (!inlineElement) {
      return !hasExplicitStyling;
    }

    const matchesPreset = this.matchesPresetElement(inlineElement, preset);
    if (!matchesPreset) {
      return false;
    }

    if (hasExplicitStyling) {
      return true;
    }

    return !tool.options?.some(otherOption => {
      if (otherOption === option || !otherOption.preset) {
        return false;
      }

      const otherPresetHasExplicitStyling =
        this.getPresetClassNames(otherOption.preset).length > 0 ||
        Object.keys(otherOption.preset.styles || {}).length > 0;

      return otherPresetHasExplicitStyling && this.matchesPresetElement(inlineElement, otherOption.preset);
    });
  }

  private getSelectionBlockElement(): HTMLElement | null {
    const range = this.selectionState?.range;
    if (!range) {
      return null;
    }

    let node: Node | null = range.commonAncestorContainer;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const tagName = (node as Element).tagName.toLowerCase();
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tagName)) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }

    return null;
  }

  private getSelectionInlineElement(): HTMLElement | null {
    const range = this.selectionState?.range;
    if (!range) {
      return null;
    }

    let node: Node | null = range.commonAncestorContainer;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const tagName = (node as Element).tagName.toLowerCase();
      if (tagName === 'span') {
        return node as HTMLElement;
      }

      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tagName)) {
        return null;
      }

      node = node.parentNode;
    }

    return null;
  }

  private matchesPresetElement(element: HTMLElement, preset: ToolOptionPreset): boolean {
    if (preset.tagName && element.tagName.toLowerCase() !== this.normalizeBlockFormatValue(preset.tagName)) {
      return false;
    }

    const requiredClassNames = this.getPresetClassNames(preset);
    if (requiredClassNames.some(className => !element.classList.contains(className))) {
      return false;
    }

    return Object.entries(preset.styles || {}).every(([property, expectedValue]) => {
      const normalizedProperty = this.normalizeStyleProperty(property);
      const actualValue = element.style.getPropertyValue(normalizedProperty) || window.getComputedStyle(element).getPropertyValue(normalizedProperty);
      return this.normalizeStyleComparison(normalizedProperty, actualValue) === this.normalizeStyleComparison(normalizedProperty, expectedValue);
    });
  }

  private getPresetClassNames(preset?: ToolOptionPreset): string[] {
    if (!preset?.className) {
      return [];
    }

    const classNameList = Array.isArray(preset.className)
      ? preset.className
      : preset.className.split(/\s+/);

    return classNameList
      .map(className => className.trim())
      .filter(Boolean);
  }

  private normalizeStyleProperty(property: string): string {
    return property
      .trim()
      .replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
      .toLowerCase();
  }

  private normalizeStyleComparison(property: string, value: string): string {
    const temporaryElement = document.createElement('div');
    temporaryElement.style.setProperty(property, value);
    return (temporaryElement.style.getPropertyValue(property) || value)
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
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
