import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ColorPickerDialogComponent, ColorData } from './color-picker-dialog.component';

describe('ColorPickerDialogComponent', () => {
  let component: ColorPickerDialogComponent;
  let fixture: ComponentFixture<ColorPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPickerDialogComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedColor).toBe('#000000');
    expect(component.type).toBe('text');
    expect(component.showCustomInput).toBe(false);
  });

  it('should initialize with provided initial color', () => {
    component.initialColor = '#FF0000';
    component.ngOnInit();
    expect(component.selectedColor).toBe('#FF0000');
    expect(component.customColor).toBe('#FF0000');
  });

  it('should select color from palette', () => {
    const testColor = '#FF0000';
    component.selectColor(testColor);
    expect(component.selectedColor).toBe(testColor);
    expect(component.customColor).toBe(testColor);
  });

  it('should handle custom color change', () => {
    const testColor = '#00FF00';
    component.onCustomColorChange(testColor);
    expect(component.selectedColor).toBe(testColor);
  });

  it('should toggle custom input visibility', () => {
    expect(component.showCustomInput).toBe(false);
    component.toggleCustomInput();
    expect(component.showCustomInput).toBe(true);
    component.toggleCustomInput();
    expect(component.showCustomInput).toBe(false);
  });

  it('should emit colorSelected event when applying color', () => {
    const testColor = '#0000FF';
    component.selectedColor = testColor;
    component.type = 'text';

    spyOn(component.colorSelected, 'emit');
    component.applyColor();

    expect(component.colorSelected.emit).toHaveBeenCalledWith({
      color: testColor,
      type: 'text'
    } as ColorData);
  });

  it('should emit correct color data for background type', () => {
    const testColor = '#FFFF00';
    component.selectedColor = testColor;
    component.type = 'background';

    spyOn(component.colorSelected, 'emit');
    component.applyColor();

    expect(component.colorSelected.emit).toHaveBeenCalledWith({
      color: testColor,
      type: 'background'
    } as ColorData);
  });

  it('should emit default color when removing text color', () => {
    component.type = 'text';
    spyOn(component.colorSelected, 'emit');
    
    component.removeColor();
    
    expect(component.colorSelected.emit).toHaveBeenCalledWith({
      color: '#000000',
      type: 'text'
    } as ColorData);
  });

  it('should emit transparent color when removing background color', () => {
    component.type = 'background';
    spyOn(component.colorSelected, 'emit');
    
    component.removeColor();
    
    expect(component.colorSelected.emit).toHaveBeenCalledWith({
      color: 'transparent',
      type: 'background'
    } as ColorData);
  });

  it('should emit cancel event', () => {
    spyOn(component.cancel, 'emit');
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should correctly identify selected color', () => {
    component.selectedColor = '#FF0000';
    expect(component.isColorSelected('#FF0000')).toBe(true);
    expect(component.isColorSelected('#ff0000')).toBe(true); // Case insensitive
    expect(component.isColorSelected('#00FF00')).toBe(false);
  });

  it('should return correct color style', () => {
    const style = component.getColorStyle('#FF0000');
    expect(style['background-color']).toBe('#FF0000');
    expect(style['border']).toBe('none');
  });

  it('should add border for white color', () => {
    const style = component.getColorStyle('#FFFFFF');
    expect(style['background-color']).toBe('#FFFFFF');
    expect(style['border']).toBe('1px solid #E0E0E0');
  });

  it('should have a color palette with 8 rows', () => {
    expect(component.colorPalette.length).toBe(8);
  });

  it('should have 8 colors in each palette row', () => {
    component.colorPalette.forEach(row => {
      expect(row.length).toBe(8);
    });
  });

  it('should not apply color if selectedColor is empty', () => {
    component.selectedColor = '';
    spyOn(component.colorSelected, 'emit');
    
    component.applyColor();
    
    expect(component.colorSelected.emit).not.toHaveBeenCalled();
  });

  describe('Recent Colors', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should start with empty recent colors', () => {
      component.ngOnInit();
      expect(component.recentColors.length).toBe(0);
    });

    it('should load recent colors from localStorage', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF'];
      localStorage.setItem('wysiwyg-recent-colors', JSON.stringify(testColors));
      
      component.ngOnInit();
      
      expect(component.recentColors).toEqual(testColors);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem('wysiwyg-recent-colors', 'invalid-json');
      
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });
});
