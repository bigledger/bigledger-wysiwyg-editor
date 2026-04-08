import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  VideoData,
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  detectVideoProvider,
  normalizeVideoUrl
} from '../../../models/video.interface';

/**
 * Dialog component for inserting embedded videos.
 */
@Component({
  selector: 'wysiwyg-video-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './video-dialog.component.html',
  styleUrls: ['./video-dialog.component.scss']
})
export class VideoDialogComponent implements OnInit {
  /** Whether the dialog is visible */
  @Input() visible = false;

  /** Existing video data for editing */
  @Input() videoData: VideoData | null = null;

  /** Whether we are editing an existing video */
  @Input() isEditing = false;

  /** Event emitted when a video should be inserted */
  @Output() videoCreated = new EventEmitter<VideoData>();

  /** Event emitted when the dialog closes */
  @Output() dialogClosed = new EventEmitter<void>();

  videoForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.videoForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.videoData) {
      this.populateForm(this.videoData);
    }
  }

  /**
   * Get the currently detected provider label for helper copy.
   */
  get detectedProviderLabel(): string {
    const provider = detectVideoProvider(this.videoForm.get('url')?.value || '');

    switch (provider) {
      case 'youtube':
        return 'YouTube link detected';
      case 'vimeo':
        return 'Vimeo link detected';
      case 'direct':
        return 'Direct video file detected';
      default:
        return 'Supports YouTube, Vimeo, and direct MP4/WebM/Ogg links';
    }
  }

  /**
   * Handle dialog submission.
   */
  onSubmit(): void {
    if (!this.videoForm.valid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    const formValue = this.videoForm.getRawValue();
    const videoData: VideoData = {
      url: normalizeVideoUrl(formValue.url),
      title: formValue.title?.trim() || undefined,
      width: Number(formValue.width) || DEFAULT_VIDEO_WIDTH,
      height: Number(formValue.height) || DEFAULT_VIDEO_HEIGHT
    };

    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  /**
   * Close the dialog and reset transient state.
   */
  closeDialog(): void {
    this.videoForm.reset({
      url: '',
      title: '',
      width: DEFAULT_VIDEO_WIDTH,
      height: DEFAULT_VIDEO_HEIGHT
    });
    this.dialogClosed.emit();
  }

  onCancel(): void {
    this.closeDialog();
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.videoForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.videoForm.get(fieldName);
    if (!field?.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    if (field.errors['invalidVideoUrl']) {
      return 'Enter a YouTube, Vimeo, or direct video file URL';
    }

    if (field.errors['min']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be greater than 0`;
    }

    if (field.errors['max']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too large`;
    }

    return '';
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      url: ['', [Validators.required, this.videoUrlValidator.bind(this)]],
      title: [''],
      width: [DEFAULT_VIDEO_WIDTH, [Validators.min(1), Validators.max(3840)]],
      height: [DEFAULT_VIDEO_HEIGHT, [Validators.min(1), Validators.max(2160)]]
    });
  }

  private populateForm(data: VideoData): void {
    this.videoForm.patchValue({
      url: data.url,
      title: data.title || '',
      width: data.width || DEFAULT_VIDEO_WIDTH,
      height: data.height || DEFAULT_VIDEO_HEIGHT
    });
  }

  private videoUrlValidator(control: { value: string }): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    return detectVideoProvider(control.value) ? null : { invalidVideoUrl: true };
  }
}
