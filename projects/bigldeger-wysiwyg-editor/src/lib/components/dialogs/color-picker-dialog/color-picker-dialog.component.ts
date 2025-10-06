import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Color data interface for color selection
 */
export interface ColorData {
  color: string;
  type: 'text' | 'background';
}

/**
 * Color picker dialog component for selecting text and background colors
 */
@Component({
  selector: 'wysiwyg-color-picker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-picker-dialog.component.html',
  styleUrls: ['./color-picker-dialog.component.scss']
})
export class ColorPickerDialogComponent implements OnInit {
  @Input() initialColor: string = '#000000';
  @Input() type: 'text' | 'background' = 'text';
  
  @Output() colorSelected = new EventEmitter<ColorData>();
  @Output() cancel = new EventEmitter<void>();

  selectedColor: string = '#000000';
  customColor: string = '#000000';
  showCustomInput: boolean = false;

  // Predefined color palette
  colorPalette: string[][] = [
    // Row 1 - Grayscale
    ['#000000', '#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#FFFFFF'],
    // Row 2 - Reds
    ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#C62828'],
    // Row 3 - Pinks & Purples
    ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#6A1B9A'],
    // Row 4 - Blues
    ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0'],
    // Row 5 - Cyans & Teals
    ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#00838F'],
    // Row 6 - Greens
    ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#2E7D32'],
    // Row 7 - Yellows & Oranges
    ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F57F17'],
    // Row 8 - Oranges & Browns
    ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#E65100']
  ];

  // Recent colors (can be expanded to store in localStorage)
  recentColors: string[] = [];

  ngOnInit(): void {
    this.selectedColor = this.initialColor;
    this.customColor = this.initialColor;
    this.loadRecentColors();
  }

  /**
   * Handle color selection from palette
   */
  selectColor(color: string): void {
    this.selectedColor = color;
    this.customColor = color;
  }

  /**
   * Handle custom color input change
   */
  onCustomColorChange(color: string): void {
    this.selectedColor = color;
  }

  /**
   * Toggle custom color input visibility
   */
  toggleCustomInput(): void {
    this.showCustomInput = !this.showCustomInput;
  }

  /**
   * Apply the selected color
   */
  applyColor(): void {
    if (this.selectedColor) {
      this.addToRecentColors(this.selectedColor);
      this.colorSelected.emit({
        color: this.selectedColor,
        type: this.type
      });
    }
  }

  /**
   * Remove color (set to transparent or default)
   */
  removeColor(): void {
    const defaultColor = this.type === 'text' ? '#000000' : 'transparent';
    this.colorSelected.emit({
      color: defaultColor,
      type: this.type
    });
  }

  /**
   * Cancel color selection
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Add color to recent colors
   */
  private addToRecentColors(color: string): void {
    // Remove color if it already exists
    this.recentColors = this.recentColors.filter(c => c !== color);
    
    // Add to beginning
    this.recentColors.unshift(color);
    
    // Keep only last 8 colors
    if (this.recentColors.length > 8) {
      this.recentColors = this.recentColors.slice(0, 8);
    }
    
    // Save to localStorage
    this.saveRecentColors();
  }

  /**
   * Load recent colors from localStorage
   */
  private loadRecentColors(): void {
    try {
      const stored = localStorage.getItem('wysiwyg-recent-colors');
      if (stored) {
        this.recentColors = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load recent colors:', error);
    }
  }

  /**
   * Save recent colors to localStorage
   */
  private saveRecentColors(): void {
    try {
      localStorage.setItem('wysiwyg-recent-colors', JSON.stringify(this.recentColors));
    } catch (error) {
      console.warn('Failed to save recent colors:', error);
    }
  }

  /**
   * Check if a color is selected
   */
  isColorSelected(color: string): boolean {
    return this.selectedColor.toLowerCase() === color.toLowerCase();
  }

  /**
   * Get color preview style
   */
  getColorStyle(color: string): { [key: string]: string } {
    return {
      'background-color': color,
      'border': color === '#FFFFFF' ? '1px solid #E0E0E0' : 'none'
    };
  }
}
