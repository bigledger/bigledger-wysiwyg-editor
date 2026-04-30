import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'wysiwyg-bookmark-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wysiwyg-bm-overlay" *ngIf="visible" (click)="close()">
      <div class="wysiwyg-bm-dialog" (click)="$event.stopPropagation()">
        <div class="wysiwyg-bm-header">
          <h3>Insert Bookmark</h3>
          <button type="button" class="wysiwyg-bm-close" (click)="close()" aria-label="Close">×</button>
        </div>
        <div class="wysiwyg-bm-body">
          <div class="wysiwyg-form-group">
            <label for="bookmarkId">Bookmark ID</label>
            <input
              id="bookmarkId"
              type="text"
              class="wysiwyg-bm-input"
              [(ngModel)]="bookmarkId"
              placeholder="e.g. section-1"
              autocomplete="off">
            <span class="wysiwyg-bm-hint">Creates an anchor tag at the cursor position that can be linked to with #{{ bookmarkId || 'id' }}</span>
          </div>
          <div *ngIf="validationError" class="wysiwyg-bm-error">{{ validationError }}</div>
          <div class="wysiwyg-bm-actions">
            <button type="button" class="wysiwyg-btn wysiwyg-btn-secondary" (click)="close()">Cancel</button>
            <button type="button" class="wysiwyg-btn wysiwyg-btn-primary"
              [disabled]="!bookmarkId.trim()"
              (click)="onInsert()">
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./bookmark-dialog.component.scss']
})
export class BookmarkDialogComponent {
  @Input() visible = false;
  @Output() bookmarkInserted = new EventEmitter<string>();
  @Output() dialogClosed = new EventEmitter<void>();

  bookmarkId = '';
  validationError = '';

  onInsert(): void {
    const id = this.bookmarkId.trim();
    if (!id) { return; }
    // Validate: only letters, digits, hyphens, underscores
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id)) {
      this.validationError = 'ID must start with a letter and contain only letters, numbers, hyphens, or underscores.';
      return;
    }
    this.bookmarkInserted.emit(id);
    this.bookmarkId = '';
    this.validationError = '';
    this.close();
  }

  close(): void {
    this.bookmarkId = '';
    this.validationError = '';
    this.dialogClosed.emit();
  }
}
