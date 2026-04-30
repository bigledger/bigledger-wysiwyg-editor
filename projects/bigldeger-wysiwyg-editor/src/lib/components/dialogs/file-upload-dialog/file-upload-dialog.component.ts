import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FileInsertData {
  url: string;
  filename: string;
}

@Component({
  selector: 'wysiwyg-file-upload-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wysiwyg-fu-overlay" *ngIf="visible" (click)="close()">
      <div class="wysiwyg-fu-dialog" (click)="$event.stopPropagation()">
        <div class="wysiwyg-fu-header">
          <h3>Upload File</h3>
          <button type="button" class="wysiwyg-fu-close" (click)="close()" aria-label="Close">×</button>
        </div>
        <div class="wysiwyg-fu-body">
          <div
            class="wysiwyg-fu-dropzone"
            [class.wysiwyg-fu-dropzone--over]="isDragOver"
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragOver = false"
            (drop)="onFileDrop($event)">
            <input #fileInput type="file" style="display:none" (change)="onFileChange($event)">
            <div *ngIf="!selectedFileName" class="wysiwyg-fu-hint">Drop file (or click)</div>
            <div *ngIf="selectedFileName" class="wysiwyg-fu-filename">{{ selectedFileName }}</div>
          </div>
          <div *ngIf="uploadError" class="wysiwyg-fu-error">{{ uploadError }}</div>
          <div class="wysiwyg-fu-actions">
            <button type="button" class="wysiwyg-btn wysiwyg-btn-secondary" (click)="close()">Cancel</button>
            <button type="button" class="wysiwyg-btn wysiwyg-btn-primary"
              [disabled]="!fileUrl || isUploading"
              (click)="onInsert()">
              {{ isUploading ? 'Uploading...' : 'Insert' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./file-upload-dialog.component.scss']
})
export class FileUploadDialogComponent {
  @Input() visible = false;
  @Input() uploadHandler?: (file: File) => Promise<string>;
  @Output() fileInserted = new EventEmitter<FileInsertData>();
  @Output() dialogClosed = new EventEmitter<void>();

  selectedFileName = '';
  fileUrl = '';
  isDragOver = false;
  isUploading = false;
  uploadError: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.handleFile(file); }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.handleFile(file); }
  }

  private async handleFile(file: File): Promise<void> {
    this.uploadError = null;
    this.selectedFileName = file.name;
    if (this.uploadHandler) {
      this.isUploading = true;
      try {
        this.fileUrl = await this.uploadHandler(file);
      } catch {
        this.uploadError = 'Upload failed. Please try again.';
        this.fileUrl = '';
      } finally {
        this.isUploading = false;
      }
    } else {
      this.fileUrl = URL.createObjectURL(file);
    }
  }

  onInsert(): void {
    if (!this.fileUrl) { return; }
    this.fileInserted.emit({ url: this.fileUrl, filename: this.selectedFileName });
    this.reset();
    this.close();
  }

  close(): void {
    this.reset();
    this.dialogClosed.emit();
  }

  private reset(): void {
    this.selectedFileName = '';
    this.fileUrl = '';
    this.uploadError = null;
    this.isUploading = false;
  }
}
