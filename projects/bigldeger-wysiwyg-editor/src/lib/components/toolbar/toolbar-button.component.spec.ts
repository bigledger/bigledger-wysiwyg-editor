import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ToolbarButtonComponent } from './toolbar-button.component';
import { ToolbarTool } from '../../models/toolbar.interface';

describe('ToolbarButtonComponent', () => {
  let component: ToolbarButtonComponent;
  let fixture: ComponentFixture<ToolbarButtonComponent>;

  const mockTool: ToolbarTool = {
    command: 'bold',
    label: 'Bold',
    icon: 'bold',
    type: 'button'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render button with tool properties', () => {
    component.tool = mockTool;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.title).toBe('Bold');
    expect(button.nativeElement.getAttribute('aria-label')).toBe('Bold');
  });

  it('should display icon when tool has icon', () => {
    component.tool = mockTool;
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__icon'));
    expect(icon).toBeTruthy();
    expect(icon.nativeElement.innerHTML).toBe('<strong>B</strong>');
  });

  it('should display label when showLabel is true', () => {
    component.tool = mockTool;
    component.showLabel = true;
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe('Bold');
  });

  it('should apply active class when active is true', () => {
    component.tool = mockTool;
    component.active = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.classList.contains('wysiwyg-toolbar-button--active')).toBe(true);
    expect(button.nativeElement.getAttribute('aria-pressed')).toBe('true');
  });

  it('should apply disabled class and attribute when disabled', () => {
    component.tool = mockTool;
    component.disabled = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.classList.contains('wysiwyg-toolbar-button--disabled')).toBe(true);
    expect(button.nativeElement.disabled).toBe(true);
  });

  it('should apply disabled class when tool is disabled', () => {
    component.tool = { ...mockTool, disabled: true };
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.classList.contains('wysiwyg-toolbar-button--disabled')).toBe(true);
    expect(button.nativeElement.disabled).toBe(true);
  });

  it('should emit buttonClick when clicked and not disabled', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = mockTool;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    button.nativeElement.click();

    expect(component.buttonClick.emit).toHaveBeenCalledWith(mockTool);
  });

  it('should not emit buttonClick when disabled', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = mockTool;
    component.disabled = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    button.nativeElement.click();

    expect(component.buttonClick.emit).not.toHaveBeenCalled();
  });

  it('should not emit buttonClick when tool is disabled', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = { ...mockTool, disabled: true };
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    button.nativeElement.click();

    expect(component.buttonClick.emit).not.toHaveBeenCalled();
  });

  it('should handle keyboard events', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = mockTool;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    
    // Test Enter key
    button.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.buttonClick.emit).toHaveBeenCalledWith(mockTool);

    // Test Space key
    button.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(component.buttonClick.emit).toHaveBeenCalledTimes(2);
  });

  it('should show dialog indicator for dialog type tools', () => {
    const dialogTool: ToolbarTool = {
      command: 'createLink',
      label: 'Insert Link',
      icon: 'createLink',
      type: 'dialog'
    };
    component.tool = dialogTool;
    fixture.detectChanges();

    const indicator = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__dialog-indicator'));
    expect(indicator).toBeTruthy();
    expect(indicator.nativeElement.textContent.trim()).toBe('...');
  });

  it('should include dialog indication in aria-label for dialog tools', () => {
    const dialogTool: ToolbarTool = {
      command: 'createLink',
      label: 'Insert Link',
      icon: 'createLink',
      type: 'dialog'
    };
    component.tool = dialogTool;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.getAttribute('aria-label')).toBe('Insert Link (opens dialog)');
  });

  it('should apply custom CSS class from tool', () => {
    const toolWithClass: ToolbarTool = {
      command: 'bold',
      label: 'Bold',
      icon: 'bold',
      type: 'button',
      cssClass: 'custom-button-class'
    };
    component.tool = toolWithClass;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.classList.contains('custom-button-class')).toBe(true);
  });

  it('should handle tool without icon', () => {
    const toolWithoutIcon: ToolbarTool = {
      command: 'customCommand',
      label: 'Custom Command',
      type: 'button'
    };
    component.tool = toolWithoutIcon;
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__icon'));
    expect(icon).toBeFalsy();

    const label = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe('Custom Command');
  });

  it('should handle tool without label', () => {
    const toolWithoutLabel: ToolbarTool = {
      command: 'bold',
      icon: 'bold',
      type: 'button'
    };
    component.tool = toolWithoutLabel;
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button__label'));
    expect(label).toBeFalsy();

    const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar-button'));
    expect(button.nativeElement.title).toBe('Bold'); // Should use command display name
  });

  it('should return empty strings for getTitle and getAriaLabel when tool is null', () => {
    component.tool = null;
    expect(component.getTitle()).toBe('');
    expect(component.getAriaLabel()).toBe('');
  });

  it('should return empty string for getIcon when tool has no icon', () => {
    component.tool = { command: 'test', type: 'button' };
    expect(component.getIcon()).toBe('');
  });

  it('should return custom icon when not in icon map', () => {
    component.tool = { command: 'test', icon: 'custom-icon', type: 'button' };
    expect(component.getIcon()).toBe('custom-icon');
  });

  it('should render mapped icons as svg markup', () => {
    component.tool = { command: 'bold', icon: 'bold', type: 'button' };
    expect(component.getIcon()).toContain('<svg');
  });

  it('should handle click event properly', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = mockTool;

    const mockEvent = new Event('click');
    spyOn(mockEvent, 'preventDefault');
    spyOn(mockEvent, 'stopPropagation');

    component.handleClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.buttonClick.emit).toHaveBeenCalledWith(mockTool);
  });

  it('should not handle click when tool is null', () => {
    spyOn(component.buttonClick, 'emit');
    component.tool = null;

    component.handleClick();

    expect(component.buttonClick.emit).not.toHaveBeenCalled();
  });
});
 
