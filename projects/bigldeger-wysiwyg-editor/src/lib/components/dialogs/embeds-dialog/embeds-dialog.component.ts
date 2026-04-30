import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'wysiwyg-embeds-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wysiwyg-embeds-overlay" *ngIf="visible" (click)="close()">
      <div class="wysiwyg-embeds-dialog" (click)="$event.stopPropagation()">
        <div class="wysiwyg-embeds-header">
          <h3>Embed URL</h3>
          <button type="button" class="wysiwyg-embeds-close" (click)="close()" aria-label="Close">×</button>
        </div>
        <div class="wysiwyg-embeds-body">
          <div class="wysiwyg-form-group">
            <label for="embedUrl">Paste in a URL to embed</label>
            <input
              id="embedUrl"
              type="url"
              class="wysiwyg-embeds-input"
              [(ngModel)]="url"
              placeholder="https://..."
              autocomplete="url">
          </div>
          <div class="wysiwyg-embeds-actions">
            <button type="button" class="wysiwyg-btn wysiwyg-btn-secondary" (click)="close()">Cancel</button>
            <button type="button" class="wysiwyg-btn wysiwyg-btn-primary"
              [disabled]="!url.trim()"
              (click)="onInsert()">
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./embeds-dialog.component.scss']
})
export class EmbedsDialogComponent {
  @Input() visible = false;
  @Output() embedInserted = new EventEmitter<string>();
  @Output() dialogClosed = new EventEmitter<void>();

  url = '';

  onInsert(): void {
    const trimmed = this.url.trim();
    if (!trimmed) { return; }
    this.embedInserted.emit(trimmed);
    this.url = '';
    this.close();
  }

  close(): void {
    this.url = '';
    this.dialogClosed.emit();
  }
}
