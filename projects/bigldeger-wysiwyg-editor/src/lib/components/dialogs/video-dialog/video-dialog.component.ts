import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  VideoData,
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  detectVideoProvider,
  normalizeVideoUrl
} from '../../../models/video.interface';

/** Zero-arg handler that opens a media library and resolves with a video URL. */
export type VideoMediaLibraryHandler = () => Promise<string>;

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

  /**
   * Optional media-library handler for the Upload tab.
   * When set, clicking the upload zone calls this function instead of the
   * native file picker. The resolved URL is inserted as a video URL.
   */
  @Input() uploadHandler?: VideoMediaLibraryHandler;

  /** Event emitted when a video should be inserted */
  @Output() videoCreated = new EventEmitter<VideoData>();

  /** Event emitted when the dialog closes */
  @Output() dialogClosed = new EventEmitter<void>();

  videoForm: FormGroup;

  activeTab: 'url' | 'embed' | 'upload' = 'url';

  // Embed tab state
  embedCode = '';

  // Shared dimensions
  videoWidth: number = DEFAULT_VIDEO_WIDTH;
  videoHeight: number = DEFAULT_VIDEO_HEIGHT;

  // Upload tab state
  uploadedFileName = '';
  uploadedVideoUrl = '';
  isDragOver = false;
  isUploading = false;
  uploadError: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef
  ) {
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
    // Trigger change detection so *ngIf="visible" resolves after dynamic load
    this.cdr.detectChanges();
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
      width: this.videoWidth,
      height: this.videoHeight
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
      embedHtml: code,
      width: this.videoWidth,
      height: this.videoHeight
    };
    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  /** Handle Upload tab submission (fallback for drag-drop / file-picker path) */
  onSubmitUpload(): void {
    if (!this.uploadedVideoUrl) { return; }
    const videoData: VideoData = {
      url: this.uploadedVideoUrl,
      width: this.videoWidth,
      height: this.videoHeight
    };
    this.videoCreated.emit(videoData);
    this.closeDialog();
  }

  /**
   * Open the media-library handler (Upload tab primary action).
   * Resolves with a URL and immediately inserts the video — same flow as URL tab.
   */
  async pickFromMediaLibrary(): Promise<void> {
    if (!this.uploadHandler) { return; }
    this.isUploading = true;
    this.uploadError = null;
    this.cdr.detectChanges();
    try {
      const url = await this.uploadHandler();
      if (!url) {
        this.isUploading = false;
        this.cdr.detectChanges();
        return;
      }
      // Use a <video> element for direct cloud/file URLs so the browser can
      // play the file inline instead of triggering a download.
      const videoHtml = `<video src="${url}" width="${this.videoWidth}" height="${this.videoHeight}" controls></video>`;
      const videoData: VideoData = {
        url: '',
        embedHtml: videoHtml
      };
      this.videoCreated.emit(videoData);
      this.closeDialog();
    } catch {
      this.uploadError = 'No video selected.';
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (this.uploadHandler) { return; } // media-library mode — ignore drops
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
    this.isUploading = true;
    try {
      // Fallback: object URL for local preview/insert when no handler provided
      this.uploadedVideoUrl = URL.createObjectURL(file);
    } catch {
      this.uploadError = 'Could not read the selected file.';
      this.uploadedVideoUrl = '';
    } finally {
      this.isUploading = false;
    }
  }

  closeDialog(): void {
    this.videoForm.reset({ url: '', autoplay: false });
    this.embedCode = '';
    this.uploadedFileName = '';
    this.uploadedVideoUrl = '';
    this.uploadError = null;
    this.activeTab = 'url';
    this.videoWidth = DEFAULT_VIDEO_WIDTH;
    this.videoHeight = DEFAULT_VIDEO_HEIGHT;
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
