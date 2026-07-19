import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

export type ColorPickerMode = 'text' | 'background';

export interface ColorPickerResult {
  mode: ColorPickerMode;
  /** Hex/named color value, or `null` when the user explicitly removed the color. */
  color: string | null;
}

/**
 * Inline Froala-style color picker popover. Rendered inside the toolbar template
 * next to the text-color / background-color buttons so it floats under the
 * trigger without opening an Angular Material dialog.
 *
 * UX matches Froala:
 *   • 3 rows × 8 columns of standard color swatches
 *   • HEX input (auto-prepends '#')
 *   • "Remove Color" button at the bottom
 *
 * Click outside or press Esc to dismiss. Selecting a swatch or pressing Enter
 * inside the HEX input emits `(colorPicked)` and closes the popover.
 */
@Component({
  selector: 'wysiwyg-color-picker-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker-popover.component.html',
  styleUrls: ['./color-picker-popover.component.scss'],
})
export class ColorPickerPopoverComponent implements OnChanges {
  /** Whether the popover is text-color (`foreColor`) or background-color (`backColor`). */
  @Input() mode: ColorPickerMode = 'text';

  /** Currently applied color, used to pre-select the matching swatch / pre-fill HEX. */
  @Input() currentColor: string = '';

  /** Emitted when the user confirms a color (swatch click or HEX submit). */
  @Output() colorPicked = new EventEmitter<ColorPickerResult>();

  /** Emitted when the popover should close without picking (Esc / outside click / Remove). */
  @Output() dismissed = new EventEmitter<void>();

  /** Working HEX text shown in the input. */
  hexInput: string = '#000000';

  /**
   * Standard 24-color Froala palette, arranged 3 rows × 8 columns. Light tones
   * on top, mid tones in the middle, dark tones at the bottom — matches the
   * reference screenshots from the user's Froala build.
   */
  readonly palette: readonly (readonly string[])[] = [
    [
      '#FFFFFF', '#FFEBEE', '#FFF3E0', '#FFFDE7',
      '#E8F5E9', '#E3F2FD', '#EDE7F6', '#F3E5F5',
    ],
    [
      '#FFCDD2', '#FFCC80', '#FFE082', '#C5E1A5',
      '#81D4FA', '#9FA8DA', '#CE93D8', '#F48FB1',
    ],
    [
      '#E53935', '#FB8C00', '#FDD835', '#43A047',
      '#1E88E5', '#5E35B1', '#8E24AA', '#F06292',
    ],
    [
      '#000000', '#424242', '#757575', '#9E9E9E',
      '#BDBDBD', '#E0E0E0', '#EEEEEE', '#FAFAFA',
    ],
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentColor'] || changes['mode']) {
      this.hexInput = this.normalizeHex(this.currentColor || this.defaultHexForMode());
    }
  }

  pickSwatch(color: string): void {
    this.hexInput = this.normalizeHex(color);
    this.emit(color);
  }

  onHexInputChange(value: string): void {
    // Strip whitespace and auto-prepend '#' if user typed without it.
    const trimmed = (value || '').trim();
    this.hexInput = trimmed.startsWith('#') ? trimmed : '#' + trimmed;
  }

  onHexSubmit(): void {
    const value = this.normalizeHex(this.hexInput);
    if (this.isValidHex(value)) {
      this.emit(value);
    } else {
      // Reset to current applied color if input is malformed.
      this.hexInput = this.normalizeHex(this.currentColor || this.defaultHexForMode());
    }
  }

  removeColor(): void {
    this.colorPicked.emit({ mode: this.mode, color: null });
    this.dismissed.emit();
  }

  isSwatchActive(color: string): boolean {
    return this.normalizeHex(color) === this.normalizeHex(this.currentColor);
  }

  isRemoveActive(): boolean {
    // Active when current color is empty or transparent (no color applied).
    const c = (this.currentColor || '').trim().toLowerCase();
    return !c || c === 'transparent' || c === 'inherit' || c === 'initial';
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) { return; }
    // The popover itself contains `wysiwyg-color-picker-popover` host; trigger
    // button is identified by `[data-cp-trigger]` set on the toolbar.
    if (target.closest('[data-cp-trigger]')) { return; }
    if (target.closest('wysiwyg-color-picker-popover')) { return; }
    this.dismissed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismissed.emit();
  }

  private emit(color: string): void {
    this.colorPicked.emit({ mode: this.mode, color: this.normalizeHex(color) });
    this.dismissed.emit();
  }

  private normalizeHex(value: string): string {
    if (!value) { return this.defaultHexForMode(); }
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'transparent') { return 'transparent'; }
    // Accept 3-digit hex shorthand and expand to 6-digit.
    if (/^#[0-9a-f]{3}$/.test(trimmed)) {
      return '#' + trimmed.slice(1).split('').map((c) => c + c).join('');
    }
    return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : this.defaultHexForMode();
  }

  private isValidHex(value: string): boolean {
    return /^#[0-9a-f]{6}$/.test(value.trim().toLowerCase()) || value.trim().toLowerCase() === 'transparent';
  }

  private defaultHexForMode(): string {
    return this.mode === 'background' ? '#FFFF00' : '#000000';
  }
}
