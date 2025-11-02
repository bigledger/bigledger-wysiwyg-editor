import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableData } from '../../../models/table.interface';

@Component({
  selector: 'wysiwyg-table-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wysiwyg-dialog-overlay" (click)="onCancel()" *ngIf="isOpen">
      <div class="wysiwyg-dialog" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="table-dialog-title" aria-modal="true">
        <div class="wysiwyg-dialog__header">
          <h3 id="table-dialog-title" class="wysiwyg-dialog__title">
            {{ editMode ? 'Edit Table' : 'Insert Table' }}
          </h3>
          <button 
            type="button"
            class="wysiwyg-dialog__close" 
            (click)="onCancel()"
            aria-label="Close dialog">
            ×
          </button>
        </div>

        <div class="wysiwyg-dialog__body">
          <!-- Table Size -->
          <div class="wysiwyg-form-group" *ngIf="!editMode">
            <label class="wysiwyg-form-label">Table Size</label>
            <div class="wysiwyg-table-size-picker">
              <div class="wysiwyg-table-grid">
                <div 
                  *ngFor="let row of gridRows; let i = index"
                  class="wysiwyg-table-grid-row">
                  <div
                    *ngFor="let col of gridCols; let j = index"
                    class="wysiwyg-table-grid-cell"
                    [class.wysiwyg-table-grid-cell--active]="i < tableData.rows && j < tableData.columns"
                    (mouseenter)="onGridCellHover(i + 1, j + 1)"
                    (click)="onGridCellClick(i + 1, j + 1)">
                  </div>
                </div>
              </div>
              <div class="wysiwyg-table-size-label">
                {{ tableData.rows }} × {{ tableData.columns }}
              </div>
            </div>
          </div>

          <!-- Manual Input -->
          <div class="wysiwyg-form-row" *ngIf="!editMode">
            <div class="wysiwyg-form-group">
              <label for="table-rows" class="wysiwyg-form-label">Rows</label>
              <input
                id="table-rows"
                type="number"
                class="wysiwyg-form-input"
                [(ngModel)]="tableData.rows"
                min="1"
                max="50"
                [disabled]="editMode">
            </div>
            <div class="wysiwyg-form-group">
              <label for="table-columns" class="wysiwyg-form-label">Columns</label>
              <input
                id="table-columns"
                type="number"
                class="wysiwyg-form-input"
                [(ngModel)]="tableData.columns"
                min="1"
                max="20"
                [disabled]="editMode">
            </div>
          </div>

          <!-- Header Row -->
          <div class="wysiwyg-form-group" *ngIf="!editMode">
            <label class="wysiwyg-form-checkbox">
              <input
                type="checkbox"
                [(ngModel)]="tableData.hasHeader">
              <span>Include header row</span>
            </label>
          </div>

          <!-- Table Width -->
          <div class="wysiwyg-form-group">
            <label for="table-width" class="wysiwyg-form-label">Width</label>
            <div class="wysiwyg-form-input-group">
              <input
                id="table-width"
                type="text"
                class="wysiwyg-form-input"
                [(ngModel)]="tableData.width"
                placeholder="100% or 500px">
            </div>
          </div>

          <!-- Table Border -->
          <div class="wysiwyg-form-group">
            <label for="table-border" class="wysiwyg-form-label">Border Width (px)</label>
            <input
              id="table-border"
              type="number"
              class="wysiwyg-form-input"
              [(ngModel)]="tableData.border"
              min="0"
              max="10">
          </div>

          <!-- Cell Padding -->
          <div class="wysiwyg-form-group">
            <label for="table-padding" class="wysiwyg-form-label">Cell Padding (px)</label>
            <input
              id="table-padding"
              type="number"
              class="wysiwyg-form-input"
              [(ngModel)]="tableData.cellPadding"
              min="0"
              max="50">
          </div>

          <!-- Table Alignment -->
          <div class="wysiwyg-form-group">
            <label for="table-align" class="wysiwyg-form-label">Alignment</label>
            <select
              id="table-align"
              class="wysiwyg-form-select"
              [(ngModel)]="tableData.align">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <!-- CSS Class -->
          <div class="wysiwyg-form-group">
            <label for="table-class" class="wysiwyg-form-label">CSS Class (optional)</label>
            <input
              id="table-class"
              type="text"
              class="wysiwyg-form-input"
              [(ngModel)]="tableData.cssClass"
              placeholder="table-striped">
          </div>
        </div>

        <div class="wysiwyg-dialog__footer">
          <button 
            type="button"
            class="wysiwyg-button wysiwyg-button--secondary" 
            (click)="onCancel()">
            Cancel
          </button>
          <button 
            type="button"
            class="wysiwyg-button wysiwyg-button--primary" 
            (click)="onInsert()"
            [disabled]="!isValid()">
            {{ editMode ? 'Update' : 'Insert' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./table-dialog.component.scss']
})
export class TableDialogComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editMode = false;
  @Input() initialData?: Partial<TableData>;
  
  @Output() insert = new EventEmitter<TableData>();
  @Output() cancel = new EventEmitter<void>();

  tableData: TableData = {
    rows: 3,
    columns: 3,
    width: '100%',
    border: 1,
    cellPadding: 8,
    cellSpacing: 0,
    align: 'left',
    hasHeader: false
  };

  gridRows = Array(10).fill(0);
  gridCols = Array(10).fill(0);

  ngOnInit(): void {
    if (this.initialData) {
      this.tableData = { ...this.tableData, ...this.initialData };
    }
  }

  onGridCellHover(rows: number, cols: number): void {
    this.tableData.rows = rows;
    this.tableData.columns = cols;
  }

  onGridCellClick(rows: number, cols: number): void {
    this.tableData.rows = rows;
    this.tableData.columns = cols;
    // Auto-insert table when grid cell is clicked
    this.onInsert();
  }

  isValid(): boolean {
    return this.tableData.rows > 0 && 
           this.tableData.columns > 0 &&
           this.tableData.rows <= 50 &&
           this.tableData.columns <= 20;
  }

  onInsert(): void {
    console.log('TableDialog: onInsert called');
    console.log('TableDialog: isValid:', this.isValid());
    console.log('TableDialog: tableData:', this.tableData);
    if (this.isValid()) {
      console.log('TableDialog: Emitting insert event with data:', this.tableData);
      this.insert.emit(this.tableData);
    } else {
      console.error('TableDialog: Table data is not valid!');
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
