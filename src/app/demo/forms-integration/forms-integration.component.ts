import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-forms-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, WysiwygEditorComponent],
  template: `
    <div class="container">
      <div class="demo-header">
        <h1>Forms Integration</h1>
        <p>Examples of integrating the WYSIWYG editor with Angular forms</p>
        <nav class="demo-nav">
          <a routerLink="/" class="nav-link">← Back to Home</a>
        </nav>
      </div>

      <div class="demo-section">
        <h2>Template-Driven Forms</h2>
        <p>Using ngModel for two-way data binding with template-driven forms:</p>
        
        <div class="demo-result">
          <form #templateForm="ngForm" (ngSubmit)="onTemplateSubmit(templateForm)" class="demo-form">
            <div class="form-group">
              <label for="title">Title:</label>
              <input 
                type="text" 
                id="title"
                name="title"
                [(ngModel)]="templateArticle.title"
                class="form-control"
                required>
              <div *ngIf="templateForm.submitted && !templateForm.controls['title']?.valid" class="error">
                Title is required
              </div>
            </div>
            
            <div class="form-group">
              <label for="content">Content:</label>
              <wysiwyg-editor
                name="content"
                [(ngModel)]="templateArticle.content"
                placeholder="Enter your article content..."
                [height]="'200px'"
                required>
              </wysiwyg-editor>
              <div *ngIf="templateForm.submitted && !templateForm.controls['content']?.valid" class="error">
                Content is required
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                Save Article
              </button>
              <div class="form-status">
                Form Status: {{ templateForm.valid ? 'Valid' : 'Invalid' }}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="demo-section">
        <h2>Form Validation Status</h2>
        <p>Real-time form validation status and data preview:</p>
        
        <div class="demo-result">
          <div class="validation-status">
            <h4>Template Form Status:</h4>
            <div class="status-grid">
              <div class="status-item">
                <strong>Title Valid:</strong> 
                <span class="status" [class.valid]="templateForm.controls['title']?.valid" [class.invalid]="templateForm.controls['title']?.invalid">
                  {{ templateForm.controls['title']?.valid ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="status-item">
                <strong>Content Valid:</strong> 
                <span class="status" [class.valid]="templateForm.controls['content']?.valid" [class.invalid]="templateForm.controls['content']?.invalid">
                  {{ templateForm.controls['content']?.valid ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="status-item">
                <strong>Form Valid:</strong> 
                <span class="status" [class.valid]="templateForm.valid" [class.invalid]="templateForm.invalid">
                  {{ templateForm.valid ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
            
            <h4>Current Data:</h4>
            <div class="data-preview">
              <pre>{{ templateArticle | json }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>Reactive Forms</h2>
        <p>Using FormControl with reactive forms for better validation control:</p>
        
        <div class="demo-result">
          <form [formGroup]="reactiveForm" (ngSubmit)="onReactiveSubmit()" class="demo-form">
            <div class="form-group">
              <label for="reactiveTitle">Title:</label>
              <input 
                type="text" 
                id="reactiveTitle"
                formControlName="title"
                class="form-control"
                [class.invalid]="reactiveForm.get('title')?.invalid && reactiveForm.get('title')?.touched">
              <div *ngIf="reactiveForm.get('title')?.invalid && reactiveForm.get('title')?.touched" class="error">
                <div *ngIf="reactiveForm.get('title')?.errors?.['required']">Title is required</div>
                <div *ngIf="reactiveForm.get('title')?.errors?.['minlength']">Title must be at least 3 characters</div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="reactiveContent">Content:</label>
              <wysiwyg-editor
                formControlName="content"
                placeholder="Enter your article content..."
                [height]="'200px'">
              </wysiwyg-editor>
              <div *ngIf="reactiveForm.get('content')?.invalid && reactiveForm.get('content')?.touched" class="error">
                <div *ngIf="reactiveForm.get('content')?.errors?.['required']">Content is required</div>
                <div *ngIf="reactiveForm.get('content')?.errors?.['minlength']">Content must be at least 10 characters</div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="tags">Tags:</label>
              <input 
                type="text" 
                id="tags"
                formControlName="tags"
                class="form-control"
                placeholder="Enter tags separated by commas">
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="!reactiveForm.valid">
                Publish Article
              </button>
              <div class="form-status">
                <p>Form Status: {{ reactiveForm.status }}</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="demo-section">
        <h2>Reactive Form Status</h2>
        <p>Real-time reactive form validation and data:</p>
        
        <div class="demo-result">
          <div class="validation-status">
            <h4>Reactive Form Status:</h4>
            <div class="status-grid">
              <div class="status-item">
                <strong>Title Valid:</strong> 
                <span class="status" [class.valid]="reactiveForm.get('title')?.valid" [class.invalid]="reactiveForm.get('title')?.invalid">
                  {{ reactiveForm.get('title')?.valid ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="status-item">
                <strong>Content Valid:</strong> 
                <span class="status" [class.valid]="reactiveForm.get('content')?.valid" [class.invalid]="reactiveForm.get('content')?.invalid">
                  {{ reactiveForm.get('content')?.valid ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="status-item">
                <strong>Form Valid:</strong> 
                <span class="status" [class.valid]="reactiveForm.valid" [class.invalid]="reactiveForm.invalid">
                  {{ reactiveForm.valid ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="status-item">
                <strong>Form Status:</strong> 
                <span class="status" [class.valid]="reactiveForm.status === 'VALID'" [class.invalid]="reactiveForm.status !== 'VALID'">
                  {{ reactiveForm.status }}
                </span>
              </div>
            </div>
            
            <h4>Current Form Value:</h4>
            <div class="data-preview">
              <pre>{{ reactiveForm.value | json }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h2>Next Steps</h2>
        <div class="next-grid">
          <a routerLink="/toolbar" class="next-card">
            <h4>Toolbar Configuration</h4>
            <p>Customize the editor toolbar</p>
          </a>
          <a routerLink="/events" class="next-card">
            <h4>Event Handling</h4>
            <p>Handle editor events and interactions</p>
          </a>
          <a routerLink="/advanced" class="next-card">
            <h4>Advanced Features</h4>
            <p>Performance and security features</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .demo-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .demo-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .demo-nav {
      margin-top: 1rem;
    }

    .nav-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .nav-link:hover {
      text-decoration: underline;
    }

    .demo-section {
      margin-bottom: 3rem;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .demo-section h2 {
      color: #333;
      margin-bottom: 1rem;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .demo-section p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .demo-result {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1.5rem;
      background: #f8f9fa;
    }

    .demo-form {
      max-width: 600px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-control.invalid {
      border-color: #dc3545;
    }

    wysiwyg-editor {
      display: block;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .form-group wysiwyg-editor {
      margin-top: 0.5rem;
    }

    .validation-status {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .validation-status h4 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .status.valid {
      background: #d4edda;
      color: #155724;
    }

    .status.invalid {
      background: #f8d7da;
      color: #721c24;
    }

    .data-preview {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .data-preview pre {
      margin: 0;
      font-size: 0.875rem;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-status {
      font-size: 0.875rem;
      color: #666;
    }

    .next-steps {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      margin-top: 3rem;
    }

    .next-steps h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .next-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .next-card {
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .next-card:hover {
      transform: translateY(-2px);
    }

    .next-card h4 {
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .next-card p {
      color: #666;
      margin: 0;
    }

    @media (max-width: 768px) {
      .demo-section {
        padding: 1rem;
      }
      
      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }
      
      .next-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FormsIntegrationComponent {
  // Template-driven form data
  templateArticle = {
    title: 'Sample Article',
    content: '<p>This is a <strong>template-driven form</strong> example with the WYSIWYG editor. You can <em>format text</em> and see how it integrates with Angular forms.</p>'
  };

  // Reactive form
  reactiveForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.reactiveForm = this.fb.group({
      title: ['Advanced Article', [Validators.required, Validators.minLength(3)]],
      content: ['<p>This is a <strong>reactive form</strong> example. It provides better <em>validation control</em> and form state management.</p>', [Validators.required, Validators.minLength(10)]],
      tags: ['angular, wysiwyg, forms']
    });
  }

  onTemplateSubmit(form: any) {
    if (form.valid) {
      console.log('Template form submitted:', this.templateArticle);
      alert('Template form submitted successfully! Check the console for data.');
    } else {
      alert('Please fix the form errors before submitting.');
    }
  }

  onReactiveSubmit() {
    if (this.reactiveForm.valid) {
      console.log('Reactive form submitted:', this.reactiveForm.value);
      alert('Reactive form submitted successfully! Check the console for data.');
    } else {
      this.markFormGroupTouched(this.reactiveForm);
      alert('Please fix the form errors before submitting.');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}