import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageDialogComponent } from './image-dialog.component';
import { ImageData } from '../../../models/image.interface';

describe('ImageDialogComponent', () => {
  let component: ImageDialogComponent;
  let fixture: ComponentFixture<ImageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImageDialogComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form', () => {
      expect(component.imageForm.get('src')?.value).toBe('');
      expect(component.imageForm.get('alt')?.value).toBe('');
      expect(component.imageForm.get('title')?.value).toBe('');
      expect(component.imageForm.get('width')?.value).toBe('');
      expect(component.imageForm.get('height')?.value).toBe('');
    });

    it('should populate form with existing image data', () => {
      const imageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        title: 'Test title',
        width: 300,
        height: 200
      };

      component.imageData = imageData;
      component.ngOnInit();

      expect(component.imageForm.get('src')?.value).toBe(imageData.src);
      expect(component.imageForm.get('alt')?.value).toBe(imageData.alt);
      expect(component.imageForm.get('title')?.value).toBe(imageData.title);
      expect(component.imageForm.get('width')?.value).toBe(imageData.width);
      expect(component.imageForm.get('height')?.value).toBe(imageData.height);
    });
  });

  describe('Tab Switching', () => {
    it('should start with URL tab active', () => {
      expect(component.activeTab).toBe('url');
    });

    it('should switch to upload tab', () => {
      component.switchTab('upload');
      expect(component.activeTab).toBe('upload');
    });

    it('should clear validators when switching to upload tab', () => {
      component.switchTab('upload');
      const srcControl = component.imageForm.get('src');
      expect(srcControl?.hasError('required')).toBeFalsy();
    });

    it('should set validators when switching to URL tab', () => {
      component.switchTab('upload');
      component.switchTab('url');
      
      const srcControl = component.imageForm.get('src');
      srcControl?.markAsTouched();
      srcControl?.updateValueAndValidity();
      
      expect(srcControl?.hasError('required')).toBeTruthy();
    });
  });

  describe('URL Validation', () => {
    beforeEach(() => {
      component.switchTab('url');
    });

    it('should accept valid HTTP URLs', () => {
      const srcControl = component.imageForm.get('src');
      srcControl?.setValue('https://example.com/image.jpg');
      srcControl?.markAsTouched();
      
      expect(srcControl?.hasError('invalidUrl')).toBeFalsy();
    });

    it('should accept relative URLs', () => {
      const srcControl = component.imageForm.get('src');
      srcControl?.setValue('/images/test.jpg');
      srcControl?.markAsTouched();
      
      expect(srcControl?.hasError('invalidUrl')).toBeFalsy();
    });

    it('should reject invalid URLs', () => {
      const srcControl = component.imageForm.get('src');
      srcControl?.setValue('invalid-url');
      srcControl?.markAsTouched();
      
      expect(srcControl?.hasError('invalidUrl')).toBeTruthy();
    });

    it('should require URL when in URL tab', () => {
      const srcControl = component.imageForm.get('src');
      srcControl?.setValue('');
      srcControl?.markAsTouched();
      
      expect(srcControl?.hasError('required')).toBeTruthy();
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      component.switchTab('upload');
    });

    it('should accept valid image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as any;
      
      spyOn(component as any, 'generatePreview');
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBe(file);
      expect((component as any).generatePreview).toHaveBeenCalledWith(file);
    });

    it('should reject unsupported file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [file] } } as any;
      
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBeNull();
      expect(component.imageForm.get('src')?.hasError('fileError')).toBeTruthy();
    });

    it('should reject files that are too large', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as any;
      
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBeNull();
      expect(component.imageForm.get('src')?.hasError('fileError')).toBeTruthy();
    });

    it('should handle empty file selection', () => {
      const event = { target: { files: [] } } as any;
      
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should require alt text', () => {
      const altControl = component.imageForm.get('alt');
      altControl?.setValue('');
      altControl?.markAsTouched();
      
      expect(altControl?.hasError('required')).toBeTruthy();
    });

    it('should validate width range', () => {
      const widthControl = component.imageForm.get('width');
      
      widthControl?.setValue(0);
      expect(widthControl?.hasError('min')).toBeTruthy();
      
      widthControl?.setValue(2001);
      expect(widthControl?.hasError('max')).toBeTruthy();
      
      widthControl?.setValue(500);
      expect(widthControl?.valid).toBeTruthy();
    });

    it('should validate height range', () => {
      const heightControl = component.imageForm.get('height');
      
      heightControl?.setValue(0);
      expect(heightControl?.hasError('min')).toBeTruthy();
      
      heightControl?.setValue(2001);
      expect(heightControl?.hasError('max')).toBeTruthy();
      
      heightControl?.setValue(300);
      expect(heightControl?.valid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should emit imageCreated event with valid URL form data', () => {
      spyOn(component.imageCreated, 'emit');
      spyOn(component, 'closeDialog');
      
      component.switchTab('url');
      component.imageForm.patchValue({
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        title: 'Test title',
        width: 300,
        height: 200
      });
      
      component.onSubmit();
      
      expect(component.imageCreated.emit).toHaveBeenCalledWith({
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        title: 'Test title',
        width: 300,
        height: 200
      });
      expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should emit imageCreated event with valid upload form data', () => {
      spyOn(component.imageCreated, 'emit');
      spyOn(component, 'closeDialog');
      
      component.switchTab('upload');
      component.selectedFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.previewUrl = 'data:image/jpeg;base64,test';
      component.imageForm.patchValue({
        alt: 'Test image'
      });
      
      component.onSubmit();
      
      expect(component.imageCreated.emit).toHaveBeenCalledWith({
        src: 'data:image/jpeg;base64,test',
        alt: 'Test image',
        title: undefined,
        width: undefined,
        height: undefined
      });
      expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should not submit invalid form', () => {
      spyOn(component.imageCreated, 'emit');
      
      component.imageForm.patchValue({
        src: '',
        alt: ''
      });
      
      component.onSubmit();
      
      expect(component.imageCreated.emit).not.toHaveBeenCalled();
    });

    it('should add protocol to URLs without protocol', () => {
      spyOn(component.imageCreated, 'emit');
      
      component.switchTab('url');
      component.imageForm.patchValue({
        src: 'example.com/image.jpg',
        alt: 'Test image'
      });
      
      component.onSubmit();
      
      expect(component.imageCreated.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          src: 'https://example.com/image.jpg'
        })
      );
    });
  });

  describe('Image Removal', () => {
    it('should emit imageRemoved event', () => {
      spyOn(component.imageRemoved, 'emit');
      spyOn(component, 'closeDialog');
      
      component.onRemoveImage();
      
      expect(component.imageRemoved.emit).toHaveBeenCalled();
      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Dialog Management', () => {
    it('should close dialog and reset form', () => {
      spyOn(component.dialogClosed, 'emit');
      
      component.imageForm.patchValue({
        src: 'test.jpg',
        alt: 'test'
      });
      component.selectedFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.previewUrl = 'test-url';
      component.activeTab = 'upload';
      
      component.closeDialog();
      
      expect(component.imageForm.get('src')?.value).toBe('');
      expect(component.imageForm.get('alt')?.value).toBe('');
      expect(component.selectedFile).toBeNull();
      expect(component.previewUrl).toBeNull();
      expect(component.activeTab).toBe('url');
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });

    it('should handle cancel action', () => {
      spyOn(component, 'closeDialog');
      
      component.onCancel();
      
      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return correct error messages', () => {
      const altControl = component.imageForm.get('alt');
      altControl?.setErrors({ required: true });
      altControl?.markAsTouched();
      
      expect(component.getFieldError('alt')).toBe('Alt is required');
    });

    it('should detect field errors', () => {
      const altControl = component.imageForm.get('alt');
      altControl?.setErrors({ required: true });
      altControl?.markAsTouched();
      
      expect(component.hasFieldError('alt')).toBeTruthy();
    });

    it('should return file error messages', () => {
      component.switchTab('upload');
      
      expect(component.getFileError()).toBe('Please select an image file');
    });

    it('should detect file errors', () => {
      component.switchTab('upload');
      
      expect(component.hasFileError()).toBeTruthy();
    });
  });

  describe('URL Preview', () => {
    it('should set preview URL when URL changes', () => {
      component.switchTab('url');
      component.imageForm.get('src')?.setValue('https://example.com/image.jpg');
      
      component.onUrlChange();
      
      expect(component.previewUrl).toBe('https://example.com/image.jpg');
    });

    it('should clear preview when URL is empty', () => {
      component.switchTab('url');
      component.previewUrl = 'test-url';
      component.imageForm.get('src')?.setValue('');
      
      component.onUrlChange();
      
      expect(component.previewUrl).toBeNull();
    });

    it('should not set preview when in upload tab', () => {
      component.switchTab('upload');
      component.imageForm.get('src')?.setValue('https://example.com/image.jpg');
      
      component.onUrlChange();
      
      expect(component.previewUrl).toBeNull();
    });
  });
});