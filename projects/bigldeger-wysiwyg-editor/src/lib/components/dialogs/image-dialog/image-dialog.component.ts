import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageData, DEFAULT_IMAGE_UPLOAD_CONFIG } from '../../../models/image.interface';

/**
 * Dialog component for inserting images via upload or URL
 */
@Component({
  selector: 'wysiwyg-image-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss']
})
export class ImageDialogComponent implements OnInit, OnChanges {
  /** Whether the dialog is visible */
  @Input() visible = false;
  
  /** Existing image data for editing */
  @Input() imageData: ImageData | null = null;
  
  /** Whether we're editing an existing image */
  @Input() isEditing = false;
  
  /** Event emitted when image is created/updated */
  @Output() imageCreated = new EventEmitter<ImageData>();
  
  /** Event emitted when image is removed */
  @Output() imageRemoved = new EventEmitter<void>();
  
  /** Event emitted when dialog is closed */
  @Output() dialogClosed = new EventEmitter<void>();

  /** Form for image input */
  imageForm: FormGroup;

  /** Current tab: 'upload' or 'url' */
  activeTab: 'upload' | 'url' = 'upload';

  /** Selected file for upload */
  selectedFile: File | null = null;

  /** Preview URL for selected image */
  previewUrl: string | null = null;

  /** Supported image formats */
  @Input() supportedFormats = [...DEFAULT_IMAGE_UPLOAD_CONFIG.allowedFormats];

  /** Maximum file size (5MB) */
  @Input() maxFileSize = DEFAULT_IMAGE_UPLOAD_CONFIG.maxFileSize;

  /** Upload progress percentage */
  uploadProgress = 0;

  /** Whether an upload is in progress */
  isUploading = false;

  /** Error message for upload failures */
  uploadError: string | null = null;

  /** Drag over state for drop zone */
  isDragOver = false;

  /** Upload handler function */
  @Input() uploadHandler?: (file: File) => Promise<string>;

  /** Whether URL-based image insertion should be available */
  @Input() allowUrlInput = DEFAULT_IMAGE_UPLOAD_CONFIG.allowUrlInput;

  /** Whether file upload should be available */
  @Input() allowFileUpload = DEFAULT_IMAGE_UPLOAD_CONFIG.allowFileUpload;

  /** Maximum image dimensions */
  @Input() maxWidth = DEFAULT_IMAGE_UPLOAD_CONFIG.maxWidth;
  @Input() maxHeight = DEFAULT_IMAGE_UPLOAD_CONFIG.maxHeight;

  /** Whether to auto-resize large images */
  @Input() autoResize = DEFAULT_IMAGE_UPLOAD_CONFIG.autoResize;

  /** JPEG compression quality (0-1) */
  @Input() quality = DEFAULT_IMAGE_UPLOAD_CONFIG.quality;

