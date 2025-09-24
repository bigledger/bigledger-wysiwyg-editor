import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forms-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
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
              <div class="mock-editor">
                <div class="mock-toolbar">
                  <button type="button" class="mock-btn">B</button>
                  <button type="button" class="mock-btn">I</button>
                  <button type="button" class="mock-btn">U</button>
                </div>
                <div class="mock-content" contenteditable="true">
                  <p>Template-driven form content...</p>
                </div>
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
              <div class="mock-editor">
                <div class="mock-toolbar">
                  <button type="button" class="mock-btn">B</button>
                  <button type="button" class="mock-btn active">I</button>
                  <button type="button" class="mock-btn">U</button>
                </div>
                <div class="mock-content" contenteditable="true">
                  <p>Reactive form content...</p>
                </div>
              </div>
              <div *ngIf="reactiveForm.get('content')?.invalid && reactiveForm.get('content')?.touched" class="error">
                Content is required
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

    .mock-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .mock-toolbar {
      background: #f8f9fa;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
    }

    .mock-btn {
      padding: 6px 10px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
    }

    .mock-btn:hover {
      background: #e9ecef;
    }

    .mock-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .mock-content {
      min-height: 120px;
      padding: 12px;
      outline: none;
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
    title: '',
    content: ''
  };

  // Reactive form
  reactiveForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.reactiveForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      tags: ['']
    });
  }

  onTemplateSubmit(form: any) {
    if (form.valid) {
      console.log('Template form submitted:', this.templateArticle);
    }
  }

  onReactiveSubmit() {
    if (this.reactiveForm.valid) {
      console.log('Reactive form submitted:', this.reactiveForm.value);
    } else {
      this.markFormGroupTouched(this.reactiveForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}