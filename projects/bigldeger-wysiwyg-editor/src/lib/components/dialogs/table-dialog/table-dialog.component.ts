import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableData } from '../../../models/table.interface';

@Component({
  selector: 'wysiwyg-table-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="wysiwyg-table-popup"
      *ngIf="isOpen"
      [style.top.px]="popupTop"
      [style.left.px]="popupLeft"
      (click)="$event.stopPropagation()"
      role="dialog"
      aria-label="Insert Table">

      <!-- Header: back arrow + dimension input -->
      <div class="wysiwyg-table-popup__header">
        <button
          type="button"
          class="wysiwyg-table-popup__back"
          (click)="onCancel()"
          aria-label="Close table picker">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <input
          type="text"
          class="wysiwyg-table-popup__size-input"
          [value]="dimensionLabel"
          readonly
          aria-label="Selected table dimensions">
      </div>

      <!-- Current dimension label -->
      <div class="wysiwyg-table-popup__label" aria-live="polite">
        {{ dimensionLabel }}
      </div>

      <!-- Grid picker -->
      <div class="wysiwyg-table-popup__grid">
        <div
          *ngFor="let row of gridRows; let i = index"
          class="wysiwyg-table-popup__grid-row">
          <div
            *ngFor="let col of gridCols; let j = index"
            class="wysiwyg-table-popup__grid-cell"
            [class.wysiwyg-table-popup__grid-cell--active]="i < hoverRows && j < hoverCols"
            (mouseenter)="onCellHover(i + 1, j + 1)"
            (click)="onCellClick(i + 1, j + 1)">
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./table-dialog.component.scss']
})
export class TableDialogComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() editMode = false;
  @Input() initialData?: Partial<TableData>;
  @Input() anchorRect?: DOMRect | null;

  @Output() insert = new EventEmitter<TableData>();
  @Output() cancel = new EventEmitter<void>();

  tableData: TableData = {
    rows: 1,
    columns: 1,
    width: '100%',
    border: 1,
    cellPadding: 8,
    cellSpacing: 0,
    align: 'left',
    hasHeader: false
  };

  hoverRows = 1;
  hoverCols = 1;
  gridRows = Array(8).fill(0);
  gridCols = Array(8).fill(0);

  private boundClickHandler!: (e: MouseEvent) => void;

  constructor(private el: ElementRef) {}

  get dimensionLabel(): string {
    return `${this.hoverRows} \u00d7 ${this.hoverCols}`;
  }

  get popupTop(): number {
    if (this.anchorRect) {
      return Math.round(this.anchorRect.bottom + 4);
    }
    return 80;
  }

  get popupLeft(): number {
    if (this.anchorRect) {
      const popupWidth = 218;
      const left = Math.round(this.anchorRect.left);
      return Math.min(left, window.innerWidth - popupWidth - 8);
    }
    return 80;
  }

  ngOnInit(): void {
    if (this.initialData) {
      this.tableData = { ...this.tableData, ...this.initialData };
      this.hoverRows = this.tableData.rows || 1;
      this.hoverCols = this.tableData.columns || 1;
    }

    // Close popup when clicking outside
    setTimeout(() => {
      this.boundClickHandler = (e: MouseEvent) => {
        if (!this.el.nativeElement.contains(e.target as Node)) {
          this.onCancel();
        }
      };
      document.addEventListener('click', this.boundClickHandler);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler);
    }
  }

  onCellHover(rows: number, cols: number): void {
    this.hoverRows = rows;
    this.hoverCols = cols;
  }

  onCellClick(rows: number, cols: number): void {
    this.hoverRows = rows;
    this.hoverCols = cols;
    this.tableData.rows = rows;
    this.tableData.columns = cols;
    if (this.isValid()) {
      this.insert.emit(this.tableData);
    }
  }

  isValid(): boolean {
    return this.tableData.rows > 0 &&
           this.tableData.columns > 0 &&
           this.tableData.rows <= 50 &&
           this.tableData.columns <= 20;
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
