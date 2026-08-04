import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
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
import { TableContextMenuService } from '../../services/table-context-menu.service';
import { PasteConfig } from '../../models/editor-config.interface';

const INTERNAL_CLIPBOARD_GRACE_MS = 5000;
const NON_STYLABLE_PASTE_TAGS = new Set([
  'BR',
  'COL',
  'COLGROUP',
  'HR',
  'IMG',
  'INPUT',
  'META',
  'SCRIPT',
  'SOURCE',
  'STYLE',
  'TRACK',
  'VIDEO'
]);

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
      (copy)="onCopy()"
      (cut)="onCut()"
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
export class EditorContentComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor {
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

  /**
   * Optional paste configuration. Controls which inline styles / classes are
   * preserved when content is pasted from external sources (web pages, Word,
   * Google Docs). When omitted, the editor keeps colors, background-colors,
   * font-size and font-family so the pasted block looks like the source.
   */
  @Input() pasteConfig?: PasteConfig | null;

  private _htmlMode = false;
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
  private lastInternalClipboardActivityAt = 0;

  // ControlValueAccessor implementation
  private onChange = (value: string) => { };
  private onTouched = () => { };

  constructor(
    private selectionService: SelectionService,
    private sanitizerService: HTMLSanitizerService,
    private commandService: CommandService,
    private tableHandlerService: TableHandlerService,
    public nestedTableService: NestedTableService,
    public tableContextMenuService: TableContextMenuService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Debounce content changes to avoid excessive emissions.
    // 50 ms keeps the ngModel / ControlValueAccessor value snappy while still
    // batching rapid keystrokes so we don't flood Angular change detection.
    this.contentChangeSubject
      .pipe(
        debounceTime(50),
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

  ngAfterViewInit(): void {
    // initializeContent() called from ngOnInit is a no-op because @ViewChild({ static: false })
    // is not resolved until after view creation. ngOnChanges also skips firstChange, so any
    // content set synchronously before this component rendered (e.g. via [formControl] on the
    // parent WysiwygEditorComponent) would never reach the DOM. Call initializeContent() again
    // here when the contentArea element is finally available.
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

    // Clean up table context menu
    this.tableContextMenuService.cleanup();
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
      // Strip any resize handles that were persisted in saved content, and
      // reset data-resize-initialized so initializeTableHandlers re-attaches
      // event listeners correctly on the freshly rendered DOM.
      this.stripResizeHandles(element);
      this.initializeImageHandlers();
      // Only initialize tables once - they have __resizeInitialized flag
      // This prevents re-initialization when typing in cells
      this.initializeTableHandlers();
    }
  }

  /** Remove all .table-resize-handle elements from the DOM tree and clear the
   *  data-resize-initialized attribute so table handlers re-initialize cleanly. */
  private stripResizeHandles(root: HTMLElement): void {
    root.querySelectorAll('.table-resize-handle').forEach(el => el.remove());
    root.querySelectorAll('table[data-resize-initialized]').forEach(
      el => el.removeAttribute('data-resize-initialized')
    );
  }

  /**
   * Handle HTML mode change
   */
  private onHtmlModeChange(isHtmlMode: boolean): void {
    if (isHtmlMode) {
      // Switching to HTML mode - get content from contentArea and format it
      if (this.contentArea?.nativeElement) {
        const clone = this.contentArea.nativeElement.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.table-resize-handle').forEach(el => el.remove());
        clone.querySelectorAll('table[data-resize-initialized]').forEach(
          el => el.removeAttribute('data-resize-initialized')
        );
        this.content = this.formatHtml(clone.innerHTML);

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
    formatted = formatted.replace(/(<(?:div|p|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|section|article|header|footer|nav|aside|iframe|video)[^>]*>)/g, '\n$1');

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

  onCopy(): void {
    this.markInternalClipboardActivity();
  }

  onCut(): void {
    this.markInternalClipboardActivity();
  }

  onPaste(event: ClipboardEvent): void {
    if (this.readonly) return;

    event.preventDefault();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    let pastedContent = '';
    const shouldApplyConfiguredExternalInlineStyles = !this.hasRecentInternalClipboardActivity();

    // Try to get HTML content first, then fall back to plain text
    if (clipboardData.types.includes('text/html')) {
      pastedContent = clipboardData.getData('text/html');
      // Normalize external-source HTML (Word, Google Docs, web pages) so that
      // the pasted content uses clean, semantic markup rather than vendor-specific
      // inline styles and proprietary elements.
      pastedContent = this.normalizeExternalPasteContent(pastedContent);
      // When pasting inside a table cell, strip table structure so we never
      // create a nested <td> inside an existing <td>.
      if (this.isCursorInsideTableCell()) {
        pastedContent = this.extractCellInnerContent(pastedContent);
      }
    } else {
      // Plain-text paste: convert newlines to <p>/<br> so the new text picks up
      // the editor's default font-family (Georgia) and behaves like typed text.
      const plainText = clipboardData.getData('text/plain');
      pastedContent = this.wrapPlainTextAsParagraphs(plainText);
    }

    // Sanitize the pasted content
    const sanitizedContent = this.sanitizerService.sanitize(pastedContent);
    const contentToInsert = shouldApplyConfiguredExternalInlineStyles
      ? this.applyConfiguredExternalInlineStyles(sanitizedContent)
      : sanitizedContent;

    // Insert the sanitized content at the current cursor position
    this.insertHtmlAtCursor(contentToInsert);

    // Trigger content change
    this.updateContentFromDOM();
  }

  /**
   * Wraps plain text from the clipboard in <p>…</p> blocks (with <br> for
   * intra-paragraph newlines) so it picks up the editor's default font-family
   * (Georgia) and renders as cleanly as text the user typed themselves.
   * Mirrors Froala's behaviour for plain-text pastes.
   */
  private wrapPlainTextAsParagraphs(plainText: string): string {
    if (!plainText) return '';
    const normalized = plainText.replace(/\r\n?/g, '\n');
    const blocks = normalized.split(/\n{2,}/);
    return blocks
      .map(block => {
        const safe = this.escapeHtml(block).replace(/\n/g, '<br>');
        return `<p>${safe}</p>`;
      })
      .join('');
  }

  /**
   * Normalizes HTML pasted from external sources (Microsoft Word, Google Docs,
   * web pages) into clean, semantic markup that looks as close as possible to
   * the source — Froala-style fidelity. The previous version of this function
   * stripped every `background-*`, every color, every font-size and every
   * `class` from pasted content, which collapsed coloured headings and dark
   * backgrounds into a flat blob of overlapping text.
   *
   * Steps performed:
   *  1. Strip Word/Office conditional comments and XML namespaced elements.
   *  2. Remove <head>, <style>, <script> and <meta> blocks that browsers
   *     sometimes include in clipboard HTML.
   *  3. Unwrap <font> tags (the size attribute is meaningless in HTML5; the
   *     face attribute carries the external font that overrides our default
   *     Georgia — but we let consumers decide via `pasteConfig.stripColors`).
   *  4. Convert bold/italic/underline expressed via inline CSS styles on
   *     <span> elements to the corresponding semantic tags.
   *  5. Strip only the genuinely-bad inline-style properties (background-
   *     image, fixed widths/heights, mso-*, vendor prefixes, position,
   *     animations). Keep `background-color`, `color`, `font-size`,
   *     `font-family`, `letter-spacing`, `padding`, `border*` so a coloured
   *     heading on a coloured background survives paste.
   *  6. Unwrap Google-Docs-specific <b id="docs-internal-guid-…"> wrappers.
   *  7. Remove empty paragraph / span elements left behind after cleaning.
   *  8. Drop layout-only attributes (dir, lang, id, align). Keep `class`
   *     only when it matches the consumer-supplied `pasteConfig.classAllowlist`.
   *  9. Cap insanely-large pasted heading font-sizes via
   *     `pasteConfig.maxHeadingFontSizePx` so external `font-size: 96px`
   *     headings don't visually overwhelm the editor.
   */
  private normalizeExternalPasteContent(html: string): string {
    if (!html) return html;

    // 1. Strip Word XML / Office conditional comments
    let cleaned = html
      .replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<xml[\s\S]*?<\/xml>/gi, '')
      .replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '')
      .replace(/<o:[^>]*\/>/gi, '')
      .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '')
      .replace(/<w:[^>]*\/>/gi, '');

    // 2. Strip <head>, <style>, <script>, <meta>, <link> blocks
    cleaned = cleaned
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '');

    // Parse into DOM for structural transformations
    const tmp = document.createElement('div');
    tmp.innerHTML = cleaned;

    // 3. Unwrap <font face="…">…</font> tags — they carry the external font that
    //    overrides the editor's default Georgia. The child nodes are preserved.
    tmp.querySelectorAll('font').forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });

    // 3b. Unwrap empty <span> wrappers (Word emits dozens of these)
    tmp.querySelectorAll('span').forEach(el => {
      const has = el.getAttribute('style');
      if (!has && el.attributes.length === 0 && el.childNodes.length > 0) {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    });

    // 4. Convert inline-style bold/italic/underline spans to semantic tags
    tmp.querySelectorAll('span[style], b[style], em[style], i[style], p[style], div[style], li[style]').forEach(el => {
      const style = (el as HTMLElement).style;

      const isBold = style.fontWeight === 'bold' || style.fontWeight === '700' || parseInt(style.fontWeight) >= 700;
      const isItalic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';
      const isUnderline = style.textDecoration?.includes('underline') ||
                          style.textDecorationLine?.includes('underline');

      if (!isBold && !isItalic && !isUnderline) return; // nothing to convert

      // Move children (not clone) so nested styled elements remain in the live DOM
      // and will still be processed when the querySelectorAll iterator reaches them.
      let inner: Node = document.createDocumentFragment();
      Array.from(el.childNodes).forEach(child => inner.appendChild(child));

      if (isUnderline) {
        const u = document.createElement('u');
        u.appendChild(inner);
        inner = document.createDocumentFragment();
        inner.appendChild(u);
        // Strip the redundant underline property so the wrapper <u> is the sole source of truth
        (el as HTMLElement).style.removeProperty('text-decoration');
        (el as HTMLElement).style.removeProperty('text-decoration-line');
      }
      if (isItalic) {
        const em = document.createElement('em');
        em.appendChild(inner);
        inner = document.createDocumentFragment();
        inner.appendChild(em);
        // Strip the redundant font-style so the wrapper <em> is the sole source of truth
        (el as HTMLElement).style.removeProperty('font-style');
      }
      if (isBold && el.tagName !== 'B' && el.tagName !== 'STRONG') {
        const strong = document.createElement('strong');
        strong.appendChild(inner);
        inner = document.createDocumentFragment();
        inner.appendChild(strong);
        // Strip the redundant font-weight so the wrapper <strong> is the sole source of truth
        (el as HTMLElement).style.removeProperty('font-weight');
      }

      // Children were already moved out; just append the (possibly wrapped) content back.
      el.appendChild(inner);
    });

    // 5. Strip pasted-style junk from inline style attributes — but only the
    //    genuinely-bad properties. Froala's philosophy: keep what the user
    //    chose (text-align, color, background-color, font-size, font-weight,
    //    borders, …) so a coloured heading on a coloured background survives
    //    a paste; drop only the things that always break inside a different
    //    host page (vendor prefixes, mso-* hacks, position/transform hacks,
    //    animations, transitions, opacity/cursor, background-image which is
    //    a tracking-pixel XSS vector).
    //
    //    IMPORTANT: do NOT drop `background`, `background-color`, `font-size`,
    //    `font-family`, `color`, `letter-spacing`, `word-spacing`, `padding`,
    //    `border*`, `text-align`, `line-height` — these are how the source
    //    page communicates visual identity (e.g. a green-coloured finance
    //    heading on a dark-green background). Stripping them collapses the
    //    paste into a default-typed-text blob with severe visual overlap.
    //
    //    Editor defaults (Georgia, transparent background) are applied via CSS
    //    only when an element has no font-family / background of its own — see
    //    editor-content.component.scss and global.scss — so we don't have to
    //    strip them here.
    // Opt-in color stripping: when a consumer explicitly wants the editor's
    // default colour palette (pasteConfig.stripColors === true), drop every
    // background-*, colour- and font-*-colour property so the host's typography
    // wins. By default (no pasteConfig), we keep colours.
    const stylePropsToDropExtra = new Set<string>();
    const stripColors = this.pasteConfig?.stripColors === true;
    if (stripColors) {
      stylePropsToDropExtra.add('background');
      stylePropsToDropExtra.add('background-color');
      stylePropsToDropExtra.add('background-position');
      stylePropsToDropExtra.add('background-repeat');
      stylePropsToDropExtra.add('background-attachment');
      stylePropsToDropExtra.add('background-size');
      stylePropsToDropExtra.add('background-origin');
      stylePropsToDropExtra.add('background-clip');
      stylePropsToDropExtra.add('color');
    }

    const stylePropsToDrop = new Set<string>([
      // Backgrounds — only `background-image` is stripped (XSS vector: tracking
      // pixels, `url(javascript:…)`, remote leaks). Solid `background-color`
      // and the longhand `background-*` positioning properties are kept so a
      // coloured fill on a heading / paragraph survives paste.
      'background-image',
      // Fixed pixel widths/heights — Word/Docs put `width: 300px` on paragraphs
      // and `display: inline-block` on inner spans, which would squeeze the
      // pasted content into a narrow column inside our wider editor surface.
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'animation', 'animation-name', 'animation-duration', 'animation-delay',
      'animation-fill-mode', 'animation-iteration-count', 'animation-direction',
      'animation-play-state', 'animation-timing-function',
      'transition', 'transition-property', 'transition-duration',
      'transition-delay', 'transition-timing-function',
      'filter', 'backdrop-filter', 'mix-blend-mode', 'opacity', 'cursor',
      // Word/Office vendor junk that no host page wants.
      'mso-', 'tab-stops', 'layout-grid', 'layout-grid-mode',
      'layout-grid-type', 'layout-grid-line', 'layout-grid-char',
      'text-align-last', 'text-autospace', 'punctuation-trim',
      'text-justify', 'text-kashida-space', 'text-kashida',
      // Position — Word nests positioned paragraphs for its layout.
      'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'float', 'clear', 'transform', 'transform-origin'
    ]);

    const stylePropsToDropSet = new Set<string>([...stylePropsToDrop, ...stylePropsToDropExtra]);

    tmp.querySelectorAll('[style]').forEach(el => {
      const raw = (el as HTMLElement).getAttribute('style') || '';
      const cleanedStyle = raw
        .split(';')
        .map(rule => rule.trim())
        .filter(rule => {
          if (!rule) return false;
          const prop = rule.split(':')[0].trim().toLowerCase();
          if (!prop) return false;

          if (stylePropsToDropSet.has(prop)) return false;
          // Drop any vendor-prefixed property (-webkit-*, -moz-*, -ms-*, -o-*)
          if (prop.startsWith('-')) return false;
          // Drop mso-* properties (not caught by exact match above in some browsers)
          if (prop.startsWith('mso-')) return false;
          // Drop Word layout-grid-* properties
          if (prop.startsWith('layout-grid')) return false;

          return true;
        })
        .join('; ');
      if (cleanedStyle) {
        (el as HTMLElement).setAttribute('style', cleanedStyle);
      } else {
        (el as HTMLElement).removeAttribute('style');
      }
    });

    // 6. Unwrap Google Docs root wrapper: <b id="docs-internal-guid-…">
    tmp.querySelectorAll('b[id^="docs-internal-guid-"]').forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });

    // 7. Remove empty <p>, <span>, <div> elements (common Word artefacts)
    tmp.querySelectorAll('p, span, div').forEach(el => {
      if (!el.textContent?.trim() && !el.querySelector('img, table, br')) {
        el.remove();
      }
    });

    // 8. Drop layout-only attributes that often come along with pasted
    //    content from rich editors (Word, Docs, web pages). We do not strip
    //    `class` from h1-h6 / blockquote — an external `<h1 class="wise-…">`
    //    can still convey semantic meaning and the inline `style` we kept
    //    in step 5 already carries the visual identity.
    const attributeBlacklist: Record<string, string[]> = {
      'p': ['dir', 'lang', 'id', 'align'],
      'span': ['dir', 'lang', 'id'],
      'div': ['dir', 'lang', 'id', 'align'],
      'li': ['dir', 'lang', 'id'],
      'a': ['id']
    };
    Object.keys(attributeBlacklist).forEach(tag => {
      tmp.querySelectorAll(tag).forEach(el => {
        attributeBlacklist[tag].forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
      });
    });

    // 8b. Class allowlist enforcement. If `pasteConfig.classAllowlist` is set,
    //     keep only those classes (matched exactly or by prefix) on every
    //     element. Without an allowlist, strip classes from every tag to
    //     avoid leaking external framework classes (Tailwind, Bootstrap, …).
    const classAllowlist = this.pasteConfig?.classAllowlist;
    tmp.querySelectorAll('[class]').forEach(el => {
      if (classAllowlist && classAllowlist.length > 0) {
        const classes = (el.getAttribute('class') || '')
          .split(/\s+/)
          .filter(Boolean)
          .filter(c => classAllowlist.some(rule => c === rule || c.startsWith(rule)));
        if (classes.length > 0) {
          el.setAttribute('class', classes.join(' '));
        } else {
          el.removeAttribute('class');
        }
      } else {
        el.removeAttribute('class');
      }
    });

    // 9. Cap insanely-large pasted heading font-sizes. External sources
    //    occasionally use `font-size: 80px` or `120px` on h1 / h2 which
    //    visually overwhelms the editor body. Default cap is 64px.
    const maxHeadingPx = this.pasteConfig?.maxHeadingFontSizePx ?? 64;
    ['H1', 'H2', 'H3'].forEach(tag => {
      tmp.querySelectorAll(tag.toLowerCase()).forEach(el => {
        const htmlEl = el as HTMLElement;
        const fs = parseFloat(htmlEl.style.fontSize || '');
        if (!Number.isNaN(fs) && fs > maxHeadingPx) {
          htmlEl.style.fontSize = `${maxHeadingPx}px`;
        }
      });
    });

    return tmp.innerHTML;
  }

  private markInternalClipboardActivity(): void {
    this.lastInternalClipboardActivityAt = Date.now();
  }

  private hasRecentInternalClipboardActivity(): boolean {
    return Date.now() - this.lastInternalClipboardActivityAt <= INTERNAL_CLIPBOARD_GRACE_MS;
  }

  private applyConfiguredExternalInlineStyles(html: string): string {
    if (!html) {
      return html;
    }

    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    this.applyConfiguredExternalInlineStylesToContainer(tmp);
    return tmp.innerHTML;
  }

  private applyConfiguredExternalInlineStylesToContainer(container: ParentNode): void {
    const styleEntries = this.getConfiguredExternalInlineStyleEntries();
    if (styleEntries.length === 0) {
      return;
    }

    this.wrapOrphanedRootTextNodes(container);

    container.querySelectorAll<HTMLElement>('*').forEach(element => {
      if (NON_STYLABLE_PASTE_TAGS.has(element.tagName)) {
        return;
      }

      styleEntries.forEach(([property, value]) => element.style.setProperty(property, value));
    });
  }

  private wrapOrphanedRootTextNodes(container: ParentNode): void {
    Array.from(container.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) {
        return;
      }

      const wrapper = document.createElement('span');
      wrapper.textContent = node.textContent;
      node.parentNode?.replaceChild(wrapper, node);
    });
  }

  private getConfiguredExternalInlineStyleEntries(): Array<[string, string]> {
    const configuredStyles = this.pasteConfig?.externalInlineStyles;
    if (!configuredStyles) {
      return [];
    }

    if (typeof configuredStyles === 'string') {
      return configuredStyles
        .split(';')
        .map(rule => rule.trim())
        .filter(Boolean)
        .map(rule => {
          const separatorIndex = rule.indexOf(':');
          if (separatorIndex === -1) {
            return ['', ''] as [string, string];
          }

          return [
            this.normalizeCssPropertyName(rule.slice(0, separatorIndex)),
            rule.slice(separatorIndex + 1).trim()
          ] as [string, string];
        })
        .filter(([property, value]) => !!property && !!value);
    }

    return Object.entries(configuredStyles)
      .map(([property, value]) => [this.normalizeCssPropertyName(property), value?.trim() ?? ''] as [string, string])
      .filter(([property, value]) => !!property && !!value);
  }

  private normalizeCssPropertyName(property: string): string {
    const trimmedProperty = property.trim();
    if (!trimmedProperty) {
      return '';
    }

    return trimmedProperty
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .toLowerCase();
  }

  /** Returns true when the current cursor/selection is inside a TD or TH. */
  private isCursorInsideTableCell(): boolean {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName;
        if (tag === 'TD' || tag === 'TH') return true;
        if (tag === 'TABLE' || node === this.contentArea?.nativeElement) return false;
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Given HTML that may contain table markup (e.g. copied from a table cell),
   * extract only the inner content of the cells so that pasting inside an
   * existing cell never creates nested <td> elements.
   */
  private extractCellInnerContent(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    const cells = div.querySelectorAll('td, th');
    if (cells.length === 0) return html;
    const parts: string[] = [];
    cells.forEach(cell => {
      const inner = (cell as HTMLElement).innerHTML.trim();
      if (inner && inner !== '&nbsp;' && inner !== '\u00a0') {
        parts.push(inner);
      }
    });
    return parts.length > 0 ? parts.join(' ') : html;
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

    // Detect mouse-drag selection of multiple table cells (enables Merge Cells)
    this.tableContextMenuService.handleMouseUpSelection(event);
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

    // Check if clicking inside a table cell - show context menu
    if (target.tagName === 'TD' || target.tagName === 'TH' || this.findParentElement(target as Node, 'TD') || this.findParentElement(target as Node, 'TH')) {
      // If the user drag-selected text inside the cell, treat it as a normal
      // text selection: clear cell highlight + hide menu so toolbar formatting works.
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        this.tableContextMenuService.hideMenu();
        return;
      }
      this.tableContextMenuService.handleCellClick(event as MouseEvent);
      // Also handle table selection for resize handles
      const tableParent = this.findParentElement(target as Node, 'TABLE');
      if (tableParent) {
        this.tableHandlerService.selectTable(tableParent as HTMLTableElement);
      }
      return;
    }

    // Handle table selection (clicking on table border/element itself)
    if (target && target.tagName === 'TABLE') {
      const tableElement = target as HTMLTableElement;
      this.tableHandlerService.selectTable(tableElement);
      event.preventDefault();
      return;
    }

    // Check if clicking inside a table (but not a cell - e.g. tbody)
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
      // Clear table context menu if clicking elsewhere
      this.tableContextMenuService.hideMenu();
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

  /**
   * Handle Enter key with Froala-style behavior.
   *
   * - **Shift+Enter**: insert a `<br>` line break inside the current block.
   * - **Enter inside a list item**: delegated to `handleEnterInList` (which
   *   handles empty-list exit and shift-Enter line break).
   * - **Enter at end of block**: insert a new `<p><br></p>` after the
   *   current block, place the caret in the new block.
   * - **Enter at start of block**: split the current block — text before the
   *   caret stays in the current block, text after the caret moves into a
   *   new `<p>` before it.
   * - **Enter in the middle of a block**: same as "at start" but the
   *   current block is also empty after the split, so it gets a `<br>` to
   *   stay focusable.
   * - **Enter inside an empty block**: ensure the block is `<p><br></p>`
   *   so the caret stays visible, then insert a new `<p><br></p>` after.
   *
   * Without this handling the editor falls back to the browser default,
   * which inserts `<div>` (not `<p>`) blocks in a `<div contenteditable>`.
   * After the first Enter a `<div>` lands next to a `<p>`, the next Enter
   * either gets swallowed by the editor's paragraph-normalizing cleanup
   * (the bug "first Enter works, second Enter doesn't") or it duplicates
   * the caret, making the editor feel broken. This handler always emits
   * `<p><br></p>` blocks so every subsequent Enter behaves the same as the
   * first one, which is exactly what Froala does.
   */
  private handleEnterKey(event: KeyboardEvent): void {
    if (this.readonly) return;

    const selection = this.selectionService.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // List item handling stays unchanged: exit empty list, insert <br> on
    // shift+enter, otherwise let the browser create a new <li>.
    const listItem = this.findParentElement(container, 'LI');
    if (listItem) {
      this.handleEnterInList(event, listItem);
      return;
    }

    // Shift+Enter always inserts a soft <br> inside the current block.
    if (event.shiftKey) {
      event.preventDefault();
      this.insertLineBreakAtCursor();
      this.updateContentFromDOM();
      return;
    }

    // Locate the block element the caret lives in (the closest P / DIV /
    // heading). If we are outside any block (bare text node at editor
    // root), wrap into a <p> first.
    const block = this.findParentBlock(container);
    if (!block || block === this.contentArea?.nativeElement) {
      event.preventDefault();
      this.insertParagraphAtCaretFromBareText();
      this.updateContentFromDOM();
      return;
    }

    event.preventDefault();
    this.splitBlockAtCaret(block as HTMLElement);
    this.updateContentFromDOM();
  }

  /**
   * Walk up the DOM to the closest block-level element (P / DIV / H1-H6 /
   * BLOCKQUOTE). Returns null if the cursor is at the editor root with no
   * block ancestor.
   */
  private findParentBlock(node: Node): Element | null {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'];
    const editorRoot = this.contentArea?.nativeElement;
    let current: Node | null =
      node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== editorRoot) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const tag = (current as Element).tagName;
        if (blockTags.includes(tag)) {
          return current as Element;
        }
      }
      current = current.parentNode;
    }
    return null;
  }

  /**
   * The caret lives in bare text inside the contenteditable root (no
   * surrounding block element). Convert the surrounding text into a
   * paragraph and insert a fresh empty paragraph after it.
   */
  private insertParagraphAtCaretFromBareText(): void {
    const selection = this.selectionService.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const editorRoot = this.contentArea?.nativeElement;
    if (!editorRoot) return;

    // Extract any selected text into a new <p>.
    const fragment = range.extractContents();
    const newPara = document.createElement('p');
    if (fragment.firstChild) {
      newPara.appendChild(fragment);
    } else {
      newPara.appendChild(document.createElement('br'));
    }
    editorRoot.appendChild(newPara);

    const emptyPara = document.createElement('p');
    emptyPara.appendChild(document.createElement('br'));
    editorRoot.appendChild(emptyPara);

    const newRange = document.createRange();
    newRange.setStart(emptyPara, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Insert a `<br>` line break at the current caret without creating a new
   * block. Used by Shift+Enter.
   */
  private insertLineBreakAtCursor(): void {
    const selection = this.selectionService.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const br = document.createElement('br');
    range.deleteContents();
    range.insertNode(br);

    // Browsers collapse the range after inserting a <br> at the caret.
    // Move the caret to just after the inserted <br> so the next typed
    // character starts on the new visual line.
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Split `block` at the current caret position, creating a new sibling
   * `<p>` (or matching tag) after `block` that contains everything the user
   * typed after the caret. The current block keeps the text before the
   * caret.
   *
   * If the caret is at the very start (text-after-caret becomes the new
   * block only, current block stays empty), the same logic applies with
   * an empty "before" — we ensure the current block stays focusable by
   * leaving a `<br>` placeholder when its text becomes empty.
   *
   * If the caret is at the very end (text-after-caret is empty), we just
   * insert an empty `<p><br></p>` after the current block, identical to
   * the previous "Enter at end of line" behavior — and crucially, this
   * keeps working for repeated Enters because every new paragraph has the
   * exact same shape.
   */
  private splitBlockAtCaret(block: HTMLElement): void {
    const selection = this.selectionService.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // Clamp the range so it lives inside this block; selection may have
    // crossed multiple blocks.
    let blockRange = document.createRange();
    blockRange.selectNodeContents(block);
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    // Decide where to split. If the range is collapsed AND inside the
    // block, split at the caret. If the range is a non-collapsed
    // selection inside the block, delete the selected content first so
    // the visual "text disappearing" happens before the split.
    const isCollapsed = range.collapsed;
    const isInsideBlock = block.contains(startContainer) && block.contains(endContainer);

    let splitOffset: { container: Node; offset: number };

    if (!isInsideBlock) {
      // Selection spans multiple blocks — keep behaviour simple: collapse
      // to the block boundary nearest the caret.
      const blockRect = block.getBoundingClientRect();
      const caretRect = range.getBoundingClientRect();
      if (caretRect.top < blockRect.top + blockRect.height / 2) {
        splitOffset = { container: block, offset: 0 };
      } else {
        const len = block.childNodes.length;
        splitOffset = { container: block, offset: len };
      }
    } else if (isCollapsed) {
      splitOffset = { container: startContainer, offset: startOffset };
    } else {
      // Non-collapsed selection inside this block. Delete the selection,
      // then split at the (now collapsed) caret.
      range.deleteContents();
      const newRange = selection.getRangeAt(0);
      splitOffset = { container: newRange.startContainer, offset: newRange.startOffset };
    }

    // Build the new block that will hold everything after the split point.
    const newBlock = document.createElement(block.tagName.toLowerCase()) as HTMLElement;
    newBlock.appendChild(document.createElement('br'));

    // Extract "after" content from the block, starting at splitOffset, into
    // the newBlock. This is the most reliable way to move a DOM range
    // across siblings without juggling text nodes / inline formatting.
    const extractRange = document.createRange();
    extractRange.setStart(splitOffset.container, splitOffset.offset);
    extractRange.setEndAfter(block.lastChild ?? block);
    const fragment = extractRange.extractContents();

    // Re-home any nodes we extracted into newBlock.
    if (fragment.firstChild) {
      // Replace the placeholder <br> with the real fragment.
      newBlock.innerHTML = '';
      newBlock.appendChild(fragment);
    } else {
      // Nothing after the caret — leave newBlock as <p><br></p>.
    }

    // Ensure the current block stays focusable: if removing the trailing
    // children emptied it, leave a <br> placeholder so the caret remains
    // visible.
    if (!block.textContent?.trim() && !block.querySelector('br,img')) {
      block.appendChild(document.createElement('br'));
    }

    // If the current block has a `<br>` left over from a previous empty
    // paragraph that ended up being our split point, it will be re-added.
    // No special-case needed.

    // Insert the new sibling block right after the current one.
    block.parentNode?.insertBefore(newBlock, block.nextSibling);

    // Place the caret at the start of the new block.
    const caretRange = document.createRange();
    caretRange.setStart(newBlock, 0);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
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

    // Clone the DOM so we can strip internal UI elements (resize handles) without
    // mutating the live editor, ensuring they are never persisted to the database.
    const clone = this.contentArea.nativeElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.table-resize-handle').forEach(el => el.remove());
    clone.querySelectorAll('table[data-resize-initialized]').forEach(
      el => el.removeAttribute('data-resize-initialized')
    );

    const content = clone.innerHTML;
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

  /**
   * Reads the current content directly from the live DOM.
   * Use this after direct DOM modifications (e.g. color commands via wrapSelectionWithStyle)
   * that bypass the normal input-event-driven content update pipeline.
   * Also updates the internal content cache so subsequent getContent() calls are accurate.
   */
  readCurrentContent(): string {
    if (!this.contentArea?.nativeElement) return this.content;
    const clone = this.contentArea.nativeElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.table-resize-handle').forEach(el => el.remove());
    clone.querySelectorAll('table[data-resize-initialized]').forEach(
      el => el.removeAttribute('data-resize-initialized')
    );
    this.content = clone.innerHTML;
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

  // Line height formatting — routed through here so updateContentFromDOM
  // runs after the DOM mutation, ensuring (contentChange) fires and the
  // applied line-height survives save/reload (Froala-style persistence).
  setLineHeight(value: string): void {
    if (this.readonly) return;

    const command: EditorCommand = { name: 'lineHeight', value };
    const success = this.commandService.executeCommand(command, value);

    if (success) {
      this.commandExecuted.emit(command);
      this.updateContentFromDOM();
      this.selectionChangeSubject.next();
    }
  }

  getCurrentLineHeight(): string {
    return this.commandService.getCommandValue('lineHeight');
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
        // Initialize context menu service with content area reference
        this.tableContextMenuService.initialize(
          this.contentArea.nativeElement,
          () => this.updateContentFromDOM()
        );
      }, 0);
    }
  }
}
