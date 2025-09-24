import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ToolbarComponent } from './toolbar.component';
import { ToolbarConfig, ToolbarTool } from '../../models/toolbar.interface';
import { EditorCommand } from '../../models/editor-command.interface';
import { SelectionState } from '../../models/selection-state.interface';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Toolbar Rendering', () => {
    it('should render toolbar with basic configuration', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
          { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const toolbar = fixture.debugElement.query(By.css('.wysiwyg-toolbar'));
      expect(toolbar).toBeTruthy();

      const buttons = fixture.debugElement.queryAll(By.css('.wysiwyg-toolbar__button'));
      expect(buttons.length).toBe(2);
    });

    it('should apply sticky class when sticky is true', () => {
      const config: ToolbarConfig = {
        tools: [],
        sticky: true
      };

      component.config = config;
      fixture.detectChanges();

      const toolbar = fixture.debugElement.query(By.css('.wysiwyg-toolbar--sticky'));
      expect(toolbar).toBeTruthy();
    });

    it('should apply theme classes correctly', () => {
      const config: ToolbarConfig = {
        tools: [],
        theme: 'dark'
      };

      component.config = config;
      fixture.detectChanges();

      const toolbar = fixture.debugElement.query(By.css('.wysiwyg-toolbar--dark'));
      expect(toolbar).toBeTruthy();
    });

    it('should apply disabled class when disabled', () => {
      component.config = { tools: [] };
      component.disabled = true;
      fixture.detectChanges();

      const toolbar = fixture.debugElement.query(By.css('.wysiwyg-toolbar--disabled'));
      expect(toolbar).toBeTruthy();
    });
  });

  describe('Button Tools', () => {
    it('should render button tools correctly', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.title).toBe('Bold');
    });

    it('should show active state for active tools', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
        ]
      };

      const selectionState: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
          fontSize: '14px',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };

      component.config = config;
      component.selectionState = selectionState;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button--active'));
      expect(button).toBeTruthy();
    });

    it('should emit command when button is clicked', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      spyOn(component.command, 'emit');

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button'));
      button.nativeElement.click();

      expect(component.command.emit).toHaveBeenCalledWith({
        name: 'bold',
        options: {
          showUI: false,
          preventDefault: true
        }
      });
    });

    it('should not emit command when button is disabled', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold', disabled: true }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      spyOn(component.command, 'emit');

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button'));
      button.nativeElement.click();

      expect(component.command.emit).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Tools', () => {
    it('should render dropdown tools correctly', () => {
      const config: ToolbarConfig = {
        tools: [
          {
            type: 'dropdown',
            command: 'fontSize',
            label: 'Font Size',
            options: [
              { value: '12px', label: '12px' },
              { value: '14px', label: '14px' },
              { value: '16px', label: '16px' }
            ]
          }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const dropdown = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown'));
      expect(dropdown).toBeTruthy();

      const trigger = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-trigger'));
      expect(trigger).toBeTruthy();
    });

    it('should toggle dropdown menu when trigger is clicked', () => {
      const config: ToolbarConfig = {
        tools: [
          {
            type: 'dropdown',
            command: 'fontSize',
            label: 'Font Size',
            options: [
              { value: '12px', label: '12px' },
              { value: '14px', label: '14px' }
            ]
          }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const trigger = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-trigger'));
      
      // Initially closed
      let menu = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-menu'));
      expect(menu).toBeFalsy();

      // Click to open
      trigger.nativeElement.click();
      fixture.detectChanges();

      menu = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-menu'));
      expect(menu).toBeTruthy();

      const options = fixture.debugElement.queryAll(By.css('.wysiwyg-toolbar__dropdown-option'));
      expect(options.length).toBe(2);
    });

    it('should emit command when dropdown option is selected', () => {
      const config: ToolbarConfig = {
        tools: [
          {
            type: 'dropdown',
            command: 'fontSize',
            label: 'Font Size',
            options: [
              { value: '12px', label: '12px' },
              { value: '14px', label: '14px' }
            ]
          }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      spyOn(component.command, 'emit');

      // Open dropdown
      const trigger = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-trigger'));
      trigger.nativeElement.click();
      fixture.detectChanges();

      // Click option
      const option = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-option'));
      option.nativeElement.click();

      expect(component.command.emit).toHaveBeenCalledWith({
        name: 'fontSize',
        value: '12px',
        options: {
          showUI: false,
          preventDefault: true
        }
      });
    });

    it('should close dropdown after option selection', () => {
      const config: ToolbarConfig = {
        tools: [
          {
            type: 'dropdown',
            command: 'fontSize',
            label: 'Font Size',
            options: [
              { value: '12px', label: '12px' }
            ]
          }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      // Open dropdown
      const trigger = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-trigger'));
      trigger.nativeElement.click();
      fixture.detectChanges();

      // Select option
      const option = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-option'));
      option.nativeElement.click();
      fixture.detectChanges();

      // Menu should be closed
      const menu = fixture.debugElement.query(By.css('.wysiwyg-toolbar__dropdown-menu'));
      expect(menu).toBeFalsy();
    });
  });

  describe('Dialog Tools', () => {
    it('should render dialog tools correctly', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'dialog', command: 'createLink', icon: 'link', label: 'Insert Link' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button--dialog'));
      expect(button).toBeTruthy();
    });

    it('should emit command when dialog tool is clicked', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'dialog', command: 'createLink', icon: 'link', label: 'Insert Link' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      spyOn(component.command, 'emit');

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button--dialog'));
      button.nativeElement.click();

      expect(component.command.emit).toHaveBeenCalledWith({
        name: 'createLink',
        options: {
          showUI: false,
          preventDefault: true
        }
      });
    });
  });

  describe('Active State Management', () => {
    it('should correctly identify active tools based on selection state', () => {
      const selectionState: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: true,
          italic: false,
          underline: true,
          strikethrough: false,
          fontSize: '14px',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'center'
        }
      };

      component.selectionState = selectionState;

      expect(component.isToolActive({ type: 'button', command: 'bold' })).toBe(true);
      expect(component.isToolActive({ type: 'button', command: 'italic' })).toBe(false);
      expect(component.isToolActive({ type: 'button', command: 'underline' })).toBe(true);
      expect(component.isToolActive({ type: 'button', command: 'justifyCenter' })).toBe(true);
      expect(component.isToolActive({ type: 'button', command: 'justifyLeft' })).toBe(false);
    });

    it('should return false for active state when no selection state', () => {
      component.selectionState = null;

      expect(component.isToolActive({ type: 'button', command: 'bold' })).toBe(false);
    });
  });

  describe('Icon Rendering', () => {
    it('should render icons correctly', () => {
      expect(component.getToolIcon({ type: 'button', command: 'bold', icon: 'bold' }))
        .toBe('<strong>B</strong>');
      expect(component.getToolIcon({ type: 'button', command: 'italic', icon: 'italic' }))
        .toBe('<em>I</em>');
      expect(component.getToolIcon({ type: 'button', command: 'underline', icon: 'underline' }))
        .toBe('<u>U</u>');
    });

    it('should return empty string for tools without icons', () => {
      expect(component.getToolIcon({ type: 'button', command: 'bold' })).toBe('');
    });

    it('should return custom icon if not in predefined map', () => {
      expect(component.getToolIcon({ type: 'button', command: 'custom', icon: 'custom-icon' }))
        .toBe('custom-icon');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button'));
      expect(button.nativeElement.title).toBe('Bold');
      expect(button.nativeElement.type).toBe('button');
    });

    it('should be keyboard accessible', () => {
      const config: ToolbarConfig = {
        tools: [
          { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' }
        ]
      };

      component.config = config;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.wysiwyg-toolbar__button'));
      
      // Should be focusable
      button.nativeElement.focus();
      expect(document.activeElement).toBe(button.nativeElement);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      spyOn(document, 'removeEventListener');
      
      component.ngOnDestroy();
      
      expect(document.removeEventListener).toHaveBeenCalled();
    });
  });
});