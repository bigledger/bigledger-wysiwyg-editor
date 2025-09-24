import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators, NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Component, ViewChild } from '@angular/core';

import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { ToolbarButtonComponent } from '../../components/toolbar/toolbar-button.component';
import { ContentEditableDirective } from '../../directives/content-editable.directive';
import { EditorService } from '../../services/editor.service';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

// Template-driven form test component
@Component({
  template: `
    <form #editorForm="ngForm">
      <wysiwyg-editor 
        name="content"
        [(ngModel)]="content"
        [toolbarConfig]="toolbarConfig"
        placeholder="Enter content..."
        [readonly]="readonly"
        required>
      </wysiwyg-editor>
      
      <div class="form-status">
        <p>Form Valid: {{ editorForm.valid }}</p>
        <p>Form Dirty: {{ editorForm.dirty }}</p>
        <p>Form Touched: {{ editorForm.touched }}</p>
        <p>Content Valid: {{ editorForm.controls['content']?.valid }}</p>
        <p>Content Errors: {{ editorForm.controls['content']?.errors | json }}</p>
      </div>
      
      <button type="submit" [disabled]="!editorForm.valid">Submit</button>
    </form>
  `
})
class TemplateFormTestComponent {
  @ViewChild('editorForm') form!: NgForm;
  content = '';
  readonly = false;
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
    ]
  };
}

// Reactive form test component
@Component({
  template: `
    <form [formGroup]="editorForm" (ngSubmit)="onSubmit()">
      <wysiwyg-editor 
        formControlName="content"
        [toolbarConfig]="toolbarConfig"
        placeholder="Enter content...">
      </wysiwyg-editor>
      
      <wysiwyg-editor 
        formControlName="description"
        [toolbarConfig]="simpleToolbarConfig"
        placeholder="Enter description...">
      </wysiwyg-editor>
      
      <div class="form-status">
        <p>Form Valid: {{ editorForm.valid }}</p>
        <p>Form Dirty: {{ editorForm.dirty }}</p>
        <p>Form Touched: {{ editorForm.touched }}</p>
        <p>Content Valid: {{ editorForm.get('content')?.valid }}</p>
        <p>Content Errors: {{ editorForm.get('content')?.errors | json }}</p>
        <p>Description Valid: {{ editorForm.get('description')?.valid }}</p>
      </div>
      
      <button type="submit" [disabled]="!editorForm.valid">Submit</button>
    </form>
  `
})
class ReactiveFormTestComponent {
  editorForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.minLength(10)]),
    description: new FormControl('')
  });
  
  submittedData: any = null;
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' }
    ]
  };
  
  simpleToolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
    ]
  };
  
  onSubmit() {
    if (this.editorForm.valid) {
      this.submittedData = this.editorForm.value;
    }
  }
}

// Dynamic form test component
@Component({
  template: `
    <form [formGroup]="dynamicForm">
      <div *ngFor="let field of formFields; trackBy: trackByField">
        <label>{{ field.label }}</label>
        <wysiwyg-editor 
          [formControlName]="field.name"
          [toolbarConfig]="field.toolbarConfig"
          [placeholder]="field.placeholder">
        </wysiwyg-editor>
      </div>
      
      <button type="button" (click)="addField()">Add Field</button>
      <button type="button" (click)="removeField()">Remove Field</button>
    </form>
  `
})
class DynamicFormTestComponent {
  dynamicForm = new FormGroup({});
  formFields: any[] = [];
  
  constructor() {
    this.addField();
  }
  
  addField() {
    const fieldName = `field_${this.formFields.length}`;
    const field = {
      name: fieldName,
      label: `Field ${this.formFields.length + 1}`,
      placeholder: `Enter content for field ${this.formFields.length + 1}`,
      toolbarConfig: {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
          { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
        ]
      }
    };
    
    this.formFields.push(field);
    this.dynamicForm.addControl(fieldName, new FormControl(''));
  }
  
  removeField() {
    if (this.formFields.length > 0) {
      const field = this.formFields.pop();
      this.dynamicForm.removeControl(field.name);
    }
  }
  
  trackByField(index: number, field: any) {
    return field.name;
  }
}

