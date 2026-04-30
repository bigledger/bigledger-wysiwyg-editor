import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

const SPECIAL_CHARS: Array<{ char: string; name: string }> = [
  { char: '©', name: 'Copyright' },
  { char: '®', name: 'Registered' },
  { char: '™', name: 'Trademark' },
  { char: '€', name: 'Euro' },
  { char: '£', name: 'Pound' },
  { char: '¥', name: 'Yen' },
  { char: '¢', name: 'Cent' },
  { char: '¤', name: 'Currency' },
  { char: '°', name: 'Degree' },
  { char: '±', name: 'Plus-Minus' },
  { char: '×', name: 'Multiply' },
  { char: '÷', name: 'Divide' },
  { char: '≠', name: 'Not Equal' },
  { char: '≤', name: 'Less or Equal' },
  { char: '≥', name: 'Greater or Equal' },
  { char: '≈', name: 'Approximately' },
  { char: '∞', name: 'Infinity' },
  { char: '√', name: 'Square Root' },
  { char: 'π', name: 'Pi' },
  { char: 'Ω', name: 'Omega' },
  { char: 'μ', name: 'Micro' },
  { char: 'Σ', name: 'Sigma' },
  { char: 'Δ', name: 'Delta' },
  { char: 'α', name: 'Alpha' },
  { char: 'β', name: 'Beta' },
  { char: 'γ', name: 'Gamma' },
  { char: '→', name: 'Right Arrow' },
  { char: '←', name: 'Left Arrow' },
  { char: '↑', name: 'Up Arrow' },
  { char: '↓', name: 'Down Arrow' },
  { char: '↔', name: 'Left-Right Arrow' },
  { char: '⇒', name: 'Double Right Arrow' },
  { char: '⇐', name: 'Double Left Arrow' },
  { char: '♠', name: 'Spade' },
  { char: '♥', name: 'Heart' },
  { char: '♦', name: 'Diamond' },
  { char: '♣', name: 'Club' },
  { char: '★', name: 'Star' },
  { char: '☆', name: 'Empty Star' },
  { char: '•', name: 'Bullet' },
  { char: '·', name: 'Middle Dot' },
  { char: '…', name: 'Ellipsis' },
  { char: '–', name: 'En Dash' },
  { char: '—', name: 'Em Dash' },
  { char: '"', name: 'Open Quote' },
  { char: '"', name: 'Close Quote' },
  { char: '\u2018', name: 'Open Single Quote' },
  { char: '\u2019', name: 'Close Single Quote' },
  { char: '«', name: 'Left Guillemet' },
  { char: '»', name: 'Right Guillemet' },
  { char: '¿', name: 'Inverted Question' },
  { char: '¡', name: 'Inverted Exclamation' },
  { char: '§', name: 'Section' },
  { char: '¶', name: 'Pilcrow' },
  { char: '†', name: 'Dagger' },
  { char: '‡', name: 'Double Dagger' },
  { char: 'ª', name: 'Feminine Ordinal' },
  { char: 'º', name: 'Masculine Ordinal' },
  { char: '½', name: 'One Half' },
  { char: '¼', name: 'One Quarter' },
  { char: '¾', name: 'Three Quarters' },
  { char: 'Æ', name: 'AE' },
  { char: 'æ', name: 'ae' },
  { char: 'Ø', name: 'O Slash' },
  { char: 'ø', name: 'o Slash' },
  { char: 'Å', name: 'A Ring' },
  { char: 'å', name: 'a Ring' },
  { char: 'Ñ', name: 'N Tilde' },
  { char: 'ñ', name: 'n Tilde' },
];

@Component({
  selector: 'wysiwyg-special-chars-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wysiwyg-sc-overlay" *ngIf="visible" (click)="close()">
      <div class="wysiwyg-sc-dialog" (click)="$event.stopPropagation()">
        <div class="wysiwyg-sc-header">
          <span class="wysiwyg-sc-title">Special Characters</span>
          <button type="button" class="wysiwyg-sc-close" (click)="close()" aria-label="Close">×</button>
        </div>
        <div class="wysiwyg-sc-grid">
          <button
            *ngFor="let item of chars"
            type="button"
            class="wysiwyg-sc-char"
            [attr.title]="item.name"
            (click)="selectChar(item.char)">
            {{ item.char }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./special-chars-dialog.component.scss']
})
export class SpecialCharsDialogComponent {
  @Input() visible = false;
  @Output() charSelected = new EventEmitter<string>();
  @Output() dialogClosed = new EventEmitter<void>();

  chars = SPECIAL_CHARS;

  selectChar(char: string): void {
    this.charSelected.emit(char);
    this.close();
  }

  close(): void {
    this.dialogClosed.emit();
  }
}
