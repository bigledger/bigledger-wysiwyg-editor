import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageData } from '../../../models/image.interface';

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
export class ImageDialogComponent implements OnInit {
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
  activeTab: 'upload' | 'url' = 'url';

  /** Selected file for upload */
  selectedFile: File | null = null;

  /** Preview URL for selected image */
  previewUrl: string | null = null;

  /** Supported image formats */
  private readonly supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  /** Maximum file size (5MB) */
  private readonly maxFileSize = 5 * 1024 * 1024;

  constructor(private formBuilder: FormBuilder) {
    this.imageForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.imageData) {
      this.populateForm(this.imageData);
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
   * Switches between upload and URL tabs
   */
  switchTab(tab: 'upload' | 'url'): void {
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
   * Handles file selection for upload
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
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

    this.selectedFile = file;
    this.clearFileError();
    this.generatePreview(file);
  }

  /**
   * Generates preview for selected file
   */
  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      
      // Auto-fill alt text with filename if empty
      if (!this.imageForm.get('alt')?.value) {
        const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        this.imageForm.patchValue({ alt: filename });
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Handles URL input change for preview
   */
  onUrlChange(): void {
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
  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.imageForm.value;
      let src = '';

      if (this.activeTab === 'upload' && this.selectedFile) {
        // For file upload, use the preview URL (data URL)
        // In a real implementation, you'd upload to a server and get back a URL
        src = this.previewUrl || '';
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
    this.activeTab = 'url';
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
}