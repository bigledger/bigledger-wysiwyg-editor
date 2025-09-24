import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LinkDialogComponent, LinkData } from './link-dialog.component';

describe('LinkDialogComponent', () => {
  let component: LinkDialogComponent;
  let fixture: ComponentFixture<LinkDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LinkDialogComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LinkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should require URL field', () => {
      const urlControl = component.linkForm.get('url');
      expect(urlControl?.valid).toBeFalsy();
      expect(urlControl?.errors?.['required']).toBeTruthy();
    });

    it('should require text field', () => {
      const textControl = component.linkForm.get('text');
      expect(textControl?.valid).toBeFalsy();
      expect(textControl?.errors?.['required']).toBeTruthy();
    });

    it('should validate URL format', () => {
      const urlControl = component.linkForm.get('url');
      
      // Invalid URLs
      urlControl?.setValue('invalid-url');
      expect(urlControl?.errors?.['invalidUrl']).toBeTruthy();
      
      urlControl?.setValue('not a url');
      expect(urlControl?.errors?.['invalidUrl']).toBeTruthy();
      
      // Valid URLs
      urlControl?.setValue('https://example.com');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
      
      urlControl?.setValue('http://test.org');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
      
      urlControl?.setValue('example.com');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
      
      // Relative URLs should be valid
      urlControl?.setValue('/relative/path');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
      
      urlControl?.setValue('./relative/path');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
      
      urlControl?.setValue('../relative/path');
      expect(urlControl?.errors?.['invalidUrl']).toBeFalsy();
    });

    it('should accept title as optional', () => {
      const titleControl = component.linkForm.get('title');
      expect(titleControl?.valid).toBeTruthy();
      
      titleControl?.setValue('Optional title');
      expect(titleControl?.valid).toBeTruthy();
    });

    it('should have default target value', () => {
      const targetControl = component.linkForm.get('target');
      expect(targetControl?.value).toBe('_blank');
    });
  });

  describe('Form Population', () => {
    it('should populate form when linkData is provided', () => {
      const linkData: LinkData = {
        url: 'https://example.com',
        text: 'Example Link',
        title: 'Example Title',
        target: '_self'
      };

      component.linkData = linkData;
      component.ngOnInit();

      expect(component.linkForm.get('url')?.value).toBe('https://example.com');
      expect(component.linkForm.get('text')?.value).toBe('Example Link');
      expect(component.linkForm.get('title')?.value).toBe('Example Title');
      expect(component.linkForm.get('target')?.value).toBe('_self');
    });

    it('should handle linkData without optional fields', () => {
      const linkData: LinkData = {
        url: 'https://example.com',
        text: 'Example Link'
      };

      component.linkData = linkData;
      component.ngOnInit();

      expect(component.linkForm.get('url')?.value).toBe('https://example.com');
      expect(component.linkForm.get('text')?.value).toBe('Example Link');
      expect(component.linkForm.get('title')?.value).toBe('');
      expect(component.linkForm.get('target')?.value).toBe('_blank');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.linkForm.patchValue({
        url: 'example.com',
        text: 'Test Link',
        title: 'Test Title',
        target: '_blank'
      });
    });

    it('should emit linkCreated event with correct data on valid submission', () => {
      spyOn(component.linkCreated, 'emit');
      spyOn(component, 'closeDialog');

      component.onSubmit();

      expect(component.linkCreated.emit).toHaveBeenCalledWith({
        url: 'https://example.com',
        text: 'Test Link',
        title: 'Test Title',
        target: '_blank'
      });
      expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should add https protocol to URLs without protocol', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({ url: 'example.com' });
      component.onSubmit();

      const emittedData = (component.linkCreated.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.url).toBe('https://example.com');
    });

    it('should not modify URLs that already have protocol', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({ url: 'http://example.com' });
      component.onSubmit();

      const emittedData = (component.linkCreated.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.url).toBe('http://example.com');
    });

    it('should not modify relative URLs', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({ url: '/relative/path' });
      component.onSubmit();

      const emittedData = (component.linkCreated.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.url).toBe('/relative/path');
    });

    it('should not submit invalid form', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({ url: '', text: '' });
      component.onSubmit();

      expect(component.linkCreated.emit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({
        url: '  example.com  ',
        text: '  Test Link  ',
        title: '  Test Title  '
      });
      component.onSubmit();

      const emittedData = (component.linkCreated.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.url).toBe('https://example.com');
      expect(emittedData.text).toBe('Test Link');
      expect(emittedData.title).toBe('Test Title');
    });

    it('should handle empty title by setting it to undefined', () => {
      spyOn(component.linkCreated, 'emit');
      
      component.linkForm.patchValue({ title: '' });
      component.onSubmit();

      const emittedData = (component.linkCreated.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.title).toBeUndefined();
    });
  });

  describe('Link Removal', () => {
    it('should emit linkRemoved event and close dialog', () => {
      spyOn(component.linkRemoved, 'emit');
      spyOn(component, 'closeDialog');

      component.onRemoveLink();

      expect(component.linkRemoved.emit).toHaveBeenCalled();
      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Dialog Management', () => {
    it('should emit dialogClosed event and reset form when closing', () => {
      spyOn(component.dialogClosed, 'emit');
      spyOn(component.linkForm, 'reset');

      component.closeDialog();

      expect(component.dialogClosed.emit).toHaveBeenCalled();
      expect(component.linkForm.reset).toHaveBeenCalled();
    });

    it('should close dialog on cancel', () => {
      spyOn(component, 'closeDialog');

      component.onCancel();

      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return correct error message for required fields', () => {
      const urlControl = component.linkForm.get('url');
      urlControl?.markAsTouched();
      
      expect(component.getFieldError('url')).toBe('Url is required');
    });

    it('should return correct error message for invalid URL', () => {
      const urlControl = component.linkForm.get('url');
      urlControl?.setValue('invalid-url');
      urlControl?.markAsTouched();
      
      expect(component.getFieldError('url')).toBe('Please enter a valid URL');
    });

    it('should return empty string for valid fields', () => {
      const urlControl = component.linkForm.get('url');
      urlControl?.setValue('https://example.com');
      urlControl?.markAsTouched();
      
      expect(component.getFieldError('url')).toBe('');
    });

    it('should detect field errors correctly', () => {
      const urlControl = component.linkForm.get('url');
      
      expect(component.hasFieldError('url')).toBeFalsy();
      
      urlControl?.markAsTouched();
      expect(component.hasFieldError('url')).toBeTruthy();
      
      urlControl?.setValue('https://example.com');
      expect(component.hasFieldError('url')).toBeFalsy();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      component.visible = true;
      fixture.detectChanges();
    });

    it('should render dialog when visible', () => {
      const dialog = fixture.debugElement.query(By.css('.wysiwyg-link-dialog'));
      expect(dialog).toBeTruthy();
    });

    it('should not render dialog when not visible', () => {
      component.visible = false;
      fixture.detectChanges();
      
      const dialog = fixture.debugElement.query(By.css('.wysiwyg-link-dialog'));
      expect(dialog).toBeFalsy();
    });

    it('should show correct title for new link', () => {
      component.isEditing = false;
      fixture.detectChanges();
      
      const title = fixture.debugElement.query(By.css('h3'));
      expect(title.nativeElement.textContent).toBe('Insert Link');
    });

    it('should show correct title for editing link', () => {
      component.isEditing = true;
      fixture.detectChanges();
      
      const title = fixture.debugElement.query(By.css('h3'));
      expect(title.nativeElement.textContent).toBe('Edit Link');
    });

    it('should show remove button only when editing', () => {
      component.isEditing = false;
      fixture.detectChanges();
      
      let removeButton = fixture.debugElement.query(By.css('.wysiwyg-btn-danger'));
      expect(removeButton).toBeFalsy();
      
      component.isEditing = true;
      fixture.detectChanges();
      
      removeButton = fixture.debugElement.query(By.css('.wysiwyg-btn-danger'));
      expect(removeButton).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBeTruthy();
      
      component.linkForm.patchValue({
        url: 'https://example.com',
        text: 'Test Link'
      });
      fixture.detectChanges();
      
      expect(submitButton.nativeElement.disabled).toBeFalsy();
    });

    it('should show error messages for invalid fields', () => {
      const urlControl = component.linkForm.get('url');
      urlControl?.markAsTouched();
      fixture.detectChanges();
      
      const errorMessage = fixture.debugElement.query(By.css('.wysiwyg-error-message'));
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent.trim()).toBe('Url is required');
    });

    it('should apply error class to invalid fields', () => {
      const urlControl = component.linkForm.get('url');
      urlControl?.markAsTouched();
      fixture.detectChanges();
      
      const urlInput = fixture.debugElement.query(By.css('#linkUrl'));
      expect(urlInput.nativeElement.classList.contains('error')).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component.visible = true;
      fixture.detectChanges();
    });

    it('should close dialog when clicking overlay', () => {
      spyOn(component, 'onCancel');
      
      const overlay = fixture.debugElement.query(By.css('.wysiwyg-link-dialog-overlay'));
      overlay.nativeElement.click();
      
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should not close dialog when clicking dialog content', () => {
      spyOn(component, 'onCancel');
      
      const dialog = fixture.debugElement.query(By.css('.wysiwyg-link-dialog'));
      dialog.nativeElement.click();
      
      expect(component.onCancel).not.toHaveBeenCalled();
    });

    it('should close dialog when clicking close button', () => {
      spyOn(component, 'onCancel');
      
      const closeButton = fixture.debugElement.query(By.css('.wysiwyg-link-dialog-close'));
      closeButton.nativeElement.click();
      
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should submit form when clicking submit button', () => {
      spyOn(component, 'onSubmit');
      
      component.linkForm.patchValue({
        url: 'https://example.com',
        text: 'Test Link'
      });
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      submitButton.nativeElement.click();
      
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should remove link when clicking remove button', () => {
      spyOn(component, 'onRemoveLink');
      
      component.isEditing = true;
      fixture.detectChanges();
      
      const removeButton = fixture.debugElement.query(By.css('.wysiwyg-btn-danger'));
      removeButton.nativeElement.click();
      
      expect(component.onRemoveLink).toHaveBeenCalled();
    });
  });
});