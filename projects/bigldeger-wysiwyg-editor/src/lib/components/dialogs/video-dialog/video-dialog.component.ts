import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  VideoData,
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  detectVideoProvider,
  normalizeVideoUrl
} from '../../../models/video.interface';

/**
 * Dialog component for inserting embedded videos.
 * Supports three tabs: By URL, Embedded Code, and Upload Video.
 */
@Component({
  selector: 'wysiwyg-video-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  /** Optional upload handler for the Upload tab */
  @Input() uploadHandler?: (file: File) => Promise<string>;

  /** Event emitted when a video should be inserted */
  @Output() videoCreated = new EventEmitter<VideoData>();

  /** Event emitted when the dialog closes */
  @Output() dialogClosed = new EventEmitter<void>();

  videoForm: FormGroup;

  activeTab: 'url' | 'embed' | 'upload' = 'url';

  // Embed tab state
  embedCode = '';

  // Upload tab state
  uploadedFileName = '';
  uploadedVideoUrl = '';
  isDragOver = false;
  isUploading = false;
  uploadError: string | null = null;

  constructor(private formBuilder: FormBuilder) {
    this.videoForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.videoData) {
      if (this.videoData.embedHtml) {
        this.embedCode = this.videoData.embedHtml;
        this.activeTab = 'embed';
      } else {
        this.populateForm(this.videoData);
      }
    }
  }

  setTab(tab: 'url' | 'embed' | 'upload'): void {
    this.activeTab = tab;
  }

  /**
   * Get the currently detected provider label for helper copy.
   */
  get detectedProviderLabel(): string {
    const provider = detectVideoProvider(this.videoForm.get('url')?.value || '');
    switch (provider) {
      case 'youtube': return 'YouTube link detected';
      case 'vimeo': return 'Vimeo link detected';
      case 'direct': return 'Direct video file detected';
      default: return 'Supports YouTube, Vimeo, and direct MP4/WebM/Ogg links';
    }
  }

  /** Handle URL tab submission */
  onSubmit(): void {
    const urlControl = this.videoForm.get('url');
    if (!urlControl?.valid) {
      this.videoForm.markAllAsTouched();
      return;
    }
    const formValue = this.videoForm.getRawValue();
    const videoData: VideoData = {
      url: normalizeVideoUrl(formValue.url),
      width: DEFAULT_VIDEO_WIDTH,
      height: DEFAULT_VIDEO_HEIGHT
    };
    if (formValue.autoplay) {
      videoData.url = this.appendAutoplay(videoData.url);
    }
    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  /** Handle Embedded Code tab submission */
  onSubmitEmbed(): void {
    const code = this.embedCode.trim();
    if (!code) { return; }
    const videoData: VideoData = {
      url: '',
      embedHtml: code
    };
    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  /** Handle Upload tab submission */
  onSubmitUpload(): void {
    if (!this.uploadedVideoUrl) { return; }
    const videoData: VideoData = {
      url: this.uploadedVideoUrl,
      width: DEFAULT_VIDEO_WIDTH,
      height: DEFAULT_VIDEO_HEIGHT
    };
    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.handleVideoFile(file); }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.handleVideoFile(file); }
  }

  private async handleVideoFile(file: File): Promise<void> {
    this.uploadError = null;
    this.uploadedFileName = file.name;
    if (this.uploadHandler) {
      this.isUploading = true;
      try {
        this.uploadedVideoUrl = await this.uploadHandler(file);
      } catch {
        this.uploadError = 'Upload failed. Please try again.';
        this.uploadedVideoUrl = '';
      } finally {
        this.isUploading = false;
      }
    } else {
      // Fallback: use object URL for local preview/insert
      this.uploadedVideoUrl = URL.createObjectURL(file);
    }
  }

  closeDialog(): void {
    this.videoForm.reset({ url: '', autoplay: false });
    this.embedCode = '';
    this.uploadedFileName = '';
    this.uploadedVideoUrl = '';
    this.uploadError = null;
    this.activeTab = 'url';
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
    if (!field?.errors || !field.touched) { return ''; }
    if (field.errors['required']) { return 'URL is required'; }
    if (field.errors['invalidVideoUrl']) { return 'Enter a YouTube, Vimeo, or direct video file URL'; }
    return '';
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      url: ['', [Validators.required, this.videoUrlValidator.bind(this)]],
      autoplay: [false]
    });
  }

  private populateForm(data: VideoData): void {
    this.videoForm.patchValue({ url: data.url });
  }

  private videoUrlValidator(control: { value: string }): { [key: string]: any } | null {
    if (!control.value) { return null; }
    return detectVideoProvider(control.value) ? null : { invalidVideoUrl: true };
  }

  private appendAutoplay(url: string): string {
    try {
      const u = new URL(url);
      u.searchParams.set('autoplay', '1');
      return u.toString();
    } catch {
      return url;
    }
  }
}
