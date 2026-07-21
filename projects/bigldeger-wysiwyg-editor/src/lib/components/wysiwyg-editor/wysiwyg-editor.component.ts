import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef, ViewContainerRef, ComponentRef, ViewChild, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ToolbarComponent } from '../toolbar/toolbar.component';
import { EditorContentComponent } from '../editor-content/editor-content.component';
import { LinkData } from '../dialogs/link-dialog/link-dialog.component';
import {
  ImageData,
  ImageUploadConfig,
  createImageUploadConfig,
  createImageUploadHandler,
  validateImageUploadConfig
} from '../../models/image.interface';
import { VideoData, VideoUploadConfig, buildVideoEmbedHtml } from '../../models/video.interface';
import { TableData } from '../../models/table.interface';
import { LazyLoaderService } from '../../services/lazy-loader.service';
import { DebounceService } from '../../services/debounce.service';
import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { AssetOptimizerService } from '../../services/asset-optimizer.service';

import { ToolbarConfig, ToolbarTool } from '../../models/toolbar.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionState } from '../../models/selection-state.interface';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { getToolbarIconMarkup } from '../toolbar/toolbar-icons';
import { PasteConfig } from '../../models/editor-config.interface';

/**
 * Main WYSIWYG Editor Component
 */
@Component({
  selector: 'wysiwyg-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarComponent, EditorContentComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WysiwygEditorComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="wysiwyg-editor"
      [class.wysiwyg-editor--readonly]="readonly"
      [class.wysiwyg-editor--fullscreen]="isFullscreen">
      <div *ngIf="showModeToggleInChrome" class="wysiwyg-editor__chrome">
        <div class="wysiwyg-editor__chrome-meta">
          <span class="wysiwyg-editor__chrome-label">Editor Mode</span>
          <span class="wysiwyg-editor__chrome-value">{{ isHtmlMode ? 'HTML' : 'Visual' }}</span>
        </div>

        <button
          type="button"
          class="wysiwyg-editor__mode-toggle"
          [class.wysiwyg-editor__mode-toggle--active]="isHtmlMode"
          [disabled]="readonly"
          [attr.aria-pressed]="isHtmlMode"
          [attr.aria-label]="getModeToggleTitle()"
          [attr.data-tooltip]="getModeToggleTitle()"
          (click)="onModeToggleClick()">
          <span
            class="wysiwyg-editor__mode-toggle-icon"
            [innerHTML]="getSafeModeToggleIcon()"
            aria-hidden="true">
          </span>
          <span class="wysiwyg-editor__mode-toggle-text">{{ getModeToggleLabel() }}</span>
        </button>
      </div>

      <div *ngIf="visibleToolbarConfig.tools.length > 0" class="wysiwyg-editor__toolbar-shell">
        <wysiwyg-toolbar
          [config]="visibleToolbarConfig"
          [disabled]="readonly"
          [selectionState]="currentSelection"
          (command)="handleCommand($event)">
        </wysiwyg-toolbar>
      </div>
      
      <div class="wysiwyg-editor__content-shell">
        <div class="wysiwyg-editor__content-frame">
          <wysiwyg-editor-content
            [content]="content"
            [placeholder]="placeholder"
            [readonly]="readonly"
            [height]="getEditorContentHeight()"
            [minHeight]="getEditorContentMinHeight()"
            [maxHeight]="getEditorContentMaxHeight()"
            [htmlMode]="isHtmlMode"
            [pasteConfig]="pasteConfig"
            (contentChange)="onContentChange($event)"
            (selectionChange)="onSelectionChange($event)"
            (blurEvent)="onBlur($event)">
          </wysiwyg-editor-content>
        </div>
      </div>

      <div *ngIf="showCharCounter" class="wysiwyg-editor__footer">
        <span class="wysiwyg-editor__footer-label">Characters</span>
        <span
          class="wysiwyg-editor__footer-count"
          [class.wysiwyg-editor__footer-count--warning]="isCharacterLimitNear()"
          [class.wysiwyg-editor__footer-count--danger]="isCharacterLimitExceeded()">
          {{ characterCount }}
          <ng-container *ngIf="maxCharacters !== null"> / {{ maxCharacters }}</ng-container>
        </span>
      </div>

      <!-- Dynamic dialog container -->
      <ng-container #dialogContainer></ng-container>

      <!-- Video resize popup -->
      <div
        *ngIf="videoResizePopup.visible"
        class="wysiwyg-video-resize-popup"
        [style.top.px]="videoResizePopup.top"
        [style.left.px]="videoResizePopup.left"
        (click)="$event.stopPropagation()"
        (mousedown)="$event.stopPropagation()">
        <span class="wvr-label">W</span>
        <input class="wvr-input" type="number" [(ngModel)]="videoResizePopup.width" min="1">
        <span class="wvr-sep">×</span>
        <span class="wvr-label">H</span>
        <input class="wvr-input" type="number" [(ngModel)]="videoResizePopup.height" min="1">
        <span class="wvr-unit">px</span>
        <button type="button" class="wvr-btn wvr-btn--apply" (click)="applyVideoResize()">Apply</button>
        <button type="button" class="wvr-btn wvr-btn--cancel" (click)="closeVideoResizePopup()" aria-label="Close">✕</button>
      </div>
    </div>
  `,
  styleUrls: ['./wysiwyg-editor.component.scss']
})
export class WysiwygEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() height = '300px';
  @Input() minHeight = '100px';
  @Input() maxHeight = '600px';
  @Input() showCharCounter = false;
  @Input() maxCharacters: number | null = null;

  @Input()
  set toolbarConfig(value: ToolbarConfig | null) {
    this._toolbarConfig = value || this.getDefaultToolbarConfig();
    this.visibleToolbarConfig = this.createVisibleToolbarConfig(this._toolbarConfig);
    this.showModeToggleInChrome = this.hasModeToggleTool(this._toolbarConfig);
  }

  get toolbarConfig(): ToolbarConfig {
    return this._toolbarConfig;
  }

  @Input()
  set imageUpload(value: ImageUploadConfig | null) {
    this._imageUpload = this.normalizeImageUploadConfig(value);
  }

  get imageUpload(): ImageUploadConfig {
    return this._imageUpload;
  }

  /** Optional media-library handler for the video Upload tab. */
  @Input() videoUpload?: VideoUploadConfig | null;

  /**
   * Optional paste-handling configuration forwarded to the editor content
   * component. Controls how content pasted from external sources is cleaned
   * and which inline styles / classes are preserved. See {@link PasteConfig}.
   */
  @Input() pasteConfig?: PasteConfig | null;

  @Output() contentChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectionState>();
  /** Emitted once after each new table is inserted (not when editing an existing table). */
  @Output() tableInserted = new EventEmitter<void>();

  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;
  @ViewChild(EditorContentComponent) editorContent!: EditorContentComponent;

  private _toolbarConfig: ToolbarConfig = this.getDefaultToolbarConfig();
  private _imageUpload: ImageUploadConfig = createImageUploadConfig();
  content = '';
  characterCount = 0;
  currentSelection: SelectionState | null = null;
  isHtmlMode = false;
  isFullscreen = false;
  visibleToolbarConfig: ToolbarConfig = this.createVisibleToolbarConfig(this._toolbarConfig);
  showModeToggleInChrome = this.hasModeToggleTool(this._toolbarConfig);

  // Video resize popup state
  videoResizePopup: {
    visible: boolean;
    top: number;
    left: number;
    width: number;
    height: number;
    targetElement: HTMLElement | null;
  } = { visible: false, top: 0, left: 0, width: 640, height: 360, targetElement: null };
  private _boundVideoClick!: (e: MouseEvent) => void;
  private _boundCloseResize!: (e: MouseEvent) => void;

  // Content change detection
  private lastKnownContent = '';

  // Dialog visibility state
  linkDialogVisible = false;
  imageDialogVisible = false;
  videoDialogVisible = false;
  tableDialogVisible = false;

  // Dialog state
  private linkDialogRef: ComponentRef<any> | null = null;
  private imageDialogRef: ComponentRef<any> | null = null;
  private videoDialogRef: ComponentRef<any> | null = null;
  private tableDialogRef: ComponentRef<any> | null = null;
  private emoticonsDialogRef: ComponentRef<any> | null = null;
  private specialCharsDialogRef: ComponentRef<any> | null = null;
  private embedsDialogRef: ComponentRef<any> | null = null;
  private fileUploadDialogRef: ComponentRef<any> | null = null;
  private bookmarkDialogRef: ComponentRef<any> | null = null;
  private currentLinkData: LinkData | null = null;
  private isEditingLink = false;
  private currentImageData: ImageData | null = null;
  private isEditingImage = false;
  private currentVideoData: VideoData | null = null;
  private isEditingVideo = false;
  private currentTableData: TableData | null = null;
  private isEditingTable = false;
  private isInsertingNestedTable = false;
  private pendingDialogSelection: SelectionState | null = null;
  // Persists the last non-collapsed (actual text) selection across blur/focus events.
  // Used as a final fallback in nested Material Dialog scenarios where CDK focus
  // management may clear the active browser selection before command handlers run.
  private lastNonCollapsedSelection: SelectionState | null = null;
  private previousBodyOverflow = '';
  private boundFullscreenKeydownHandler!: (event: KeyboardEvent) => void;

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
    private assetOptimizer: AssetOptimizerService,
    private sanitizer: DomSanitizer
  ) {
    // Initialize debounced content change handler.
    // Keep at 150 ms — short enough to feel responsive, long enough to avoid
    // flooding parent components on every keystroke.
    this.debouncedContentChange = this.debounceService.debounce(
      (content: string) => {
        this.contentChange.emit(content);
      },
      150
    );
  }

  ngOnInit(): void {
    // Start performance monitoring
    this.performanceMonitor.startBenchmark('componentInit');

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // NOTE: The debouncedContentChange function (created in the constructor) already
    // emits contentChange after 150 ms. The debounceService.debouncedContentChange$
    // subscription was removed to prevent the event from being emitted twice — once
    // via debouncedContentChange and once via the service subject — causing double
    // updates and extra latency for consumers.

    // Preload critical assets
    this.preloadCriticalAssets();

    // End component initialization benchmark
    this.performanceMonitor.endBenchmark('componentInit');

    // Start performance monitoring
    this.performanceMonitor.startMonitoring();
    
    // Listen for nested table insertion events
    document.addEventListener('insert-nested-table', this.handleNestedTableRequest.bind(this));

    this.boundFullscreenKeydownHandler = this.handleFullscreenKeydown.bind(this);
    document.addEventListener('keydown', this.boundFullscreenKeydownHandler);

    // Set up video-click listener for the resize popup (delegated on document)
    this._boundVideoClick = this.onEditorVideoClick.bind(this);
    this._boundCloseResize = this.onDocumentClickCloseResize.bind(this);
    document.addEventListener('click', this._boundVideoClick, true);
    document.addEventListener('click', this._boundCloseResize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up dialog references
    this.closeLinkDialog();
    this.closeImageDialog();
    this.closeVideoDialog();
    this.closeTableDialog();
    this.closeEmoticonsDialog();
    this.closeSpecialCharsDialog();
    this.closeEmbedsDialog();
    this.closeFileUploadDialog();
    this.closeBookmarkDialog();

    // Remove nested table event listener
    document.removeEventListener('insert-nested-table', this.handleNestedTableRequest.bind(this));
    document.removeEventListener('keydown', this.boundFullscreenKeydownHandler);
    document.removeEventListener('click', this._boundVideoClick, true);
    document.removeEventListener('click', this._boundCloseResize);

    this.applyFullscreenState(false);

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

  // ─── Video resize popup ─────────────────────────────────────────────────────

  /**
   * Capture-phase click listener: detects clicks on .wysiwyg-video-embed elements
   * that live inside the editor content area, then shows the resize popup.
   */
  private onEditorVideoClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    // Walk up to find the closest .wysiwyg-video-embed wrapper
    const embed = target.closest('.wysiwyg-video-embed') as HTMLElement | null;
    if (!embed) { return; }

    // Make sure it belongs to this editor instance
    const editorEl = this.editorContent?.contentArea?.nativeElement as HTMLElement | undefined;
    if (!editorEl || !editorEl.contains(embed)) { return; }

    // Read current size from the inner media element (<video> or <iframe>)
    const media = embed.querySelector('video, iframe') as HTMLElement | null;
    const currentW = media ? (parseInt(media.getAttribute('width') || '0', 10) || media.offsetWidth || 640) : 640;
    const currentH = media ? (parseInt(media.getAttribute('height') || '0', 10) || media.offsetHeight || 360) : 360;

    // Position the popup just below the embed element
    const rect = embed.getBoundingClientRect();
    const editorRect = (this.editorContent.contentArea.nativeElement as HTMLElement)
      .closest('.wysiwyg-editor')!.getBoundingClientRect();

    this.videoResizePopup = {
      visible: true,
      top: rect.bottom - editorRect.top + 6,
      left: Math.max(0, rect.left - editorRect.left),
      width: currentW,
      height: currentH,
      targetElement: embed
    };

    e.stopPropagation();
  }

  /** Close the resize popup when clicking anywhere outside it. */
  private onDocumentClickCloseResize(e: MouseEvent): void {
    if (!this.videoResizePopup.visible) { return; }
    const popup = (e.target as HTMLElement).closest('.wysiwyg-video-resize-popup');
    if (!popup) { this.closeVideoResizePopup(); }
  }

  closeVideoResizePopup(): void {
    this.videoResizePopup = { ...this.videoResizePopup, visible: false, targetElement: null };
  }

  /**
   * Apply the new width/height to the selected video element in the DOM
   * and sync the editor content.
   */
  applyVideoResize(): void {
    const embed = this.videoResizePopup.targetElement;
    if (!embed) { return; }

    const w = Math.max(1, this.videoResizePopup.width);
    const h = Math.max(1, this.videoResizePopup.height);
    const media = embed.querySelector('video, iframe') as HTMLElement | null;
    if (media) {
      media.setAttribute('width', String(w));
      media.setAttribute('height', String(h));
      (media as any).style.width = `${w}px`;
      (media as any).style.height = `${h}px`;
    }

    // Sync updated HTML back to the editor model
    if (this.editorContent?.contentArea?.nativeElement) {
      this.content = this.editorContent.contentArea.nativeElement.innerHTML;
      this.syncCharacterCount();
      this.onChange(this.content);
      this.contentChange.emit(this.content);
    }

    this.closeVideoResizePopup();
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
      case 'insertVideo':
        this.showVideoDialog();
        break;
      case 'insertTable':
        this.showTableDialog(command.options?.params?.['anchorRect'] ?? null);
        break;
      case 'fontColor':
      case 'backgroundColor':
        // Handled inline by the toolbar component's color picker popover.
        break;
      case 'toggleHtmlView':
        this.toggleHtmlView();
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'insertHR':
        this.executeInsertHR();
        break;
      case 'emoticons':
        this.showEmoticonsDialog();
        break;
      case 'insertBookmark':
        this.showBookmarkDialog();
        break;
      case 'specialCharacters':
        this.showSpecialCharsDialog();
        break;
      case 'embeds':
        this.showEmbedsDialog();
        break;
      case 'uploadFile':
        this.showFileUploadDialog();
        break;
      default:
        this.executeCommand(command);
        break;
    }
  }

  /**
   * Toggle between HTML and visual editing mode
   */
  onModeToggleClick(): void {
    this.toggleHtmlView();
  }

  private toggleHtmlView(): void {
    this.isHtmlMode = !this.isHtmlMode;
    // Update selection state to reflect the new HTML mode
    this.updateSelectionState();
  }

  private toggleFullscreen(): void {
    this.applyFullscreenState(!this.isFullscreen);
    this.updateSelectionState();

    setTimeout(() => {
      this.editorContent?.focusElement();
    }, 0);
  }

  getModeToggleLabel(): string {
    return this.isHtmlMode ? 'Switch To Visual' : 'View HTML';
  }

  getModeToggleTitle(): string {
    return this.isHtmlMode ? 'Switch to Visual Mode' : 'View HTML Code';
  }

  getSafeModeToggleIcon(): SafeHtml {
    const icon = this.isHtmlMode ? getToolbarIconMarkup('eye') : getToolbarIconMarkup('code');
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  /**
   * Execute a formatting command
   */
  private executeCommand(command: EditorCommand): void {
    this.restoreEditorSelection();

    // Route DOM-mutating style commands through editor-content so
    // updateContentFromDOM runs after the DOM mutation. Without this,
    // the change can look applied live but never reach ngModel, so it is
    // lost when the host saves and reloads the editor value.
    if (command.name === 'fontSize') {
      this.editorContent?.setFontSize(command.value ?? '');
      setTimeout(() => {
        this.updateSelectionState();
      }, 0);
      return;
    }

    if (command.name === 'lineHeight') {
      this.editorContent?.setLineHeight(command.value ?? '');
      setTimeout(() => {
        this.updateSelectionState();
      }, 0);
      return;
    }

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
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;
      this.restoreEditorSelection(savedSelection);

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
          const selectedText = savedSelection?.selectedText || this.selectionService.getSelection()?.toString() || '';

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
    this.restoreEditorSelection(this.pendingDialogSelection);

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
    this.restoreEditorSelection(this.pendingDialogSelection || this.getEditorSelectionSnapshot());

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
    this.pendingDialogSelection = null;
  }

  /**
   * Show image dialog (lazy loaded)
   */
  private async showImageDialog(): Promise<void> {
    if (this.imageDialogRef) {
      return; // Dialog already open
    }

    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;
      this.restoreEditorSelection(savedSelection);

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
        this.applyImageDialogConfig(this.imageDialogRef.instance);
        this.imageDialogRef.changeDetectorRef.detectChanges();

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
   * Show video dialog (lazy loaded).
   */
  private async showVideoDialog(): Promise<void> {
    if (this.videoDialogRef) {
      return;
    }

    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;
      this.restoreEditorSelection(savedSelection);

      this.videoDialogVisible = true;
      this.currentVideoData = null;
      this.isEditingVideo = false;

      this.performanceMonitor.startBenchmark('videoDialogLoad');
      this.videoDialogRef = await this.lazyLoaderService.loadDialogComponent('video', this.dialogContainer);
      this.performanceMonitor.endBenchmark('videoDialogLoad');

      if (this.videoDialogRef) {
        this.videoDialogRef.instance.visible = true;
        this.videoDialogRef.instance.videoData = this.currentVideoData;
        this.videoDialogRef.instance.isEditing = this.isEditingVideo;
        // Pass the media-library handler if configured
        if (this.videoUpload?.handler) {
          this.videoDialogRef.instance.uploadHandler = this.videoUpload.handler;
        }

        // Force change detection so the *ngIf="visible" renders immediately
        // after the component is dynamically inserted into the view.
        if (this.videoDialogRef.instance.cdr) {
          this.videoDialogRef.instance.cdr.detectChanges();
        }

        this.videoDialogRef.instance.videoCreated.subscribe((videoData: VideoData) => {
          this.onVideoCreated(videoData);
        });

        this.videoDialogRef.instance.dialogClosed.subscribe(() => {
          this.onVideoDialogClosed();
        });
      }
    } catch (error) {
      console.error('Failed to load video dialog:', error);
      this.videoDialogVisible = false;
    }
  }

  /**
   * Handle image creation/update
   */
  onImageCreated(imageData: ImageData): void {
    this.restoreEditorSelection(this.pendingDialogSelection);

    if (this.isEditingImage) {
      this.commandService.updateImage(imageData);
    } else {
      this.commandService.insertImage(imageData);
    }

    this.updateSelectionState();
    this.emitContentChange();
  }

  /**
   * Handle video insertion.
   */
  onVideoCreated(videoData: VideoData): void {
    const videoHtml = buildVideoEmbedHtml(videoData);
    if (!videoHtml) {
      this.closeVideoDialog();
      return;
    }

    if (this.isHtmlMode) {
      this.insertHtmlModeContent(videoHtml);
      this.closeVideoDialog();
      this.updateSelectionState();
      return;
    }

    this.restoreEditorSelection(this.pendingDialogSelection);

    if (this.editorContent) {
      this.editorContent.insertContent(videoHtml);

      setTimeout(() => {
        if (this.editorContent?.contentArea?.nativeElement) {
          this.content = this.editorContent.contentArea.nativeElement.innerHTML;
          this.syncCharacterCount();
          this.onChange(this.content);
          this.contentChange.emit(this.content);
        }
        this.updateSelectionState();
      }, 10);
    } else {
      const success = this.commandService.insertVideo(videoData);
      if (success) {
        this.updateSelectionState();
        this.emitContentChange();
      }
    }

    this.closeVideoDialog();
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
    this.restoreEditorSelection(this.pendingDialogSelection || this.getEditorSelectionSnapshot());

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
    this.pendingDialogSelection = null;
  }

  /**
   * Handle video dialog closed event.
   */
  onVideoDialogClosed(): void {
    this.closeVideoDialog();
  }

  /**
   * Close video dialog and clean up.
   */
  private closeVideoDialog(): void {
    if (this.videoDialogRef) {
      this.videoDialogRef.destroy();
      this.videoDialogRef = null;
    }
    this.videoDialogVisible = false;
    this.currentVideoData = null;
    this.isEditingVideo = false;
    this.pendingDialogSelection = null;
  }

  /**
   * Show table dialog (lazy loaded)
   */
  private async showTableDialog(anchorRect?: DOMRect | null): Promise<void> {
    if (this.tableDialogRef) {
      return; // Dialog already open
    }

    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;
      this.restoreEditorSelection(savedSelection);

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
        this.tableDialogRef.instance.anchorRect = anchorRect ?? null;

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
    this.restoreEditorSelection(this.pendingDialogSelection);

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
              this.syncCharacterCount();
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
        this.syncCharacterCount();
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
          const tableWithSpacing = '<br>' + tableHtml + '<br><p><br></p>';
          this.editorContent.insertContent(tableWithSpacing);

          setTimeout(() => {
            if (this.editorContent?.contentArea?.nativeElement) {
              this.content = this.editorContent.contentArea.nativeElement.innerHTML;
              this.syncCharacterCount();
              this.onChange(this.content);
              this.contentChange.emit(this.content);
              this.tableInserted.emit();
            }
          }, 10);
        }
      }
      // Notify listeners about new table insertion (not editing, not nested)
      if (this.isHtmlMode) {
        this.tableInserted.emit();
      }
    }

    this.closeTableDialog();
    setTimeout(() => {
      this.updateSelectionState();
    }, 50);
  }
  private insertHtmlModeContent(html: string): void {
    const currentContent = this.content || '';
    const newContent = currentContent + (currentContent ? '\n' : '') + html;

    this.content = newContent;
    this.syncCharacterCount();
    this.onChange(newContent);
    this.contentChange.emit(newContent);

    setTimeout(() => {
      if (this.editorContent?.htmlTextarea?.nativeElement) {
        this.editorContent.htmlTextarea.nativeElement.value = newContent;
      }
    }, 0);
  }

  /**
   * Applies the public image upload configuration to the lazy-loaded image dialog.
   */
  private applyImageDialogConfig(dialogInstance: {
    uploadHandler?: (file: File) => Promise<string>;
    allowUrlInput?: boolean;
    allowFileUpload?: boolean;
    maxFileSize?: number;
    supportedFormats?: string[];
    maxWidth?: number;
    maxHeight?: number;
    autoResize?: boolean;
    quality?: number;
  }): void {
    const imageUploadConfig = this.imageUpload;

    dialogInstance.uploadHandler = createImageUploadHandler(imageUploadConfig);
    dialogInstance.allowUrlInput = imageUploadConfig.allowUrlInput;
    dialogInstance.allowFileUpload = imageUploadConfig.allowFileUpload;
    dialogInstance.maxFileSize = imageUploadConfig.maxFileSize;
    dialogInstance.supportedFormats = [...(imageUploadConfig.allowedFormats || [])];
    dialogInstance.maxWidth = imageUploadConfig.maxWidth;
    dialogInstance.maxHeight = imageUploadConfig.maxHeight;
    dialogInstance.autoResize = imageUploadConfig.autoResize;
    dialogInstance.quality = imageUploadConfig.quality;
  }

  /**
   * Validates and normalizes the public image upload config.
   */
  private normalizeImageUploadConfig(config: ImageUploadConfig | null): ImageUploadConfig {
    const nextConfig = config || {};
    const validationResult = validateImageUploadConfig(nextConfig);

    if (!validationResult.isValid) {
      console.warn(
        `Invalid image upload configuration supplied to wysiwyg-editor: ${validationResult.error}. Falling back to defaults.`
      );
      return createImageUploadConfig();
    }

    return createImageUploadConfig(nextConfig);
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
    let styles = 'border-collapse: collapse; table-layout: fixed;';
    if (tableData.width) {
      styles += ` width: ${tableData.width};`;
    } else {
      styles += ' width: 100%;';
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

    // Calculate equal column width percentage
    const colPct = parseFloat((100 / tableData.columns).toFixed(4)) + '%';

    // Create rows
    for (let i = 0; i < tableData.rows; i++) {
      html += '<tr>';

      // Create cells
      for (let j = 0; j < tableData.columns; j++) {
        const cellTag = tableData.hasHeader && i === 0 ? 'th' : 'td';
        let cellStyle = `border: 1px solid #ddd; padding: 8px; width: ${colPct}; min-width: 50px; overflow: hidden; word-wrap: break-word;`;

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
    this.pendingDialogSelection = null;
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
    this.syncCharacterCount();

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
   * Synchronously captures the live browser selection on every left-button mousedown
   * inside this editor component.  Running in the bubble phase — after the toolbar's
   * `preserveSelectionOnMouseDown` has called `event.preventDefault()` — guarantees
   * that focus has not yet moved away and the browser selection is still valid.
   *
   * This is the primary defence for nested Angular Material Dialog scenarios where
   * CDK focus-trap mechanics would otherwise clear the active selection before the
   * `click` / `handleCommand()` handler fires.
   */
  @HostListener('mousedown', ['$event'])
  _syncCaptureSelectionOnMousedown(event: MouseEvent): void {
    if (this.isHtmlMode || event.button !== 0) {
      return;
    }

    const liveSnapshot = this.cloneSelectionState(this.selectionService.saveSelection());
    if (liveSnapshot?.range) {
      this.currentSelection = {
        ...liveSnapshot,
        htmlMode: this.isHtmlMode,
        fullscreenMode: this.isFullscreen
      };
      if (!liveSnapshot.collapsed) {
        this.lastNonCollapsedSelection = this.cloneSelectionState(this.currentSelection);
      }
    }
  }

  /**
   * Handle selection changes from editor
   */
  onSelectionChange(selection: SelectionState): void {
    // Add HTML mode state to selection
    this.currentSelection = {
      ...selection,
      htmlMode: this.isHtmlMode,
      fullscreenMode: this.isFullscreen
    };
    // Track the last actual text selection (non-collapsed) as a persistent fallback.
    // Used by getEditorSelectionSnapshot() when the live selection has been cleared
    // by nested-dialog focus management before a command handler fires.
    if (this.currentSelection.range && !this.currentSelection.collapsed) {
      this.lastNonCollapsedSelection = this.cloneSelectionState(this.currentSelection);
    }
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
      return;
    }

    this.currentSelection = {
      range: null,
      collapsed: true,
      formats: this.currentSelection?.formats || {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '',
        fontFamily: '',
        fontColor: '',
        backgroundColor: '',
        alignment: 'left'
      },
      htmlMode: this.isHtmlMode,
      fullscreenMode: this.isFullscreen
    };
    this.selectionChange.emit(this.currentSelection);
  }

  /**
   * Clone selection state so later restores do not reuse a mutated Range instance.
   */
  private cloneSelectionState(selection: SelectionState | null): SelectionState | null {
    if (!selection) {
      return null;
    }

    return {
      ...selection,
      range: selection.range ? selection.range.cloneRange() : null,
      formats: { ...selection.formats }
    };
  }

  /**
   * Capture the editor's last valid selection, preferring the editor-scoped snapshot over the global selection.
   */
  private getEditorSelectionSnapshot(): SelectionState | null {
    if (this.isHtmlMode) {
      return null;
    }

    const currentSelection = this.cloneSelectionState(this.currentSelection);
    if (currentSelection?.range) {
      return currentSelection;
    }

    const liveSelection = this.cloneSelectionState(this.selectionService.saveSelection());
    if (liveSelection?.range) {
      return liveSelection;
    }

    // Final fallback: use the last known non-collapsed (actual text) selection.
    // This covers nested Material Dialog scenarios where the CDK focus trap or
    // backdrop logic clears the active browser selection before the command handler
    // fires, leaving both currentSelection.range and the live selection as null.
    return this.lastNonCollapsedSelection;
  }

  /**
   * Restore the editor selection before executing toolbar actions or applying dialog results.
   */
  private restoreEditorSelection(selection: SelectionState | null = this.getEditorSelectionSnapshot()): boolean {
    if (this.isHtmlMode || !selection?.range) {
      return false;
    }

    this.editorContent?.focusElement();
    this.selectionService.restoreSelection(selection);
    return true;
  }

  /**
   * Adjusts editor shell state for fullscreen mode and restores body scrolling on exit.
   */
  private applyFullscreenState(nextState: boolean): void {
    if (this.isFullscreen === nextState) {
      return;
    }

    this.isFullscreen = nextState;

    if (nextState) {
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = this.previousBodyOverflow;
    }
  }

  /**
   * Exits fullscreen with Escape for a more editor-like flow.
   */
  private handleFullscreenKeydown(event: KeyboardEvent): void {
    if (!this.isFullscreen || event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    this.applyFullscreenState(false);
    this.updateSelectionState();
  }

  /**
   * Provides a flexible content height that can expand fully in fullscreen mode.
   */
  getEditorContentHeight(): string {
    return this.isFullscreen ? '100%' : this.height;
  }

  getEditorContentMinHeight(): string {
    return this.isFullscreen ? '0' : this.minHeight;
  }

  getEditorContentMaxHeight(): string {
    return this.isFullscreen ? '100%' : this.maxHeight;
  }

  isCharacterLimitNear(): boolean {
    return this.maxCharacters !== null && this.characterCount >= Math.floor(this.maxCharacters * 0.9);
  }

  isCharacterLimitExceeded(): boolean {
    return this.maxCharacters !== null && this.characterCount > this.maxCharacters;
  }

  /**
   * Set up keyboard shortcuts
   *
   * NOTE: Bold (Ctrl+B), Italic (Ctrl+I) and Underline (Ctrl+U) are intentionally
   * NOT handled here. They are already handled by EditorContentComponent.onKeydown
   * which fires first (element-level listener). Adding them here too would cause the
   * command to run twice — toggling the formatting on and then immediately off.
   * Only shortcuts that require actions at the outer shell level (link dialog,
   * undo/redo) are registered on the document.
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Only handle shortcuts when this editor instance is focused.
      if (!this.editorContent?.isFocused) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            this.showLinkDialog();
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
        { type: 'button', command: 'subscript', icon: 'subscript', label: 'Subscript' },
        { type: 'button', command: 'superscript', icon: 'superscript', label: 'Superscript' },
        {
          type: 'dropdown',
          command: 'paragraphFormat',
          label: 'Normal',
          separatorBefore: true,
          options: [
            { value: 'p', label: 'Normal' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' }
          ]
        },
        { type: 'button', command: 'quote', icon: 'quote', label: 'Quote' },
        {
          type: 'dropdown',
          command: 'lineHeight',
          label: 'Line Height',
          options: [
            { value: 'normal', label: 'Normal' },
            { value: '1', label: '1.0' },
            { value: '1.15', label: '1.15' },
            { value: '1.5', label: '1.5' },
            { value: '2', label: '2.0' }
          ]
        },
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
        { type: 'button', command: 'justifyLeft', icon: 'justifyLeft', label: 'Align Left', separatorBefore: true },
        { type: 'button', command: 'justifyCenter', icon: 'justifyCenter', label: 'Align Center' },
        { type: 'button', command: 'justifyRight', icon: 'justifyRight', label: 'Align Right' },
        { type: 'button', command: 'justifyFull', icon: 'justifyFull', label: 'Justify' },
        { type: 'button', command: 'insertUnorderedList', icon: 'insertUnorderedList', label: 'Bullet List', separatorBefore: true },
        { type: 'button', command: 'insertOrderedList', icon: 'insertOrderedList', label: 'Numbered List' },
        { type: 'button', command: 'outdent', icon: 'outdent', label: 'Decrease Indent' },
        { type: 'button', command: 'indent', icon: 'indent', label: 'Increase Indent' },
        { type: 'dialog', command: 'createLink', icon: 'createLink', label: 'Insert Link', separatorBefore: true },
        { type: 'button', command: 'unlink', icon: 'unlink', label: 'Remove Link' },
        { type: 'dialog', command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
        { type: 'dialog', command: 'insertVideo', icon: 'insertVideo', label: 'Insert Video' },
        { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
        { type: 'button', command: 'removeFormat', icon: 'removeFormat', label: 'Clear Formatting', separatorBefore: true },
        { type: 'button', command: 'fullscreen', icon: 'fullscreen', label: 'Fullscreen' },
        { type: 'button', command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View', separatorBefore: true },
        { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
        { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
      ]
    };
  }

  private hasModeToggleTool(config: ToolbarConfig): boolean {
    return config.tools.some(tool => tool.command === 'toggleHtmlView');
  }

  private createVisibleToolbarConfig(config: ToolbarConfig): ToolbarConfig {
    const visibleTools = config.tools.filter(tool => tool.command !== 'toggleHtmlView');

    return {
      ...config,
      tools: this.normalizeLeadingSeparators(visibleTools)
    };
  }

  private normalizeLeadingSeparators(tools: ToolbarTool[]): ToolbarTool[] {
    let firstVisibleFound = false;

    return tools.map(tool => {
      if (!firstVisibleFound) {
        firstVisibleFound = true;
        return tool.separatorBefore ? { ...tool, separatorBefore: false } : tool;
      }

      return tool;
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    this.content = value || '';
    this.lastKnownContent = this.content;
    this.syncCharacterCount();
  }

  /**
   * Programmatically set the editor content, bypassing the focused-state guard
   * so the DOM is updated immediately regardless of whether the editor is focused.
   * Also notifies Angular's ngModel binding of the new value.
   */
  setContent(html: string): void {
    this.content = html;
    this.lastKnownContent = html;
    this.syncCharacterCount();
    // Force DOM update even if the contenteditable is currently focused
    if (this.editorContent) {
      this.editorContent.setContent(html);
    }
    // Notify ngModel/ControlValueAccessor binding
    this.onChange(html);
    this.contentChange.emit(html);
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
      'createLink', 'insertImage', 'insertVideo', 'fullscreen', 'undo', 'redo'
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

  /**
   * Updates the plain-text character count used by the optional footer counter.
   */
  private syncCharacterCount(): void {
    this.characterCount = this.getPlainTextContent(this.content).length;
  }

  /**
   * Converts editor HTML into plain text for char counting without counting markup.
   */
  private getPlainTextContent(content: string): string {
    if (!content) {
      return '';
    }

    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.innerHTML = content;
      return (container.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r?\n/g, '\n');
    }

    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
  }

  // ─────────────────────── Insert HR ───────────────────────

  private executeInsertHR(): void {
    this.restoreEditorSelection();
    this.commandService.executeCommand({ name: 'insertHR' });
    this.updateSelectionState();
    this.emitContentChange();
  }

  // ─────────────────────── Emoticons dialog ─────────────────

  private async showEmoticonsDialog(): Promise<void> {
    if (this.emoticonsDialogRef) { return; }
    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;

      this.emoticonsDialogRef = await this.lazyLoaderService.loadDialogComponent('emoticons', this.dialogContainer);
      if (this.emoticonsDialogRef) {
        this.emoticonsDialogRef.instance.visible = true;
        this.emoticonsDialogRef.instance.emojiSelected.subscribe((emoji: string) => {
          this.onEmojiSelected(emoji);
        });
        this.emoticonsDialogRef.instance.dialogClosed.subscribe(() => {
          this.closeEmoticonsDialog();
        });
      }
    } catch (error) {
      console.error('Failed to load emoticons dialog:', error);
    }
  }

  private onEmojiSelected(emoji: string): void {
    this.restoreEditorSelection(this.pendingDialogSelection);
    this.commandService.insertTextAtCursor(emoji);
    this.updateSelectionState();
    this.emitContentChange();
    this.closeEmoticonsDialog();
  }

  private closeEmoticonsDialog(): void {
    if (this.emoticonsDialogRef) {
      this.emoticonsDialogRef.destroy();
      this.emoticonsDialogRef = null;
    }
    this.pendingDialogSelection = null;
  }

  // ─────────────────────── Special chars dialog ─────────────

  private async showSpecialCharsDialog(): Promise<void> {
    if (this.specialCharsDialogRef) { return; }
    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;

      this.specialCharsDialogRef = await this.lazyLoaderService.loadDialogComponent('specialChars', this.dialogContainer);
      if (this.specialCharsDialogRef) {
        this.specialCharsDialogRef.instance.visible = true;
        this.specialCharsDialogRef.instance.charSelected.subscribe((char: string) => {
          this.onSpecialCharSelected(char);
        });
        this.specialCharsDialogRef.instance.dialogClosed.subscribe(() => {
          this.closeSpecialCharsDialog();
        });
      }
    } catch (error) {
      console.error('Failed to load special chars dialog:', error);
    }
  }

  private onSpecialCharSelected(char: string): void {
    this.restoreEditorSelection(this.pendingDialogSelection);
    this.commandService.insertTextAtCursor(char);
    this.updateSelectionState();
    this.emitContentChange();
    this.closeSpecialCharsDialog();
  }

  private closeSpecialCharsDialog(): void {
    if (this.specialCharsDialogRef) {
      this.specialCharsDialogRef.destroy();
      this.specialCharsDialogRef = null;
    }
    this.pendingDialogSelection = null;
  }

  // ─────────────────────── Embeds dialog ────────────────────

  private async showEmbedsDialog(): Promise<void> {
    if (this.embedsDialogRef) { return; }
    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;

      this.embedsDialogRef = await this.lazyLoaderService.loadDialogComponent('embeds', this.dialogContainer);
      if (this.embedsDialogRef) {
        this.embedsDialogRef.instance.visible = true;
        this.embedsDialogRef.instance.embedInserted.subscribe((url: string) => {
          this.onEmbedInserted(url);
        });
        this.embedsDialogRef.instance.dialogClosed.subscribe(() => {
          this.closeEmbedsDialog();
        });
      }
    } catch (error) {
      console.error('Failed to load embeds dialog:', error);
    }
  }

  private onEmbedInserted(url: string): void {
    const html = `<div class="wysiwyg-embed"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div>`;
    this.restoreEditorSelection(this.pendingDialogSelection);
    this.commandService.insertHtmlAtCursor(html);
    this.updateSelectionState();
    this.emitContentChange();
    this.closeEmbedsDialog();
  }

  private closeEmbedsDialog(): void {
    if (this.embedsDialogRef) {
      this.embedsDialogRef.destroy();
      this.embedsDialogRef = null;
    }
    this.pendingDialogSelection = null;
  }

  // ─────────────────────── File upload dialog ───────────────

  private async showFileUploadDialog(): Promise<void> {
    if (this.fileUploadDialogRef) { return; }
    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;

      this.fileUploadDialogRef = await this.lazyLoaderService.loadDialogComponent('fileUpload', this.dialogContainer);
      if (this.fileUploadDialogRef) {
        this.fileUploadDialogRef.instance.visible = true;
        this.fileUploadDialogRef.instance.fileInserted.subscribe((data: { url: string; filename: string }) => {
          this.onFileInserted(data);
        });
        this.fileUploadDialogRef.instance.dialogClosed.subscribe(() => {
          this.closeFileUploadDialog();
        });
      }
    } catch (error) {
      console.error('Failed to load file upload dialog:', error);
    }
  }

  private onFileInserted(data: { url: string; filename: string }): void {
    const html = `<a href="${data.url}" download>${data.filename}</a>`;
    this.restoreEditorSelection(this.pendingDialogSelection);
    this.commandService.insertHtmlAtCursor(html);
    this.updateSelectionState();
    this.emitContentChange();
    this.closeFileUploadDialog();
  }

  private closeFileUploadDialog(): void {
    if (this.fileUploadDialogRef) {
      this.fileUploadDialogRef.destroy();
      this.fileUploadDialogRef = null;
    }
    this.pendingDialogSelection = null;
  }

  // ─────────────────────── Bookmark dialog ──────────────────

  private async showBookmarkDialog(): Promise<void> {
    if (this.bookmarkDialogRef) { return; }
    try {
      const savedSelection = this.getEditorSelectionSnapshot();
      this.pendingDialogSelection = savedSelection;

      this.bookmarkDialogRef = await this.lazyLoaderService.loadDialogComponent('bookmark', this.dialogContainer);
      if (this.bookmarkDialogRef) {
        this.bookmarkDialogRef.instance.visible = true;
        this.bookmarkDialogRef.instance.bookmarkInserted.subscribe((id: string) => {
          this.onBookmarkInserted(id);
        });
        this.bookmarkDialogRef.instance.dialogClosed.subscribe(() => {
          this.closeBookmarkDialog();
        });
      }
    } catch (error) {
      console.error('Failed to load bookmark dialog:', error);
    }
  }

  private onBookmarkInserted(id: string): void {
    const html = `<a id="${id}" name="${id}"></a>`;
    this.restoreEditorSelection(this.pendingDialogSelection);
    this.commandService.insertHtmlAtCursor(html);
    this.updateSelectionState();
    this.emitContentChange();
    this.closeBookmarkDialog();
  }

  private closeBookmarkDialog(): void {
    if (this.bookmarkDialogRef) {
      this.bookmarkDialogRef.destroy();
      this.bookmarkDialogRef = null;
    }
    this.pendingDialogSelection = null;
  }
}
