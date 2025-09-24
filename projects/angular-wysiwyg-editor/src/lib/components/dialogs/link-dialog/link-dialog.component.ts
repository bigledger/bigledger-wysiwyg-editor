import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Interface for link data
 */
export interface LinkData {
  url: string;
  text: string;
  title?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * Dialog component for creating and editing links
 */
@Component({
  selector: 'wysiwyg-link-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './link-dialog.component.html',
  styleUrls: ['./link-dialog.component.scss']
})
export class LinkDialogComponent implements OnInit {
  /** Whether the dialog is visible */
  @Input() visible = false;
  
  /** Existing link data for editing */
  @Input() linkData: LinkData | null = null;
  
  /** Whether we're editing an existing link */
  @Input() isEditing = false;
  
  /** Event emitted when link is created/updated */
  @Output() linkCreated = new EventEmitter<LinkData>();
  
  /** Event emitted when link is removed */
  @Output() linkRemoved = new EventEmitter<void>();
  
  /** Event emitted when dialog is closed */
  @Output() dialogClosed = new EventEmitter<void>();

  /** Form for link input */
  linkForm: FormGroup;

  /** URL validation pattern */
  private readonly urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  constructor(private formBuilder: FormBuilder) {
    this.linkForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.linkData) {
      this.populateForm(this.linkData);
    }
  }

  /**
   * Creates the reactive form for link input
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      url: ['', [Validators.required, this.urlValidator.bind(this)]],
      text: ['', Validators.required],
      title: [''],
      target: ['_blank']
    });
  }

  /**
   * Custom validator for URL format
   */
  private urlValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    const url = control.value.trim();
    
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return null;
    }

    // Check for valid URL pattern
    if (!this.urlPattern.test(url)) {
      return { invalidUrl: true };
    }

    return null;
  }

  /**
   * Populates the form with existing link data
   */
  private populateForm(data: LinkData): void {
    this.linkForm.patchValue({
      url: data.url,
      text: data.text,
      title: data.title || '',
      target: data.target || '_blank'
    });
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.linkForm.valid) {
      const formValue = this.linkForm.value;
      let url = formValue.url.trim();

      // Add protocol if missing for external URLs
      if (!url.startsWith('http://') && !url.startsWith('https://') && 
          !url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../')) {
        url = 'https://' + url;
      }

      const linkData: LinkData = {
        url,
        text: formValue.text.trim(),
        title: formValue.title?.trim() || undefined,
        target: formValue.target
      };

      this.linkCreated.emit(linkData);
      this.closeDialog();
    }
  }

  /**
   * Handles link removal
   */
  onRemoveLink(): void {
    this.linkRemoved.emit();
    this.closeDialog();
  }

  /**
   * Closes the dialog
   */
  closeDialog(): void {
    this.linkForm.reset();
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
    const field = this.linkForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['invalidUrl']) {
        return 'Please enter a valid URL';
      }
    }
    return '';
  }

  /**
   * Checks if a field has an error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.linkForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}