describe('Forms Integration Tests', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        ToolbarButtonComponent,
        ContentEditableDirective,
        TemplateFormTestComponent,
        ReactiveFormTestComponent,
        DynamicFormTestComponent
      ],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        EditorService,
        CommandService,
        SelectionService,
        HTMLSanitizerService
      ]
    }).compileComponents();
  });

  describe('Template-driven Forms', () => {
    let component: TemplateFormTestComponent;
    let fixture: ComponentFixture<TemplateFormTestComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TemplateFormTestComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should integrate with template-driven forms', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Initially form should be invalid (required field is empty)
      expect(component.form.valid).toBe(false);
      
      // Add content
      editorElement.nativeElement.innerHTML = '<p>Test content</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Form should now be valid
      expect(component.form.valid).toBe(true);
      expect(component.content).toContain('Test content');
    });

    it('should handle required validation', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      
      // Initially submit should be disabled
      expect(submitButton.nativeElement.disabled).toBe(true);
      
      // Add content
      editorElement.nativeElement.innerHTML = '<p>Required content</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Submit should now be enabled
      expect(submitButton.nativeElement.disabled).toBe(false);
    });

    it('should track form state changes', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Initially form should be pristine
      expect(component.form.dirty).toBe(false);
      expect(component.form.touched).toBe(false);
      
      // Focus and blur to mark as touched
      editorElement.nativeElement.focus();
      editorElement.nativeElement.blur();
      fixture.detectChanges();
      
      expect(component.form.touched).toBe(true);
      
      // Add content to mark as dirty
      editorElement.nativeElement.innerHTML = '<p>Content</p>';
      editorElement.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      expect(component.form.dirty).toBe(true);
    });

    it('should handle readonly state in forms', async () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Initially editable
      expect(editorElement.nativeElement.contentEditable).toBe('true');
      
      // Set readonly
      component.readonly = true;
      fixture.detectChanges();
      
      // Should be readonly
      expect(editorElement.nativeElement.contentEditable).toBe('false');
      
      // Form should still be valid if it has content
      component.content = '<p>Existing content</p>';
      fixture.detectChanges();
      
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Reactive Forms', () => {
    let component: ReactiveFormTestComponent;
    let fixture: ComponentFixture<ReactiveFormTestComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(ReactiveFormTestComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should integrate with reactive forms', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      const descriptionEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[1];
      
      // Initially form should be invalid (required field is empty)
      expect(component.editorForm.valid).toBe(false);
      
      // Add content to required field
      contentEditor.nativeElement.innerHTML = '<p>This is enough content for validation</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Form should now be valid
      expect(component.editorForm.valid).toBe(true);
      expect(component.editorForm.get('content')?.value).toContain('This is enough content');
      
      // Add description
      descriptionEditor.nativeElement.innerHTML = '<p>Optional description</p>';
      descriptionEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      expect(component.editorForm.get('description')?.value).toContain('Optional description');
    });

    it('should handle custom validators', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Add content that's too short (less than 10 characters)
      contentEditor.nativeElement.innerHTML = '<p>Short</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Should be invalid due to minLength validator
      expect(component.editorForm.get('content')?.valid).toBe(false);
      expect(component.editorForm.get('content')?.errors?.['minlength']).toBeTruthy();
      
      // Add longer content
      contentEditor.nativeElement.innerHTML = '<p>This is long enough content</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Should now be valid
      expect(component.editorForm.get('content')?.valid).toBe(true);
      expect(component.editorForm.get('content')?.errors).toBeNull();
    });

    it('should handle form submission', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      const descriptionEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[1];
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      
      // Add valid content
      contentEditor.nativeElement.innerHTML = '<p><strong>Bold content</strong> with formatting</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      
      descriptionEditor.nativeElement.innerHTML = '<p><em>Italic description</em></p>';
      descriptionEditor.nativeElement.dispatchEvent(new Event('input'));
      
      fixture.detectChanges();
      
      // Submit form
      submitButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify submitted data
      expect(component.submittedData).toBeTruthy();
      expect(component.submittedData.content).toContain('Bold content');
      expect(component.submittedData.description).toContain('Italic description');
    });

    it('should handle disabled form controls', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Initially enabled
      expect(contentEditor.nativeElement.contentEditable).toBe('true');
      
      // Disable form control
      component.editorForm.get('content')?.disable();
      fixture.detectChanges();
      
      // Should be disabled
      expect(contentEditor.nativeElement.contentEditable).toBe('false');
      
      // Enable form control
      component.editorForm.get('content')?.enable();
      fixture.detectChanges();
      
      // Should be enabled again
      expect(contentEditor.nativeElement.contentEditable).toBe('true');
    });

    it('should handle programmatic value changes', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Set value programmatically
      component.editorForm.get('content')?.setValue('<p>Programmatically set content</p>');
      fixture.detectChanges();
      
      // Verify content appears in editor
      expect(contentEditor.nativeElement.innerHTML).toContain('Programmatically set content');
      
      // Change value again
      component.editorForm.get('content')?.setValue('<p>Updated content</p>');
      fixture.detectChanges();
      
      expect(contentEditor.nativeElement.innerHTML).toContain('Updated content');
    });
  });

  describe('Dynamic Forms', () => {
    let component: DynamicFormTestComponent;
    let fixture: ComponentFixture<DynamicFormTestComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(DynamicFormTestComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should handle dynamic form field addition', async () => {
      // Initially should have one field
      let editors = fixture.debugElement.queryAll(By.css('wysiwyg-editor'));
      expect(editors.length).toBe(1);
      
      // Add another field
      const addButton = fixture.debugElement.query(By.css('button:first-child'));
      addButton.nativeElement.click();
      fixture.detectChanges();
      
      // Should now have two fields
      editors = fixture.debugElement.queryAll(By.css('wysiwyg-editor'));
      expect(editors.length).toBe(2);
      
      // Verify form controls were added
      expect(component.dynamicForm.get('field_0')).toBeTruthy();
      expect(component.dynamicForm.get('field_1')).toBeTruthy();
    });

    it('should handle dynamic form field removal', async () => {
      // Add a second field first
      const addButton = fixture.debugElement.query(By.css('button:first-child'));
      addButton.nativeElement.click();
      fixture.detectChanges();
      
      // Should have two fields
      let editors = fixture.debugElement.queryAll(By.css('wysiwyg-editor'));
      expect(editors.length).toBe(2);
      
      // Remove a field
      const removeButton = fixture.debugElement.query(By.css('button:last-child'));
      removeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Should have one field again
      editors = fixture.debugElement.queryAll(By.css('wysiwyg-editor'));
      expect(editors.length).toBe(1);
      
      // Verify form control was removed
      expect(component.dynamicForm.get('field_1')).toBeFalsy();
    });

    it('should maintain form values when adding/removing fields', async () => {
      const firstEditor = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Add content to first field
      firstEditor.nativeElement.innerHTML = '<p>First field content</p>';
      firstEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Add second field
      const addButton = fixture.debugElement.query(By.css('button:first-child'));
      addButton.nativeElement.click();
      fixture.detectChanges();
      
      // First field content should be preserved
      expect(component.dynamicForm.get('field_0')?.value).toContain('First field content');
      
      // Add content to second field
      const editors = fixture.debugElement.queryAll(By.css('.wysiwyg-content'));
      editors[1].nativeElement.innerHTML = '<p>Second field content</p>';
      editors[1].nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      expect(component.dynamicForm.get('field_1')?.value).toContain('Second field content');
      
      // Remove second field
      const removeButton = fixture.debugElement.query(By.css('button:last-child'));
      removeButton.nativeElement.click();
      fixture.detectChanges();
      
      // First field content should still be preserved
      expect(component.dynamicForm.get('field_0')?.value).toContain('First field content');
    });
  });

  describe('Form State Synchronization', () => {
    let component: ReactiveFormTestComponent;
    let fixture: ComponentFixture<ReactiveFormTestComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(ReactiveFormTestComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should synchronize dirty state between form and editor', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Initially clean
      expect(component.editorForm.dirty).toBe(false);
      
      // Make change in editor
      contentEditor.nativeElement.innerHTML = '<p>Changed content</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      // Form should be dirty
      expect(component.editorForm.dirty).toBe(true);
      expect(component.editorForm.get('content')?.dirty).toBe(true);
    });

    it('should synchronize touched state between form and editor', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Initially untouched
      expect(component.editorForm.touched).toBe(false);
      
      // Focus and blur editor
      contentEditor.nativeElement.focus();
      contentEditor.nativeElement.blur();
      fixture.detectChanges();
      
      // Form should be touched
      expect(component.editorForm.touched).toBe(true);
      expect(component.editorForm.get('content')?.touched).toBe(true);
    });

    it('should handle form reset', async () => {
      const contentEditor = fixture.debugElement.queryAll(By.css('.wysiwyg-content'))[0];
      
      // Add content and make form dirty
      contentEditor.nativeElement.innerHTML = '<p>Content to reset</p>';
      contentEditor.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      expect(component.editorForm.dirty).toBe(true);
      expect(component.editorForm.get('content')?.value).toContain('Content to reset');
      
      // Reset form
      component.editorForm.reset();
      fixture.detectChanges();
      
      // Form should be clean and editor should be empty
      expect(component.editorForm.dirty).toBe(false);
      expect(component.editorForm.get('content')?.value).toBe('');
      expect(contentEditor.nativeElement.innerHTML).toBe('');
    });
  });
});