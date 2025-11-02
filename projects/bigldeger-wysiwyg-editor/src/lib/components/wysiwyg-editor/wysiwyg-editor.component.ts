import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef, ViewContainerRef, ComponentRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ToolbarComponent } from '../toolbar/toolbar.component';
import { EditorContentComponent } from '../editor-content/editor-content.component';
import { LinkData } from '../dialogs/link-dialog/link-dialog.component';
import { ImageData } from '../../models/image.interface';
import { ColorData } from '../dialogs/color-picker-dialog/color-picker-dialog.component';
import { TableData } from '../../models/table.interface';
import { LazyLoaderService } from '../../services/lazy-loader.service';
import { DebounceService } from '../../services/debounce.service';
import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { AssetOptimizerService } from '../../services/asset-optimizer.service';

import { ToolbarConfig } from '../../models/toolbar.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionState } from '../../models/selection-state.interface';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';

/**
 * Main WYSIWYG Editor Component
 */
@Component({
  selector: 'wysiwyg-editor',
  standalone: true,
  imports: [CommonModule, ToolbarComponent, EditorContentComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WysiwygEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="wysiwyg-editor" [class.wysiwyg-editor--readonly]="readonly">
      <wysiwyg-toolbar
        [config]="toolbarConfig"
        [disabled]="readonly"
        [selectionState]="currentSelection"
        (command)="handleCommand($event)">
      </wysiwyg-toolbar>
      
      <wysiwyg-editor-content
        [content]="content"
        [placeholder]="placeholder"
        [readonly]="readonly"
        [height]="height"
        [htmlMode]="isHtmlMode"
        (contentChange)="onContentChange($event)"
        (selectionChange)="onSelectionChange($event)"
        (blurEvent)="onBlur($event)">
      </wysiwyg-editor-content>

      <!-- Dynamic dialog container -->
      <ng-container #dialogContainer></ng-container>
    </div>
  `,
  styleUrls: ['./wysiwyg-editor.component.scss']
})
export class WysiwygEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() toolbarConfig: ToolbarConfig = this.getDefaultToolbarConfig();
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() height = '300px';

  @Output() contentChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectionState>();

  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;
  @ViewChild(EditorContentComponent) editorContent!: EditorContentComponent;

  content = '';
  currentSelection: SelectionState | null = null;
  isHtmlMode = false;

  // Content change detection
  private lastKnownContent = '';

  // Dialog visibility state
  linkDialogVisible = false;
  imageDialogVisible = false;
  colorPickerDialogVisible = false;
  tableDialogVisible = false;

  // Dialog state
  private linkDialogRef: ComponentRef<any> | null = null;
  private imageDialogRef: ComponentRef<any> | null = null;
  private colorPickerDialogRef: ComponentRef<any> | null = null;
  private tableDialogRef: ComponentRef<any> | null = null;
  private currentLinkData: LinkData | null = null;
  private isEditingLink = false;
  private currentImageData: ImageData | null = null;
  private isEditingImage = false;
  private currentColorType: 'text' | 'background' = 'text';
  private currentTableData: TableData | null = null;
  private isEditingTable = false;
  private isInsertingNestedTable = false;

  private destroy$ = new Subject<void>();
  private onChange = (value: string) => { };
  private onTouched = () => { };

  // Debounced content change handler (initialized in constructor)
  private debouncedContentChange!: (content: string) => void;

  constructor(
    private commandService: CommandService,
    private selectionService: SelectionService,
    private lazyLoaderService: LazyLoaderService,
    private debounceService: DebounceService,
    private performanceMonitor: PerformanceMonitorService,
    private assetOptimizer: AssetOptimizerService
  ) {
    // Initialize debounced content change handler
    this.debouncedContentChange = this.debounceService.debounce(
      (content: string) => {
        this.contentChange.emit(content);
      },
      300
    );
  }

  ngOnInit(): void {
    // Start performance monitoring
    this.performanceMonitor.startBenchmark('componentInit');

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Subscribe to debounced content changes
    this.debounceService.debouncedContentChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(content => {
        this.performanceMonitor.startBenchmark('contentChange');
        this.contentChange.emit(content);
        this.performanceMonitor.endBenchmark('contentChange');
      });

    // Preload critical assets
    this.preloadCriticalAssets();

    // End component initialization benchmark
    this.performanceMonitor.endBenchmark('componentInit');

    // Start performance monitoring
    this.performanceMonitor.startMonitoring();
    
    // Listen for nested table insertion events
    document.addEventListener('insert-nested-table', this.handleNestedTableRequest.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up dialog references
    this.closeLinkDialog();
    this.closeImageDialog();
    this.closeColorPickerDialog();
    this.closeTableDialog();

    // Remove nested table event listener
    document.removeEventListener('insert-nested-table', this.handleNestedTableRequest.bind(this));

    // Stop performance monitoring and log summary
    this.performanceMonitor.stopMonitoring();
    this.performanceMonitor.logPerformanceSummary();

    // Clean up assets
    this.assetOptimizer.cleanup();
  }
  
  /**
   * Handle nested table insertion request from cell toolbar
   */
  private handleNestedTableRequest(event: Event): void {
    const customEvent = event as CustomEvent;
    console.log('Nested table requested for cell:', customEvent.detail.cell);
    
    // Show table dialog for nested table
    this.showTableDialog();
    
    // Mark that this is for a nested table
    this.isInsertingNestedTable = true;
  }

  /**
   * Handle commands from toolbar
   */
  handleCommand(command: EditorCommand): void {
    switch (command.name) {
      case 'createLink':
        this.showLinkDialog();
        break;
      case 'unlink':
        this.removeLink();
        break;
      case 'insertImage':
        this.showImageDialog();
        break;
      case 'insertTable':
        this.showTableDialog();
        break;
      case 'fontColor':
        this.showColorPickerDialog('text');
        break;
      case 'backgroundColor':
        this.showColorPickerDialog('background');
        break;
      case 'toggleHtmlView':
        this.toggleHtmlView();
        break;
      default:
        this.executeCommand(command);
        break;
    }
  }

  /**
   * Toggle between HTML and visual editing mode
   */
  private toggleHtmlView(): void {
    this.isHtmlMode = !this.isHtmlMode;
    // Update selection state to reflect the new HTML mode
    this.updateSelectionState();
  }

  /**
   * Execute a formatting command
   */
  private executeCommand(command: EditorCommand): void {
    const success = this.commandService.executeCommand(command, command.value);
    if (success) {
      // Update selection state after command execution
      setTimeout(() => {
        this.updateSelectionState();
      }, 0);
    }
  }

  /**
   * Show link dialog (lazy loaded)
   */
  private async showLinkDialog(): Promise<void> {
    if (this.linkDialogRef) {
      return; // Dialog already open
    }

    try {
      // Set dialog visibility state
      this.linkDialogVisible = true;

      // Benchmark dialog loading
      this.performanceMonitor.startBenchmark('linkDialogLoad');

      // Lazy load the link dialog component
      this.linkDialogRef = await this.lazyLoaderService.loadDialogComponent('link', this.dialogContainer);

      this.performanceMonitor.endBenchmark('linkDialogLoad');

      if (this.linkDialogRef) {
        // Check if we're editing an existing link
        const linkData = this.commandService.getLinkData();

        if (linkData) {
          this.currentLinkData = linkData;
          this.isEditingLink = true;
        } else {
          // Get selected text for new link
          const selection = this.selectionService.getSelection();
          const selectedText = selection?.toString() || '';

          this.currentLinkData = {
            url: '',
            text: selectedText,
            target: '_blank'
          };
          this.isEditingLink = false;
        }

        // Set component inputs
        this.linkDialogRef.instance.visible = true;
        this.linkDialogRef.instance.linkData = this.currentLinkData;
        this.linkDialogRef.instance.isEditing = this.isEditingLink;

        // Subscribe to component outputs
        this.linkDialogRef.instance.linkCreated.subscribe((linkData: LinkData) => {
          this.onLinkCreated(linkData);
        });

        this.linkDialogRef.instance.linkRemoved.subscribe(() => {
          this.onLinkRemoved();
        });

        this.linkDialogRef.instance.dialogClosed.subscribe(() => {
          this.onLinkDialogClosed();
        });
      }
    } catch (error) {
      console.error('Failed to load link dialog:', error);
      this.linkDialogVisible = false;
    }
  }

  /**
   * Handle link creation/update
   */
  onLinkCreated(linkData: LinkData): void {
    if (this.isEditingLink) {
      this.commandService.updateLink(
        linkData.url,
        linkData.text,
        linkData.title,
        linkData.target
      );
    } else {
      this.commandService.createLink(
        linkData.url,
        linkData.text,
        linkData.title,
        linkData.target
      );
    }

    this.updateSelectionState();
    this.emitContentChange();
  }

  /**
   * Handle image insertion
   */
  onImageInserted(imageData: ImageData): void {
    this.commandService.insertImage(imageData);
    this.imageDialogVisible = false;
    this.updateSelectionState();
    this.emitContentChange();
  }

  /**
   * Handle link removal
   */
  onLinkRemoved(): void {
    this.removeLink();
  }

  /**
   * Remove link from selection
   */
  private removeLink(): void {
    const success = this.commandService.removeLink();
    if (success) {
      this.updateSelectionState();
      this.emitContentChange();
    }
  }

  /**
   * Handle link dialog closed event
   */
  onLinkDialogClosed(): void {
    this.closeLinkDialog();
  }

  /**
   * Close link dialog and clean up
   */
  private closeLinkDialog(): void {
    if (this.linkDialogRef) {
      this.linkDialogRef.destroy();
      this.linkDialogRef = null;
    }
    this.linkDialogVisible = false;
    this.currentLinkData = null;
    this.isEditingLink = false;
  }

  /**
   * Show image dialog (lazy loaded)
   */
  private async showImageDialog(): Promise<void> {
    if (this.imageDialogRef) {
      return; // Dialog already open
    }

    try {
      // Set dialog visibility state
      this.imageDialogVisible = true;

      // Benchmark dialog loading
      this.performanceMonitor.startBenchmark('imageDialogLoad');

      // Lazy load the image dialog component
      this.imageDialogRef = await this.lazyLoaderService.loadDialogComponent('image', this.dialogContainer);

      this.performanceMonitor.endBenchmark('imageDialogLoad');

      if (this.imageDialogRef) {
        // Check if we're editing an existing image
        const imageData = this.commandService.getImageData();

        if (imageData) {
          this.currentImageData = imageData;
          this.isEditingImage = true;
        } else {
          this.currentImageData = null;
          this.isEditingImage = false;
        }

        // Set component inputs
        this.imageDialogRef.instance.visible = true;
        this.imageDialogRef.instance.imageData = this.currentImageData;
        this.imageDialogRef.instance.isEditing = this.isEditingImage;

        // Subscribe to component outputs
        this.imageDialogRef.instance.imageCreated.subscribe((imageData: ImageData) => {
          this.onImageCreated(imageData);
        });

        this.imageDialogRef.instance.imageRemoved.subscribe(() => {
          this.onImageRemoved();
        });

        this.imageDialogRef.instance.dialogClosed.subscribe(() => {
          this.onImageDialogClosed();
        });
      }
    } catch (error) {
      console.error('Failed to load image dialog:', error);
      this.imageDialogVisible = false;
    }
  }

  /**
   * Handle image creation/update
   */
  onImageCreated(imageData: ImageData): void {
    if (this.isEditingImage) {
      this.commandService.updateImage(imageData);
    } else {
      this.commandService.insertImage(imageData);
    }

    this.updateSelectionState();
    this.emitContentChange();
  }

  /**
   * Handle image removal
   */
  onImageRemoved(): void {
    this.removeImage();
  }

  /**
   * Remove image from selection
   */
  private removeImage(): void {
    const success = this.commandService.removeImage();
    if (success) {
      this.updateSelectionState();
      this.emitContentChange();
    }
  }

  /**
   * Handle image dialog closed event
   */
  onImageDialogClosed(): void {
    this.closeImageDialog();
  }

  /**
   * Close image dialog and clean up
   */
  private closeImageDialog(): void {
    if (this.imageDialogRef) {
      this.imageDialogRef.destroy();
      this.imageDialogRef = null;
    }
    this.imageDialogVisible = false;
    this.currentImageData = null;
    this.isEditingImage = false;
  }

  /**
   * Show color picker dialog (lazy loaded)
   */
  private async showColorPickerDialog(type: 'text' | 'background'): Promise<void> {
    if (this.colorPickerDialogRef) {
      return; // Dialog already open
    }

    try {
      // CRITICAL: Save selection BEFORE opening dialog to prevent selection loss
      const savedSelection = this.selectionService.saveSelection();

      // Set dialog visibility state
      this.colorPickerDialogVisible = true;
      this.currentColorType = type;

      // Benchmark dialog loading
      this.performanceMonitor.startBenchmark('colorPickerDialogLoad');

      // Lazy load the color picker dialog component
      this.colorPickerDialogRef = await this.lazyLoaderService.loadDialogComponent('color', this.dialogContainer);

      this.performanceMonitor.endBenchmark('colorPickerDialogLoad');

      if (this.colorPickerDialogRef) {
        // Get current color based on type from selection state
        const currentColor = type === 'text'
          ? (this.currentSelection?.formats.fontColor || '#000000')
          : (this.currentSelection?.formats.backgroundColor || '#ffffff');

        // Set component inputs
        this.colorPickerDialogRef.instance.initialColor = currentColor;
        this.colorPickerDialogRef.instance.type = type;
        this.colorPickerDialogRef.instance.savedSelection = savedSelection; // Pass saved selection to dialog

        // Subscribe to component outputs
        this.colorPickerDialogRef.instance.colorSelected.subscribe((colorData: ColorData) => {
          this.onColorSelected(colorData, savedSelection);
        });

        this.colorPickerDialogRef.instance.cancel.subscribe(() => {
          this.onColorPickerDialogClosed();
        });
      }
    } catch (error) {
      console.error('Failed to load color picker dialog:', error);
      this.colorPickerDialogVisible = false;
    }
  }

  /**
   * Handle color selection
   */
  onColorSelected(colorData: ColorData, savedSelection: SelectionState): void {
    // Restore the selection BEFORE executing the command
    this.selectionService.restoreSelection(savedSelection);

    const commandName = colorData.type === 'text' ? 'foreColor' : 'backColor';
    const command: EditorCommand = { name: commandName };

    this.commandService.executeCommand(command, colorData.color);

    this.closeColorPickerDialog();
    this.updateSelectionState();
    this.emitContentChange();
  }

  /**
   * Handle color picker dialog closed event
   */
  onColorPickerDialogClosed(): void {
    this.closeColorPickerDialog();
  }

  /**
   * Close color picker dialog and clean up
   */
  private closeColorPickerDialog(): void {
    if (this.colorPickerDialogRef) {
      this.colorPickerDialogRef.destroy();
      this.colorPickerDialogRef = null;
    }
    this.colorPickerDialogVisible = false;
  }

  /**
   * Show table dialog (lazy loaded)
   */
  private async showTableDialog(): Promise<void> {
    if (this.tableDialogRef) {
      return; // Dialog already open
    }

    try {
      // Set dialog visibility state
      this.tableDialogVisible = true;

      // Benchmark dialog loading
      this.performanceMonitor.startBenchmark('tableDialogLoad');

      // Lazy load the table dialog component
      this.tableDialogRef = await this.lazyLoaderService.loadDialogComponent('table', this.dialogContainer);

      this.performanceMonitor.endBenchmark('tableDialogLoad');

      if (this.tableDialogRef) {
        // Check if we're editing an existing table
        const tableData = this.commandService.getTableProperties();

        if (tableData) {
          this.currentTableData = tableData;
          this.isEditingTable = true;
        } else {
          this.currentTableData = null;
          this.isEditingTable = false;
        }

        // Set component inputs
        this.tableDialogRef.instance.isOpen = true;
        this.tableDialogRef.instance.editMode = this.isEditingTable;
        this.tableDialogRef.instance.initialData = this.currentTableData;

        // Subscribe to component outputs
        this.tableDialogRef.instance.insert.subscribe((tableData: TableData) => {
          this.onTableInserted(tableData);
        });

        this.tableDialogRef.instance.cancel.subscribe(() => {
          this.onTableDialogClosed();
        });
      }
    } catch (error) {
      console.error('Failed to load table dialog:', error);
      this.tableDialogVisible = false;
    }
  }

  /**
   * Handle table insertion/update
   */
  onTableInserted(tableData: TableData): void {
    if (this.isEditingTable) {
      this.commandService.updateTableProperties(tableData);
    } else if (this.isInsertingNestedTable) {
      // Insert nested table into active cell
      if (this.editorContent?.nestedTableService) {
        const success = this.editorContent.nestedTableService.insertNestedTable(tableData);
        if (success) {
          console.log('Nested table inserted successfully');
          // Trigger content update
          setTimeout(() => {
            if (this.editorContent?.contentArea?.nativeElement) {
              this.content = this.editorContent.contentArea.nativeElement.innerHTML;
              this.onChange(this.content);
              this.contentChange.emit(this.content);
            }
          }, 10);
        } else {
          console.error('Failed to insert nested table - no active cell');
        }
      }
      this.isInsertingNestedTable = false;
    } else {
      // Build the table HTML string
      const tableHtml = this.buildTableHtml(tableData);

      if (this.isHtmlMode) {
        // HTML mode: Update the textarea content
        const currentContent = this.content || '';
        const newContent = currentContent + (currentContent ? '\n' : '') + tableHtml + '\n<p><br></p>';

        // Update content model
        this.content = newContent;
        this.onChange(newContent);
        this.contentChange.emit(newContent);

        // Force update the textarea after a short delay to ensure it's rendered
        setTimeout(() => {
          if (this.editorContent?.htmlTextarea?.nativeElement) {
            this.editorContent.htmlTextarea.nativeElement.value = newContent;
          }
        }, 0);
      } else {
        // Visual mode: Use the editor content component's insertContent method
        if (this.editorContent) {
          // Focus the editor first to ensure proper cursor position
          this.editorContent.focusElement();
          
          // Small delay to ensure focus is set
          setTimeout(() => {
            // Insert table with proper spacing
            const tableWithSpacing = '<br>' + tableHtml + '<br><p><br></p>';
            this.editorContent.insertContent(tableWithSpacing);
            
            // Update content model from the editor
            setTimeout(() => {
              if (this.editorContent?.contentArea?.nativeElement) {
                this.content = this.editorContent.contentArea.nativeElement.innerHTML;
                this.onChange(this.content);
                this.contentChange.emit(this.content);
              }
            }, 10);
          }, 10);
        }
      }
    }

    this.closeTableDialog();
    setTimeout(() => {
      this.updateSelectionState();
    }, 50);
  }

  /**
   * Build table HTML from table data
   */
  private buildTableHtml(tableData: TableData): string {
    let html = '<table';

    // Add attributes
    if (tableData.border !== undefined) {
      html += ` border="${tableData.border}"`;
    }
    if (tableData.cellPadding !== undefined) {
      html += ` cellpadding="${tableData.cellPadding}"`;
    }
    if (tableData.cellSpacing !== undefined) {
      html += ` cellspacing="${tableData.cellSpacing}"`;
    }

    // Add styles
    let styles = 'border-collapse: collapse;';
    if (tableData.width) {
      styles += ` width: ${tableData.width};`;
    }
    if (tableData.align) {
      if (tableData.align === 'center') {
        styles += ' margin-left: auto; margin-right: auto;';
      } else if (tableData.align === 'right') {
        styles += ' margin-left: auto; margin-right: 0;';
      }
    }
    if (!tableData.border) {
      styles += ' border: 1px solid #ddd;';
    }

    html += ` style="${styles}"`;

    if (tableData.cssClass) {
      html += ` class="${tableData.cssClass}"`;
    }

    html += '><tbody>';

    // Create rows
    for (let i = 0; i < tableData.rows; i++) {
      html += '<tr>';

      // Create cells
      for (let j = 0; j < tableData.columns; j++) {
        const cellTag = tableData.hasHeader && i === 0 ? 'th' : 'td';
        let cellStyle = 'border: 1px solid #ddd; padding: 8px; min-width: 50px; min-height: 30px;';

        if (tableData.hasHeader && i === 0) {
          cellStyle += ' font-weight: bold; background-color: #f5f5f5;';
        }

        html += `<${cellTag} style="${cellStyle}">&nbsp;</${cellTag}>`;
      }

      html += '</tr>';
    }

    html += '</tbody></table>';

    return html;
  }

  /**
   * Handle table dialog closed event
   */
  onTableDialogClosed(): void {
    this.closeTableDialog();
  }

  /**
   * Close table dialog and clean up
   */
  private closeTableDialog(): void {
    if (this.tableDialogRef) {
      this.tableDialogRef.destroy();
      this.tableDialogRef = null;
    }
    this.tableDialogVisible = false;
    this.currentTableData = null;
    this.isEditingTable = false;
    this.isInsertingNestedTable = false;
  }

  /**
   * Handle content changes from editor (debounced)
   */
  onContentChange(content: string): void {
    this.content = content;
    this.onChange(content);
    this.emitContentChange();
  }

  /**
   * Private method for content change handling with debouncing
   */
  private emitContentChange(): void {
    // Detect if content has actually changed
    if (this.hasContentChanged()) {
      // Emit to debounce service for internal processing
      this.debounceService.emitContentChange(this.content);

      // Also emit directly to parent components with debouncing
      this.debouncedContentChange(this.content);

      // Update last known content for change detection
      this.updateLastKnownContent();
    }
  }

  /**
   * Check if content has changed since last emission
   */
  private hasContentChanged(): boolean {
    return this.content !== this.lastKnownContent;
  }

  /**
   * Update the last known content for change detection
   */
  private updateLastKnownContent(): void {
    this.lastKnownContent = this.content;
  }

  /**
   * Handle selection changes from editor
   */
  onSelectionChange(selection: SelectionState): void {
    // Add HTML mode state to selection
    this.currentSelection = {
      ...selection,
      htmlMode: this.isHtmlMode
    } as any;
    if (this.currentSelection) {
      this.selectionChange.emit(this.currentSelection);
    }
  }

  /**
   * Handle blur events from editor content
   */
  onBlur(event: FocusEvent): void {
    this.onTouched();
  }



  /**
   * Update selection state
   */
  private updateSelectionState(): void {
    const selection = this.selectionService.saveSelection();
    if (selection) {
      this.onSelectionChange(selection);
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            this.showLinkDialog();
            break;
          case 'b':
            event.preventDefault();
            this.executeCommand({ name: 'bold' });
            break;
          case 'i':
            event.preventDefault();
            this.executeCommand({ name: 'italic' });
            break;
          case 'u':
            event.preventDefault();
            this.executeCommand({ name: 'underline' });
            break;
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              this.executeCommand({ name: 'redo' });
            } else {
              event.preventDefault();
              this.executeCommand({ name: 'undo' });
            }
            break;
          case 'y':
            event.preventDefault();
            this.executeCommand({ name: 'redo' });
            break;
        }
      }
    });
  }

  /**
   * Get default toolbar configuration
   */
  private getDefaultToolbarConfig(): ToolbarConfig {
    return {
      tools: [
        { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
        { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
        { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
        { type: 'button', command: 'strikethrough', icon: 'strikethrough', label: 'Strikethrough' },
        {
          type: 'dropdown',
          command: 'fontSize',
          icon: 'fontSize',
          label: 'Font Size',
          options: [
            { value: '12px', label: '12px' },
            { value: '14px', label: '14px' },
            { value: '16px', label: '16px' },
            { value: '18px', label: '18px' },
            { value: '20px', label: '20px' },
            { value: '24px', label: '24px' }
          ]
        },
        { type: 'button', command: 'justifyLeft', icon: 'justifyLeft', label: 'Align Left' },
        { type: 'button', command: 'justifyCenter', icon: 'justifyCenter', label: 'Align Center' },
        { type: 'button', command: 'justifyRight', icon: 'justifyRight', label: 'Align Right' },
        { type: 'button', command: 'justifyFull', icon: 'justifyFull', label: 'Justify' },
        { type: 'button', command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List' },
        { type: 'button', command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
        { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link' },
        { type: 'dialog', command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
        { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
        { type: 'button', command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' },
        { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
        { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
      ]
    };
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    this.content = value || '';
    this.lastKnownContent = this.content;
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

  /**
   * Preload critical assets for better performance
   */
  private preloadCriticalAssets(): void {
    // Preload common toolbar icons (if using external icons)
    const commonIcons = [
      'bold', 'italic', 'underline', 'strikethrough',
      'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
      'insertUnorderedList', 'insertOrderedList',
      'createLink', 'insertImage', 'undo', 'redo'
    ];

    // This would preload actual icon assets in a real implementation
    commonIcons.forEach(icon => {
      // Example: this.assetOptimizer.preloadAsset(`/assets/icons/${icon}.svg`, 'image');
    });

    // Load critical CSS
    const criticalCSS = `
      .wysiwyg-editor { position: relative; }
      .wysiwyg-toolbar { display: flex; gap: 4px; padding: 8px; }
      .wysiwyg-content { min-height: 200px; padding: 12px; }
    `;

    this.assetOptimizer.loadCriticalCSS(criticalCSS, '', 'wysiwyg-critical');
  }

  /**
   * Get performance metrics for debugging
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.exportPerformanceData();
  }
}