  /** Reference to the file input element */
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private formBuilder: FormBuilder) {
    this.imageForm = this.createForm();
  }

  ngOnInit(): void {
    this.syncDialogState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['imageData'] ||
      changes['allowUrlInput'] ||
      changes['allowFileUpload'] ||
      changes['visible']
    ) {
      this.syncDialogState();
    }
  }

  /**
   * Creates the reactive form for image input
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      src: ['', [Validators.required, this.urlValidator.bind(this)]],
      alt: ['', Validators.required],
      title: [''],
      width: ['', [Validators.min(1), Validators.max(2000)]],
      height: ['', [Validators.min(1), Validators.max(2000)]]
    });
  }

  /**
   * Custom validator for URL format
   */
  private urlValidator(control: any): { [key: string]: any } | null {
    if (!control.value || this.activeTab === 'upload') {
      return null;
    }

    const url = control.value.trim();
    
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return null;
    }

    // Check for valid URL pattern
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      return { invalidUrl: true };
    }

    return null;
  }

  /**
   * Populates the form with existing image data
   */
  private populateForm(data: ImageData): void {
    this.imageForm.patchValue({
      src: data.src,
      alt: data.alt,
      title: data.title || '',
      width: data.width || '',
      height: data.height || ''
    });

    // Set preview URL for existing image
    this.previewUrl = data.src;
  }

  /**
   * Synchronizes the dialog with the current inputs.
   */
  private syncDialogState(): void {
    if (!this.allowUrlInput && this.allowFileUpload) {
      this.activeTab = 'upload';
    } else if (!this.allowFileUpload && this.allowUrlInput) {
      this.activeTab = 'url';
    } else if (!this.allowUrlInput && !this.allowFileUpload) {
      this.activeTab = 'upload';
    }

    if (this.imageData) {
      this.populateForm(this.imageData);
    } else if (!this.visible) {
      this.imageForm.reset({
        src: '',
        alt: '',
        title: '',
        width: '',
        height: ''
      });
      this.clearPreview();
    }
  }

  /**
   * Switches between upload and URL tabs
   */
  switchTab(tab: 'upload' | 'url'): void {
    if ((tab === 'upload' && !this.allowFileUpload) || (tab === 'url' && !this.allowUrlInput)) {
      return;
    }

    this.activeTab = tab;
    
    // Clear form and preview when switching tabs
    if (tab === 'upload') {
      this.imageForm.get('src')?.clearValidators();
      this.imageForm.get('src')?.updateValueAndValidity();
    } else {
      this.imageForm.get('src')?.setValidators([Validators.required, this.urlValidator.bind(this)]);
      this.imageForm.get('src')?.updateValueAndValidity();
      this.selectedFile = null;
    }
    
    this.clearPreview();
  }

  /**
   * Triggers the hidden file input when the button is clicked
   */
  triggerFileInput(): void {
    if (!this.allowFileUpload) {
      return;
    }

    this.fileInput?.nativeElement?.click();
  }

  /**
   * Handles file selection for upload
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    await this.processFile(file);
  }

  /**
   * Processes and validates the selected file
   */
  private async processFile(file: File): Promise<void> {
    if (!this.allowFileUpload) {
      return;
    }

    // Validate file type
    if (!this.supportedFormats.includes(file.type)) {
      this.setFileError('Unsupported file format. Please use JPEG, PNG, GIF, WebP, or SVG.');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.setFileError('File size too large. Maximum size is 5MB.');
      return;
    }

    this.uploadError = null;
    this.clearFileError();

    // Check if image needs resizing
    if (this.autoResize && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      try {
        const resizedFile = await this.resizeImageIfNeeded(file);
        this.selectedFile = resizedFile;
        await this.generatePreview(resizedFile);
      } catch (error) {
        console.error('Error resizing image:', error);
        this.selectedFile = file;
        await this.generatePreview(file);
      }
    } else {
      this.selectedFile = file;
      await this.generatePreview(file);
    }
  }

  /**
   * Resizes image if it exceeds maximum dimensions
   */
  private async resizeImageIfNeeded(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        let { width, height } = img;
        
        // Check if resize is needed
        if (width <= this.maxWidth && height <= this.maxHeight) {
          resolve(file);
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(this.maxWidth / width, this.maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          this.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Handles drag over event
   */
  onDragOver(event: DragEvent): void {
    if (!this.allowFileUpload) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Handles drag leave event
   */
  onDragLeave(event: DragEvent): void {
    if (!this.allowFileUpload) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Handles drop event
   */
  async onDrop(event: DragEvent): Promise<void> {
    if (!this.allowFileUpload) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.processFile(files[0]);
    }
  }

  /**
   * Generates preview for selected file
   */
  private async generatePreview(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
        
        // Auto-fill alt text with filename if empty
        if (!this.imageForm.get('alt')?.value) {
          const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          this.imageForm.patchValue({ alt: filename });
        }
        resolve();
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handles URL input change for preview
   */
  onUrlChange(): void {
    if (!this.allowUrlInput) {
      this.clearPreview();
      return;
    }

    const url = this.imageForm.get('src')?.value?.trim();
    if (url && this.activeTab === 'url') {
      this.previewUrl = url;
    } else {
      this.clearPreview();
    }
  }

  /**
   * Clears the image preview
   */
  private clearPreview(): void {
    this.previewUrl = null;
  }

  /**
   * Sets file validation error
   */
  private setFileError(message: string): void {
    this.imageForm.get('src')?.setErrors({ fileError: message });
  }

  /**
   * Clears file validation error
   */
  private clearFileError(): void {
    const srcControl = this.imageForm.get('src');
    if (srcControl?.errors?.['fileError']) {
      delete srcControl.errors['fileError'];
      if (Object.keys(srcControl.errors).length === 0) {
        srcControl.setErrors(null);
      }
    }
  }

  /**
   * Handles form submission
   */
  async onSubmit(): Promise<void> {
    if (this.isFormValid()) {
      const formValue = this.imageForm.value;
      let src = '';

      if (this.activeTab === 'upload' && this.selectedFile) {
        // If custom upload handler is provided, use it
        if (this.uploadHandler) {
          try {
            this.isUploading = true;
            this.uploadProgress = 0;
            this.uploadError = null;

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
              if (this.uploadProgress < 90) {
                this.uploadProgress += 10;
              }
            }, 200);

            src = await this.uploadHandler(this.selectedFile);

            clearInterval(progressInterval);
            this.uploadProgress = 100;
            this.isUploading = false;
          } catch (error) {
            this.isUploading = false;
            this.uploadProgress = 0;
            this.uploadError = error instanceof Error ? error.message : 'Upload failed';
            return;
          }
        } else {
          // For file upload without handler, use the preview URL (data URL)
          src = this.previewUrl || '';
        }
      } else {
        // For URL input, process the URL
        src = formValue.src?.trim() || '';
        
        // Add protocol if missing for external URLs
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && 
            !src.startsWith('/') && !src.startsWith('./') && !src.startsWith('../')) {
          src = 'https://' + src;
        }
      }

      const imageData: ImageData = {
        src,
        alt: formValue.alt?.trim() || '',
        title: formValue.title?.trim() || undefined,
        width: formValue.width ? parseInt(formValue.width, 10) : undefined,
        height: formValue.height ? parseInt(formValue.height, 10) : undefined
      };

      this.imageCreated.emit(imageData);
      this.closeDialog();
    }
  }

  /**
   * Checks if form is valid based on current tab
   */
  isFormValid(): boolean {
    const altValid = this.imageForm.get('alt')?.valid;
    
    if (this.activeTab === 'upload') {
      return !!(altValid && this.selectedFile && this.previewUrl);
    } else {
      return !!(altValid && this.imageForm.get('src')?.valid);
    }
  }

  /**
   * Handles image removal
   */
  onRemoveImage(): void {
    this.imageRemoved.emit();
    this.closeDialog();
  }

  /**
   * Closes the dialog
   */
  closeDialog(): void {
    this.imageForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.activeTab = this.allowFileUpload ? 'upload' : 'url';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadError = null;
    this.isDragOver = false;
    this.dialogClosed.emit();
  }

  /**
   * Handles cancel action
   */
  onCancel(): void {
    this.closeDialog();
  }

  /**
   * Gets error message for a form field
   */
  getFieldError(fieldName: string): string {
    const field = this.imageForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['invalidUrl']) {
        return 'Please enter a valid URL';
      }
      if (field.errors['min']) {
        return `Minimum value is ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Maximum value is ${field.errors['max'].max}`;
      }
      if (field.errors['fileError']) {
        return field.errors['fileError'];
      }
    }
    return '';
  }

  /**
   * Checks if a field has an error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.imageForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Whether both insertion modes are available.
   */
  get hasMultipleInputModes(): boolean {
    return this.allowUrlInput && this.allowFileUpload;
  }

  /**
   * File input accept attribute derived from allowed formats.
   */
  get fileAccept(): string {
    return (this.supportedFormats && this.supportedFormats.length > 0)
      ? this.supportedFormats.join(',')
      : 'image/*';
  }

  /**
   * Gets file upload error message
   */
  getFileError(): string {
    if (this.activeTab === 'upload' && !this.selectedFile) {
      return 'Please select an image file';
    }
    return this.getFieldError('src');
  }

  /**
   * Checks if file upload has error
   */
  hasFileError(): boolean {
    return this.activeTab === 'upload' && (!this.selectedFile || this.hasFieldError('src'));
  }

  /**
   * Formats file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
