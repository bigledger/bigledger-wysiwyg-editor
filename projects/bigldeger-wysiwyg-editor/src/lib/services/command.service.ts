import { Injectable } from '@angular/core';
import { EditorCommand } from '../models/editor-command.interface';
import { LinkData } from '../components/dialogs/link-dialog/link-dialog.component';
import { ImageData } from '../models/image.interface';
import { TableData } from '../models/table.interface';
import { VideoData, buildVideoEmbedHtml } from '../models/video.interface';
import { ToolOption, ToolOptionPreset } from '../models/toolbar.interface';
import { SelectionService } from './selection.service';
import { BrowserCompatibilityService } from './browser-compatibility.service';
import { ErrorHandlerService } from './error-handler.service';
import { HistoryService } from './history.service';
import { TableService } from './table.service';

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
    private historyService: HistoryService,
    private tableService: TableService
  ) {}

  /**
   * Execute a formatting command
   */
  executeCommand(command: EditorCommand, value?: string): boolean {
    try {
      let commandName = command.name;

      if (commandName === 'quote') {
        return this.toggleBlockquote();
      }

      if (commandName === 'lineHeight') {
        return this.applyLineHeight(value || 'normal');
      }

      if (commandName === 'paragraphStyle') {
        return this.applyParagraphStylePreset(
          value || '',
          command.options?.params?.['preset'] as ToolOptionPreset | undefined,
          command.options?.params?.['presetOptions'] as ToolOption[] | undefined
        );
      }

      if (commandName === 'inlineClass' || commandName === 'inlineStyle') {
        return this.applyInlinePreset(
          command.options?.params?.['preset'] as ToolOptionPreset | undefined,
          command.options?.params?.['presetOptions'] as ToolOption[] | undefined
        );
      }

      if (commandName === 'insertHR') {
        return this.insertHorizontalRule();
      }

      if (commandName === 'insertEmoji' || commandName === 'insertSpecialChar') {
        return this.insertTextAtCursor(value || '');
      }

      if (commandName === 'insertEmbed') {
        return this.insertHtmlAtCursor(value || '');
      }

      if (commandName === 'insertBookmarkAnchor') {
        return this.insertHtmlAtCursor(value || '');
      }

      if (commandName === 'insertFileLink') {
        return this.insertHtmlAtCursor(value || '');
      }

      if (commandName === 'formatOLSimple') {
        commandName = 'insertOrderedList';
      }

      // Handle fontSize command with pixel values
      let commandValue = value;
      if ((commandName === 'paragraphFormat' || commandName === 'formatBlock') && value) {
        commandName = 'formatBlock';
        commandValue = this.normalizeFormatBlockValue(value);
      }

      // Froala-style native handling for inline formatting commands.
      // For font size we skip `document.execCommand('fontSize')` entirely —
      // browsers only accept the legacy 1-7 scale, which produces a
      // `<font size="N">` that modern browsers ignore. Instead we apply
      // `font-size: Npx` directly as an inline style on the selection.
      if (commandName === 'fontSize') {
        return this.executeNativeFontSizeCommand(value);
      }

      // Froala-style native execCommand for inline formatting commands.
      // The browser handles every edge case — collapsed caret, partial
      // multi-block selection, full-content selection, nested inline
      // formatting — without producing fragment ghosts or breaking the
      // contenteditable tree the way our wrapSelectionWithStyle fallback did.
      if (commandName === 'foreColor' || commandName === 'backColor') {
        return this.executeNativeColorCommand(commandName, commandValue);
      }

      if (commandName === 'fontName' || commandName === 'fontFamily') {
        return this.executeNativeFontNameCommand(value);
      }

      // Execute the command
      const success = document.execCommand(commandName, command.options?.showUI || false, commandValue);

      if (!success) {
        return this.executeFallbackCommand({ ...command, name: commandName }, value);
      }

      return success;
    } catch (error) {
      this.errorHandlerService.handleCommandError(command.name, { command: command.name, value }, false);
      return false;
    }
  }

  /**
   * Convert pixel font size to relative size (1-7) for document.execCommand
   */
  private convertPixelToFontSize(pixelValue: string): string {
    const pixel = parseInt(pixelValue.replace('px', ''), 10);
    
    // Map pixel sizes to relative sizes (1-7)
    if (pixel <= 10) return '1';
    if (pixel <= 12) return '2';
    if (pixel <= 14) return '3';
    if (pixel <= 16) return '4';
    if (pixel <= 18) return '5';
    if (pixel <= 24) return '6';
    return '7';
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
        case 'formatBlock':
        case 'paragraphFormat':
          return this.applyBlockFormat(value || 'p');
        case 'fontSize':
          return this.wrapSelectionWithStyle('font-size', value || '14px');
        case 'fontName':
        case 'fontFamily':
          return this.wrapSelectionWithStyle('font-family', value || 'Arial, sans-serif');
        case 'foreColor':
        case 'backColor':
          // Color commands are routed through executeNativeColorCommand in
          // executeCommand(); this fallback only fires when execCommand is
          // entirely unavailable (legacy IE / jsdom test env). We still try
          // the naive wrap as a last resort.
          if (command.name === 'foreColor') {
            return this.wrapSelectionWithStyle('color', value || '#000000');
          }
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
   * Apply a text or background color using the browser's native execCommand.
   *
   * Froala-style behavior: this delegates to `foreColor` / `hiliteColor`
   * which the browser implements for every edge case — collapsed caret
   * (applies to next typed text), partial multi-block selection (each block
   * gets wrapped correctly), full-content selection (every text node
   * restyled), and nested inline formatting. Unlike our previous
   * `wrapSelectionWithStyle` fallback it does not extract the selection
   * into a fragment (which can produce ghost nodes / extra borders in the
   * contenteditable tree) and does not lose selection on partial
   * selections.
   */
  private executeNativeColorCommand(commandName: 'foreColor' | 'backColor', value?: string): boolean {
    const color = this.normalizeColorValue(value);
    if (!color) {
      // Removing color: native execCommand('removeFormat') unwraps color but
      // it also strips other formatting. Instead route a transparent / empty
      // value to the native command — for hiliteColor most browsers accept
      // the literal string 'transparent'.
      try {
        const nativeCommand = commandName === 'foreColor' ? 'removeFormat' : 'hiliteColor';
        const nativeValue = commandName === 'foreColor' ? null : 'transparent';
        document.execCommand(nativeCommand, false, nativeValue as any);
        return true;
      } catch {
        return false;
      }
    }

    try {
      // Ensure subsequent commands emit inline `style=""` attributes rather
      // than old-school presentational tags, matching Froala's output and
      // working with our wrapSelectionWithStyle fallback path.
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch {
        // styleWithCSS is best-effort; ignore in browsers that don't support it.
      }

      const nativeCommand = commandName === 'foreColor' ? 'foreColor' : 'hiliteColor';
      const success = document.execCommand(nativeCommand, false, color);
      if (success) {
        return true;
      }
    } catch {
      // fall through to manual fallback
    }

    // Last-resort fallback if execCommand is unavailable (e.g. jsdom, legacy IE).
    if (commandName === 'foreColor') {
      return this.wrapSelectionWithStyle('color', color || '#000000');
    }
    return this.wrapSelectionWithStyle('background-color', color || '#ffffff');
  }

  /**
   * Normalize a color value for use with document.execCommand.
   *
   * - Trims whitespace, lowercases.
   * - Expands short hex (`#abc`) to full (`#aabbcc`).
   * - Rejects empty / invalid values (returns `null`).
   * - Accepts `transparent`, named colors and `rgb(...)` strings as-is.
   */
  private normalizeColorValue(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return null;
    }
    const lower = trimmed.toLowerCase();
    if (lower === 'transparent' || lower === 'inherit') {
      return lower;
    }
    const hexMatch = lower.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
      }
      return `#${hex}`;
    }
    if (lower.startsWith('rgb(') || lower.startsWith('rgba(')) {
      return lower;
    }
    // Let named colors pass through; the browser will accept them.
    return lower;
  }

  /**
   * Apply a font-family using the browser's native execCommand.
   *
   * Froala-style behavior: enable `styleWithCSS` once so subsequent
   * `fontName` execCommand writes `<span style="font-family: ...">` rather
   * than legacy `<font face="...">`. Modern browsers' `queryCommandValue`
   * returns empty for `<font face>` style values, so producing the inline
   * style is what makes the dropdown detection (`getCurrentFontFamily` in
   * selection.service.ts) read back the active font reliably.
   *
   * `document.execCommand('fontName')` handles every edge case — collapsed
   * caret (applies to next typed text), partial multi-block selection
   * (each text fragment wrapped correctly), full-content selection (every
   * text node restyled), and nested inline formatting. Unlike our previous
   * `wrapSelectionWithStyle` fallback, it does not extract the selection
   * into a fragment that can leak nested structures or ghost nodes.
   */
  private executeNativeFontNameCommand(value?: string): boolean {
    const fontFamily = this.normalizeFontFamilyValue(value);
    if (!fontFamily) {
      return false;
    }

    // Ensure subsequent commands emit inline `style=""` attributes rather
    // than legacy <font face> tags. styleWithCSS is sticky for the
    // document so calling once is enough.
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // styleWithCSS is best-effort; older browsers ignore it.
    }

    try {
      const success = document.execCommand('fontName', false, fontFamily);
      if (success) {
        return true;
      }
    } catch {
      // fall through to manual fallback
    }

    // Last-resort fallback if execCommand is unavailable (jsdom, legacy IE).
    return this.wrapSelectionWithStyle('font-family', fontFamily);
  }

  /**
   * Normalize a font-family value for use with document.execCommand.
   *
   * - Trims whitespace.
   * - Extracts the first font from a CSS font-family list
   *   (`"Helvetica, sans-serif"` → `"Helvetica"`).
   * - Removes surrounding quotes (`"Times New Roman"` → `Times New Roman`).
   * - Returns an empty string when the value is nullish / blank.
   */
  private normalizeFontFamilyValue(value?: string | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    const first = String(value).split(',')[0] || '';
    return first
      .replace(/^['"]+|['"]+$/g, '')
      .trim();
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
   * Froala-style font-size application.
   *
   * Froala and every other modern contenteditable editor avoid
   * `document.execCommand('fontSize')` because that command accepts only the
   * legacy 1-7 HTML scale, not arbitrary pixel values. When `styleWithCSS=true`
   * is active Chromium does not even emit `<font size="N">` wrappers any more,
   * so any post-processing walk over `<font[size]>` is a no-op and the user's
   * requested px value never reaches the DOM.
   *
   * Instead we mutate the DOM manually:
   *
   * 1. **Collapsed caret** — set `font-size` on the nearest *inline* wrapper
   *    (so visual rendering does not change for already-typed text), and
   *    also stamp it on the parent block so the next typed character inherits
   *    it. This matches what a user expects when they pick a size and then
   *    continue typing.
   * 2. **Range selection within a single inline wrapper** — split the wrapper
   *    and stamp the inline `font-size` only on the inner range. Other inline
   *    styles on the wrapper (color, bold, etc.) are preserved on the
   *    untouched segments.
   * 3. **Cross-block / cross-inline selections** — walk every text node that
   *    intersects the range with a `TreeWalker`, split at the range
   *    boundaries, and wrap each inside-range segment in a fresh
   *    `<span style="font-size: Npx">`.
   *
   * This is the same algorithm described in the Froala `fontSize.apply()`
   * implementation and is the only reliable path that puts the user's actual
   * pixel value into the DOM. The toolbar's `getCurrentFontSize()` will then
   * see the new value on the next selection change.
   */
  private executeNativeFontSizeCommand(value?: string): boolean {
    const fontSize = this.normalizeFontSizeValue(value);
    if (!fontSize) {
      return false;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    if (!this.isRangeInsideEditor(range)) {
      return false;
    }

    if (range.collapsed) {
      return this.applyFontSizeAtCaret(range, fontSize);
    }

    return this.applyFontSizeToSelection(range, fontSize);
  }

  /**
   * Whether `range` lives inside any contenteditable on the page. Used to
   * bail out early when the toolbar is clicked but the editor is not
   * focused (otherwise we would mutate unrelated DOM).
   */
  private isRangeInsideEditor(range: Range): boolean {
    const container = range.commonAncestorContainer;
    let node: Node | null =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement)
        : container.parentElement;
    while (node) {
      const el = node as HTMLElement;
      if (el.isContentEditable) {
        return true;
      }
      node = el.parentElement;
    }
    return false;
  }

  /**
   * Stamp an inline font-size on the caret position so the next typed
   * character inherits it.
   *
   * Strategy: walk up from the caret to the nearest *inline* element (a
   * `<span>`, `<font>`, `<b>`, …). Set `style.fontSize` only on that inline
   * element if it exists — we do NOT want to enlarge already-typed text.
   * Then also stamp the value on the parent block so subsequent typed
   * characters inherit it.
   */
  private applyFontSizeAtCaret(range: Range, fontSize: string): boolean {
    const anchor =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);

    if (!anchor) {
      return false;
    }

    // 1. Stamp the inline `font-size` on the nearest inline ancestor of the
    //    caret (the smallest wrap right around the caret). This does not
    //    change already-typed text because we only set `style.fontSize` on
    //    a wrapper that we will immediately strip if it becomes empty.
    const inlineAnchor = this.findNearestInlineWrapper(anchor);
    if (inlineAnchor) {
      inlineAnchor.style.fontSize = fontSize;
    }

    // 2. Stamp the block-level anchor so the next typed character inherits
    //    the same size. We do this by either reusing the parent block's
    //    inline style (preferred — keeps the DOM small) or by inserting
    //    a `<span style="font-size: ${fontSize}px"></span>` with a
    //    zero-width space that is wiped out on the next keystroke.
    const blockAnchor = this.findParentBlockElement(anchor) || this.findEditorRootForCaret(anchor);
    if (blockAnchor) {
      blockAnchor.style.fontSize = fontSize;
    } else {
      this.insertZeroWidthFontSizeAnchor(range, fontSize);
    }

    // 3. Re-anchor the caret so subsequent typing flows into the styled
    //    region. `range.collapse(true)` keeps the current caret offset.
    const restored = document.createRange();
    try {
      restored.setStart(
        range.startContainer,
        Math.min(range.startOffset, this.getNodeLength(range.startContainer))
      );
      restored.collapse(true);
    } catch {
      restored.selectNodeContents(anchor);
      restored.collapse(false);
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(restored);
    }
    return true;
  }

  /**
   * Walk from `anchor` outwards and return the closest inline wrapper
   * (`<span>`, `<font>`, `<b>`, `<i>`, `<u>`, `<strong>`, `<em>`). Returns
   * null when no such element exists, in which case the caller should fall
   * back to the block-level anchor.
   */
  private findNearestInlineWrapper(anchor: HTMLElement): HTMLElement | null {
    const inlineTags = new Set([
      'SPAN', 'FONT', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'MARK', 'SMALL', 'SUB', 'SUP', 'Q', 'CITE', 'DFN'
    ]);
    let node: HTMLElement | null = anchor;
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (inlineTags.has(node.tagName)) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * Resolve the contenteditable root that contains `anchor`. Used by
   * `applyFontSizeAtCaret` when the caret is not inside a recognised block
   * element (e.g. when the editor initially renders a raw text node).
   */
  private findEditorRootForCaret(anchor: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = anchor;
    while (node) {
      if (node.isContentEditable) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * Get the textual length of `node` (used to clamp caret offsets that may
   * otherwise overflow after DOM mutation).
   */
  private getNodeLength(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node as Text).data.length;
    }
    return (node as HTMLElement).childNodes.length;
  }

  /**
   * Insert an invisible `<span style="font-size: ${fontSize}px"></span>`
   * (with a zero-width space) at the caret so that the next typed character
   * inherits the requested size even when no block anchor is reachable.
   */
  private insertZeroWidthFontSizeAnchor(range: Range, fontSize: string): void {
    const zwsp = document.createTextNode('\u200B');
    const span = document.createElement('span');
    span.style.fontSize = fontSize;
    span.appendChild(zwsp);

    try {
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(zwsp, 1);
      newRange.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } catch {
      /* ignore — no usable caret position */
    }
  }

  /**
   * Walk every text node in the range, split at the boundaries, and wrap
   * each segment that lies inside the range in a fresh
   * `<span style="font-size: ${fontSize}px">`. Splits are performed in
   * reverse order so earlier offsets remain valid.
   */
  private applyFontSizeToSelection(range: Range, fontSize: string): boolean {
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    if (
      startContainer.nodeType !== Node.TEXT_NODE ||
      endContainer.nodeType !== Node.TEXT_NODE
    ) {
      // Fall back to the legacy wrap path when the range endpoints are not
      // text nodes (e.g. the user selected inline elements directly). This
      // keeps the toolbar working in unusual selection shapes.
      return this.wrapSelectionWithStyle('font-size', fontSize);
    }

    // Split end first so the start offsets remain valid.
    let endText: Text = endContainer as Text;
    let workingEndOffset = endOffset;
    if (endOffset < endText.data.length) {
      endText.splitText(endOffset);
      workingEndOffset = endText.data.length;
    }

    let startText: Text = startContainer as Text;
    let workingStartOffset = startOffset;
    if (startOffset > 0) {
      const after = startText.splitText(startOffset);
      // The original text node now holds the prefix (outside the range);
      // `after` is the inside-range segment.
      startText = after;
      workingStartOffset = 0;
    }

    // Collect every text node from startText up to and including endText,
    // in document order.
    const textNodes: Text[] = [];
    const root = range.commonAncestorContainer;
    const walkerRoot =
      root.nodeType === Node.ELEMENT_NODE
        ? (root as Element)
        : (root.parentElement as Element | null);
    if (walkerRoot) {
      const walker = document.createTreeWalker(
        walkerRoot,
        NodeFilter.SHOW_TEXT,
        null
      );
      let started = false;
      let node = walker.nextNode();
      while (node) {
        if (node === startText) {
          started = true;
        }
        if (started) {
          textNodes.push(node as Text);
          if (node === endText) {
            break;
          }
        }
        node = walker.nextNode();
      }
    }

    // If we couldn't find a continuous span (e.g. range crosses an empty
    // element), fall back to the wrap helper.
    if (textNodes.length === 0) {
      return this.wrapSelectionWithStyle('font-size', fontSize);
    }

    for (const textNode of textNodes) {
      if (textNode.data.length === 0) {
        continue;
      }
      this.wrapSingleTextNodeWithFontSize(
        textNode,
        fontSize,
        textNode === startText ? workingStartOffset : 0,
        textNode === endText ? workingEndOffset : textNode.data.length
      );
    }

    this.restoreSelectionAroundTextNodes(textNodes[0], textNodes[textNodes.length - 1], fontSize);
    return true;
  }

  /**
   * Wrap a continuous range [startOffset, endOffset) inside `textNode` in a
   * fresh `<span style="font-size: ${fontSize}px">`. The outside-text
   * segments are left untouched, as are their inline wrappers.
   */
  private wrapSingleTextNodeWithFontSize(
    textNode: Text,
    fontSize: string,
    startOffset: number,
    endOffset: number
  ): void {
    if (startOffset >= endOffset) {
      return;
    }

    const isFullText = startOffset === 0 && endOffset === textNode.data.length;
    const parent = textNode.parentNode;
    if (!parent) {
      return;
    }

    if (isFullText) {
      // Whole text node is in range — wrap it in a styled span. Preserve the
      // existing inline wrapper's other styles by NOT unwrapping the parent
      // span; instead, add a child <span style="font-size: .."> around the
      // text and keep the outer wrapper's other attributes intact.
      const wrapper = document.createElement('span');
      wrapper.style.fontSize = fontSize;
      parent.insertBefore(wrapper, textNode);
      wrapper.appendChild(textNode);

      // If the new wrapper ends up empty (only an empty text node), drop it
      // to avoid leaving stranded styling in the DOM.
      if (!wrapper.textContent) {
        parent.removeChild(wrapper);
      }
      return;
    }

    // Partial text node — split it into three pieces so the middle piece can
    // be wrapped without touching the surrounding text.
    let middleText: Text;
    if (endOffset < textNode.data.length) {
      textNode.splitText(endOffset);
    }
    if (startOffset > 0) {
      middleText = textNode.splitText(startOffset);
    } else {
      middleText = textNode;
    }

    const wrapper = document.createElement('span');
    wrapper.style.fontSize = fontSize;
    parent.insertBefore(wrapper, middleText);
    wrapper.appendChild(middleText);

    if (!wrapper.textContent) {
      parent.removeChild(wrapper);
    }
  }

  /**
   * After wrapping range text in styled spans, restore a sensible selection
   * so subsequent toolbar interactions operate on the freshly-styled content.
   */
  private restoreSelectionAroundTextNodes(
    first: Text,
    last: Text,
    _fontSize: string
  ): void {
    try {
      const newRange = document.createRange();
      newRange.setStart(first, 0);
      newRange.setEnd(last, last.data.length);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } catch {
      /* ignore — leave the existing selection alone */
    }
  }

  /**
   * Normalize a font-size value coming from the toolbar / API.
   *
   * Accepts:
   * - Plain integers: `"30"` → `"30px"`.
   * - Pixel values:   `"30px"` → `"30px"`.
   * - Point values:   `"22pt"` → `"29px"` (rounded).
   * - "small" / "medium" / "large" — passed through; the browser resolves them.
   * - Legacy `<font size>` numbers 1-7 — mapped to the closest pixel size used
   *   elsewhere in the codebase (1→10, 2→12, 3→14, 4→16, 5→18, 6→24, 7→32).
   *
   * Returns an empty string for missing / unparseable input so callers can
   * no-op safely.
   */
  private normalizeFontSizeValue(value?: string | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    const trimmed = String(value).trim().toLowerCase();
    if (!trimmed) {
      return '';
    }

    const namedSizes: Record<string, string> = {
      'xx-small': '10px',
      'x-small': '12px',
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'x-large': '24px',
      'xx-large': '32px'
    };
    if (namedSizes[trimmed]) {
      return namedSizes[trimmed];
    }

    if (trimmed.endsWith('px')) {
      const px = Number.parseFloat(trimmed);
      return Number.isFinite(px) ? `${Math.round(px)}px` : '';
    }

    if (trimmed.endsWith('pt')) {
      const pt = Number.parseFloat(trimmed);
      return Number.isFinite(pt) ? `${Math.round(pt * (4 / 3))}px` : '';
    }

    if (trimmed.endsWith('em') || trimmed.endsWith('rem')) {
      const factor = trimmed.endsWith('rem') ? 16 : 16;
      const em = Number.parseFloat(trimmed);
      return Number.isFinite(em) ? `${Math.round(em * factor)}px` : '';
    }

    if (trimmed.endsWith('%')) {
      const pct = Number.parseFloat(trimmed);
      return Number.isFinite(pct) ? `${Math.round((pct / 100) * 16)}px` : '';
    }

    if (/^\d+$/.test(trimmed)) {
      const sizeMap: Record<string, string> = {
        '1': '10px',
        '2': '12px',
        '3': '14px',
        '4': '16px',
        '5': '18px',
        '6': '24px',
        '7': '32px'
      };
      // 8+ treat as a literal pixel value: "30" → "30px".
      return sizeMap[trimmed] || `${Math.round(Number.parseInt(trimmed, 10))}px`;
    }

    return trimmed;
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

    // If selection is collapsed (just cursor), insert a placeholder and select it
    if (range.collapsed) {
      const placeholder = document.createTextNode('\u00A0'); // Non-breaking space
      range.insertNode(placeholder);
      range.selectNode(placeholder);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Detect "full content" selections: the user has selected every character
    // inside the current block / editor. In that case, extracting the
    // selection into a fragment and re-wrapping it leaves trailing empty
    // siblings at the start and end of the editor (the "extra border line"
    // bug from v1.16.x). Instead, set the style directly on every existing
    // descendant element so the DOM tree stays intact.
    const commonAncestor = range.commonAncestorContainer;
    if (this.isFullContentSelection(range, commonAncestor)) {
      const target = (commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentElement
        : commonAncestor) as Element | null;
      if (target) {
        if (target.children && target.children.length > 0) {
          // Block-level ancestor (e.g. <p>): propagate style to descendants.
          target.querySelectorAll('*').forEach((node) => {
            (node as HTMLElement).style.setProperty(property, value);
          });
          // Also stamp the ancestor so bare text nodes inside it pick up the value
          // via inheritance for the next typed character.
          (target as HTMLElement).style.setProperty(property, value);
        } else {
          // Inline ancestor (a span / font / etc.): set style directly.
          (target as HTMLElement).style.setProperty(property, value);
        }

        // Restore selection to the same content.
        const newRange = document.createRange();
        try {
          newRange.selectNodeContents(target);
        } catch {
          newRange.selectNodeContents(commonAncestor);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
        return true;
      }
    }

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
   * Returns true when the range covers every visible character of its
   * common ancestor — used to swap "wrap-in-span" for "style in-place" so
   * full-content formatting doesn't leave behind empty wrappers.
   */
  private isFullContentSelection(range: Range, commonAncestor: Node): boolean {
    if (range.collapsed) {
      return false;
    }

    const ancestorElement = commonAncestor.nodeType === Node.ELEMENT_NODE
      ? commonAncestor as Element
      : commonAncestor.parentElement;

    if (!ancestorElement) {
      return false;
    }

    // When the anchor itself is contenteditable (the whole editor), we treat
    // any selection that ends within it as covering everything inside.
    const isEditable = (ancestorElement as HTMLElement).isContentEditable
      || ancestorElement.getAttribute && ancestorElement.getAttribute('contenteditable') === 'true';

    if (isEditable) {
      const ancestorRange = document.createRange();
      ancestorRange.selectNodeContents(ancestorElement);
      return range.startOffset === 0
        && range.endOffset === ancestorRange.endOffset
        && range.startContainer === ancestorRange.startContainer
        && range.endContainer === ancestorRange.endContainer;
    }

    // Block-level ancestor: compare text content lengths after trimming.
    const selectedText = range.toString();
    const fullText = (commonAncestor.textContent || '').toString();
    if (!fullText.trim()) {
      return false;
    }
    return selectedText.trim() === fullText.trim();
  }

  /**
   * Apply a block-level format to the current selection.
   */
  private applyBlockFormat(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const normalizedTag = this.normalizeBlockTag(tagName);
    const range = selection.getRangeAt(0);
    const currentBlock = this.findParentBlockElement(range.commonAncestorContainer);

    try {
      if (currentBlock) {
        const currentTag = this.normalizeBlockTag(currentBlock.tagName);
        if (currentTag === normalizedTag) {
          return true;
        }

        const replacement = document.createElement(normalizedTag);
        Array.from(currentBlock.attributes).forEach(attribute => {
          replacement.setAttribute(attribute.name, attribute.value);
        });
        replacement.innerHTML = currentBlock.innerHTML || '<br>';
        currentBlock.replaceWith(replacement);

        const replacementRange = document.createRange();
        replacementRange.selectNodeContents(replacement);
        if (range.collapsed) {
          replacementRange.collapse(false);
        }

        selection.removeAllRanges();
        selection.addRange(replacementRange);
        return true;
      }

      const wrapper = document.createElement(normalizedTag);
      if (range.collapsed) {
        wrapper.innerHTML = '<br>';
        range.insertNode(wrapper);

        const collapsedRange = document.createRange();
        collapsedRange.selectNodeContents(wrapper);
        collapsedRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(collapsedRange);
        return true;
      }

      const selectedContent = range.extractContents();
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);

      const wrappedRange = document.createRange();
      wrappedRange.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(wrappedRange);
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('applyBlockFormat', { tagName: normalizedTag }, false);
      return false;
    }
  }

  /**
   * Toggle the current block between paragraph and blockquote.
   */
  private toggleBlockquote(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const currentBlock = this.findParentBlockElement(range.commonAncestorContainer);
    const currentTag = currentBlock ? this.normalizeBlockTag(currentBlock.tagName) : 'p';

    return this.applyBlockFormat(currentTag === 'blockquote' ? 'p' : 'blockquote');
  }

  /**
   * Insert a horizontal rule (<hr>) at the cursor position.
   */
  private insertHorizontalRule(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const hr = document.createElement('hr');
    range.insertNode(hr);
    // Move cursor after the <hr>
    const newRange = document.createRange();
    newRange.setStartAfter(hr);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return true;
  }

  /**
   * Insert a plain text character (emoji, special char) at the cursor.
   */
  insertTextAtCursor(text: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return true;
  }

  /**
   * Insert arbitrary HTML at the cursor position.
   */
  insertHtmlAtCursor(html: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    return true;
  }

  /**
   * Apply line-height styling to the current block element.
   */
  private applyLineHeight(value: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const blockElement = this.findParentBlockElement(range.commonAncestorContainer);

    if (!blockElement) {
      return false;
    }

    if (value === 'normal') {
      blockElement.style.removeProperty('line-height');
    } else {
      blockElement.style.lineHeight = value;
    }

    return true;
  }

  /**
   * Apply a paragraph-style preset to the current block element.
   */
  private applyParagraphStylePreset(
    presetValue: string,
    preset?: ToolOptionPreset,
    presetOptions: ToolOption[] = []
  ): boolean {
    const targetTag = preset?.tagName || presetValue || 'p';
    const blockFormatApplied = this.applyBlockFormat(targetTag);

    if (!blockFormatApplied) {
      return false;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const blockElement = this.findParentBlockElement(range.commonAncestorContainer);
    if (!blockElement) {
      return false;
    }

    this.clearRelatedPresetFormatting(blockElement, presetOptions);
    this.applyPresetToElement(blockElement, preset);
    return true;
  }

  /**
   * Apply an inline preset to the current selection.
   */
  private applyInlinePreset(
    preset?: ToolOptionPreset,
    presetOptions: ToolOption[] = []
  ): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    let targetElement = this.findInlinePresetElement(range.commonAncestorContainer);

    if (!targetElement) {
      targetElement = this.wrapSelectionWithInlineElement(range, preset?.tagName || 'span');
    }

    if (!targetElement) {
      return false;
    }

    this.clearRelatedPresetFormatting(targetElement, presetOptions);
    this.applyPresetToElement(targetElement, preset);

    const updatedRange = document.createRange();
    updatedRange.selectNodeContents(targetElement);
    selection.removeAllRanges();
    selection.addRange(updatedRange);
    return true;
  }

  /**
   * Normalize toolbar block-format values for execCommand.
   */
  private normalizeFormatBlockValue(value: string): string {
    return `<${this.normalizeBlockTag(value)}>`;
  }

  /**
   * Normalize block tag names to safe HTML tag names.
   */
  private normalizeBlockTag(tagName: string): string {
    const normalized = tagName
      .replace(/[<>'"]/g, '')
      .trim()
      .toLowerCase();

    if (normalized === 'normal' || normalized === 'paragraph' || normalized === 'div') {
      return 'p';
    }

    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(normalized)) {
      return normalized;
    }

    return 'p';
  }

  /**
   * Apply preset classes and styles to an element.
   */
  private applyPresetToElement(element: HTMLElement, preset?: ToolOptionPreset): void {
    if (!preset) {
      return;
    }

    this.getPresetClassNames(preset).forEach(className => {
      element.classList.add(className);
    });

    Object.entries(preset.styles || {}).forEach(([property, propertyValue]) => {
      element.style.setProperty(this.normalizeStyleProperty(property), propertyValue);
    });
  }

  /**
   * Remove sibling preset classes and styles before applying the next preset.
   */
  private clearRelatedPresetFormatting(element: HTMLElement, presetOptions: ToolOption[]): void {
    const presetClassNames = new Set<string>();
    const presetStyleProperties = new Set<string>();

    presetOptions.forEach(option => {
      this.getPresetClassNames(option.preset).forEach(className => presetClassNames.add(className));
      Object.keys(option.preset?.styles || {}).forEach(property => {
        presetStyleProperties.add(this.normalizeStyleProperty(property));
      });
    });

    presetClassNames.forEach(className => {
      element.classList.remove(className);
    });

    presetStyleProperties.forEach(property => {
      element.style.removeProperty(property);
    });
  }

  /**
   * Normalize preset class input into a flat list of class names.
   */
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

  /**
   * Normalize style property names so presets can use either camelCase or kebab-case keys.
   */
  private normalizeStyleProperty(property: string): string {
    return property
      .trim()
      .replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
      .toLowerCase();
  }

  /**
   * Find the nearest inline element that can host preset styles without crossing block boundaries.
   */
  private findInlinePresetElement(node: Node): HTMLElement | null {
    let element: Node | null = node;

    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    while (element && element.nodeType === Node.ELEMENT_NODE) {
      const tagName = (element as Element).tagName.toLowerCase();
      if (tagName === 'span') {
        return element as HTMLElement;
      }

      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tagName)) {
        return null;
      }

      element = element.parentNode;
    }

    return null;
  }

  /**
   * Wrap the current range with an inline element so a preset can be applied.
   */
  private wrapSelectionWithInlineElement(range: Range, tagName: string): HTMLElement | null {
    const normalizedTag = tagName
      .replace(/[<>'"]/g, '')
      .trim()
      .toLowerCase() || 'span';

    const wrapper = document.createElement(normalizedTag);
    const selection = window.getSelection();

    if (!selection) {
      return null;
    }

    if (range.collapsed) {
      wrapper.appendChild(document.createTextNode('\u00A0'));
      range.insertNode(wrapper);

      const collapsedRange = document.createRange();
      collapsedRange.selectNodeContents(wrapper);
      collapsedRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(collapsedRange);
      return wrapper;
    }

    const selectedContent = range.extractContents();
    wrapper.appendChild(selectedContent);
    range.insertNode(wrapper);
    return wrapper;
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
   * Insert video embed HTML at current selection.
   */
  insertVideo(videoData: VideoData): boolean {
    try {
      const videoHtml = buildVideoEmbedHtml(videoData);
      if (!videoHtml) {
        return false;
      }

      return this.insertHTML(videoHtml);
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertVideo', { url: videoData.url }, false);
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

  /**
   * Insert table at cursor position
   */
  insertTable(tableData: TableData): boolean {
    return this.tableService.insertTable(tableData);
  }

  /**
   * Insert row above current row
   */
  insertTableRowAbove(): boolean {
    return this.tableService.insertRowAbove();
  }

  /**
   * Insert row below current row
   */
  insertTableRowBelow(): boolean {
    return this.tableService.insertRowBelow();
  }

  /**
   * Delete current table row
   */
  deleteTableRow(): boolean {
    return this.tableService.deleteRow();
  }

  /**
   * Insert column before current column
   */
  insertTableColumnBefore(): boolean {
    return this.tableService.insertColumnBefore();
  }

  /**
   * Insert column after current column
   */
  insertTableColumnAfter(): boolean {
    return this.tableService.insertColumnAfter();
  }

  /**
   * Delete current table column
   */
  deleteTableColumn(): boolean {
    return this.tableService.deleteColumn();
  }

  /**
   * Delete entire table
   */
  deleteTable(): boolean {
    return this.tableService.deleteTable();
  }

  /**
   * Merge selected table cells
   */
  mergeTableCells(): boolean {
    return this.tableService.mergeCells();
  }

  /**
   * Split merged table cell
   */
  splitTableCell(): boolean {
    return this.tableService.splitCell();
  }

  /**
   * Set table cell background color
   */
  setTableCellBackgroundColor(color: string): boolean {
    return this.tableService.setCellBackgroundColor(color);
  }

  /**
   * Set table cell text alignment
   */
  setTableCellTextAlign(align: 'left' | 'center' | 'right' | 'justify'): boolean {
    return this.tableService.setCellTextAlign(align);
  }

  /**
   * Set table cell vertical alignment
   */
  setTableCellVerticalAlign(align: 'top' | 'middle' | 'bottom'): boolean {
    return this.tableService.setCellVerticalAlign(align);
  }

  /**
   * Check if cursor is in a table
   */
  isInTable(): boolean {
    return this.tableService.isInTable();
  }

  /**
   * Get current table properties
   */
  getTableProperties(): TableData | null {
    return this.tableService.getTableProperties();
  }

  /**
   * Update table properties
   */
  updateTableProperties(tableData: Partial<TableData>): boolean {
    return this.tableService.updateTableProperties(tableData);
  }

  /**
   * Get table service instance
   */
  getTableService(): TableService {
    return this.tableService;
  }

  /**
   * Toggle table header row
   */
  toggleTableHeader(): boolean {
    return this.tableService.toggleHeaderRow();
  }

  /**
   * Toggle table footer row
   */
  toggleTableFooter(): boolean {
    return this.tableService.toggleFooterRow();
  }

  /**
   * Split table cell vertically
   */
  splitTableCellVertically(): boolean {
    return this.tableService.splitCellVertically();
  }

  /**
   * Split table cell horizontally
   */
  splitTableCellHorizontally(): boolean {
    return this.tableService.splitCellHorizontally();
  }
}
