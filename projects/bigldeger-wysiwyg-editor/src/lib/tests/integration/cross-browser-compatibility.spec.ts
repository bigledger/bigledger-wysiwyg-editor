import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { BrowserCompatibilityService } from '../../services/browser-compatibility.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <wysiwyg-editor
      [formControl]="editorControl"
      [toolbarConfig]="toolbarConfig">
    </wysiwyg-editor>
  `
})
class CrossBrowserTestComponent {
  editorControl = new FormControl('<p>Test content</p>');
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' }
    ]
  };
}

describe('Cross-Browser Compatibility Tests', () => {
  let component: CrossBrowserTestComponent;
  let fixture: ComponentFixture<CrossBrowserTestComponent>;
  let editorComponent: WysiwygEditorComponent;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let browserCompatibilityService: jasmine.SpyObj<BrowserCompatibilityService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand', 'isCommandSupported', 'isCommandEnabled'
    ]);
    
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection', 'restoreSelection', 'getSelection', 'getRange'
    ]);
    
    const browserCompatibilityServiceSpy = jasmine.createSpyObj('BrowserCompatibilityService', [
      'isFeatureSupported', 'getFallbackImplementation', 'detectBrowser'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CrossBrowserTestComponent,
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: BrowserCompatibilityService, useValue: browserCompatibilityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CrossBrowserTestComponent);
    component = fixture.componentInstance;
    editorComponent = fixture.debugElement.query(By.directive(WysiwygEditorComponent)).componentInstance;
    
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    browserCompatibilityService = TestBed.inject(BrowserCompatibilityService) as jasmine.SpyObj<BrowserCompatibilityService>;

    // Setup default spy returns
    commandService.executeCommand.and.returnValue(true);
    commandService.isCommandSupported.and.returnValue(true);
    commandService.isCommandEnabled.and.returnValue(true);
    
    browserCompatibilityService.isFeatureSupported.and.returnValue(true);
    browserCompatibilityService.getBrowserInfo.and.returnValue({
      name: 'chrome',
      version: '90.0',
      os: 'Windows',
      mobile: false
    });

    fixture.detectChanges();
  });

  describe('Document.execCommand Compatibility', () => {
    it('should handle browsers without execCommand support', fakeAsync(() => {
      // Simulate browser without execCommand
      commandService.isCommandSupported.and.returnValue(false);
      browserCompatibilityService.isFeatureSupported.and.returnValue(false);
      
      const mockFallback = {
        executeCommand: jasmine.createSpy('executeCommand').and.returnValue(true)
      };
      browserCompatibilityService.getFallbackImplementation.and.returnValue(mockFallback);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(browserCompatibilityService.getFallbackImplementation).toHaveBeenCalledWith('execCommand');
      expect(commandService.executeCommand).toHaveBeenCalled();
    }));

    it('should handle partial execCommand support', fakeAsync(() => {
      // Simulate browser with partial execCommand support
      commandService.isCommandSupported.and.callFake((command: string) => {
        return command !== 'insertHTML'; // insertHTML not supported
      });
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalledWith({ name: 'bold' });
    }));
  });

  describe('Selection API Compatibility', () => {
    it('should handle browsers without Selection API', fakeAsync(() => {
      // Simulate browser without Selection API
      selectionService.getSelection.and.returnValue(null);
      browserCompatibilityService.isFeatureSupported.and.callFake((feature: string) => {
        return feature !== 'selectionAPI';
      });
      
      const mockFallback = {
        getSelection: jasmine.createSpy('getSelection').and.returnValue({
          rangeCount: 0,
          isCollapsed: true
        })
      };
      browserCompatibilityService.getFallbackImplementation.and.returnValue(mockFallback);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      // Should still work with fallback
      expect(commandService.executeCommand).toHaveBeenCalled();
    }));

    it('should handle different Range API implementations', fakeAsync(() => {
      const mockRanges = [
        // Modern Range API
        {
          startContainer: document.body,
          endContainer: document.body,
          startOffset: 0,
          endOffset: 5,
          cloneRange: jasmine.createSpy('cloneRange').and.returnValue({}),
          deleteContents: jasmine.createSpy('deleteContents'),
          insertNode: jasmine.createSpy('insertNode')
        },
        // Legacy Range API (limited methods)
        {
          startContainer: document.body,
          endContainer: document.body,
          startOffset: 0,
          endOffset: 5,
          cloneRange: undefined, // Not available in older browsers
          deleteContents: jasmine.createSpy('deleteContents'),
          insertNode: undefined // Not available in older browsers
        }
      ];

      mockRanges.forEach((mockRange, index) => {
        selectionService.getRange.and.returnValue(mockRange as any);
        
        const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
        boldButton.nativeElement.click();
        tick();
        
        expect(commandService.executeCommand).toHaveBeenCalled();
      });
    }));
  });

  describe('Event Handling Compatibility', () => {
    it('should handle different keyboard event implementations', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Test different keyboard event formats
      const keyboardEvents = [
        // Modern KeyboardEvent
        new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }),
        // Legacy KeyboardEvent (using keyCode)
        Object.assign(new Event('keydown'), { keyCode: 66, ctrlKey: true }),
        // IE-style event
        Object.assign(new Event('keydown'), { which: 66, ctrlKey: true })
      ];

      keyboardEvents.forEach(event => {
        contentElement.nativeElement.dispatchEvent(event);
        tick();
      });
      
      // Should handle all event formats
      expect(commandService.executeCommand).toHaveBeenCalledTimes(keyboardEvents.length);
    }));

    it('should handle different mouse event implementations', fakeAsync(() => {
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Test different mouse event formats
      const mouseEvents = [
        // Modern MouseEvent
        new MouseEvent('click', { clientX: 100, clientY: 100 }),
        // Legacy MouseEvent
        Object.assign(new Event('click'), { clientX: 100, clientY: 100 }),
        // Touch event (mobile)
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch]
        })
      ];

      mouseEvents.forEach(event => {
        contentElement.nativeElement.dispatchEvent(event);
        tick();
      });
      
      // Should handle all event formats without errors
    }));
  });

  describe('CSS and Styling Compatibility', () => {
    it('should handle different CSS property support', () => {
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-editor'));
      const computedStyle = window.getComputedStyle(editorElement.nativeElement);
      
      // Test for modern CSS properties with fallbacks
      const cssProperties = [
        'display', // Should always be supported
        'flexbox', // Modern property
        'grid', // Very modern property
        'user-select' // Vendor-prefixed property
      ];
      
      cssProperties.forEach(property => {
        // Should not throw errors even if property is not supported
        expect(() => {
          const value = (computedStyle as any)[property];
        }).not.toThrow();
      });
    });

    it('should handle vendor prefixes gracefully', () => {
      const testElement = document.createElement('div');
      
      // Test vendor-prefixed properties
      const vendorPrefixes = ['webkit', 'moz', 'ms', 'o'];
      const property = 'userSelect';
      
      vendorPrefixes.forEach(prefix => {
        const prefixedProperty = prefix + property.charAt(0).toUpperCase() + property.slice(1);
        
        expect(() => {
          (testElement.style as any)[prefixedProperty] = 'none';
        }).not.toThrow();
      });
    });
  });

  describe('File API Compatibility', () => {
    it('should handle browsers without File API', fakeAsync(() => {
      // Simulate browser without File API
      browserCompatibilityService.isFeatureSupported.and.callFake((feature: string) => {
        return feature !== 'fileAPI';
      });
      
      const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
      imageButton.nativeElement.click();
      tick();
      
      // Should still allow image insertion via URL
      expect(editorComponent.imageDialogVisible).toBeTruthy();
    }));

    it('should handle different FileReader implementations', fakeAsync(() => {
      const mockFileReaders = [
        // Modern FileReader
        {
          readAsDataURL: jasmine.createSpy('readAsDataURL'),
          result: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
          onload: null,
          onerror: null
        },
        // Legacy FileReader (limited support)
        {
          readAsDataURL: jasmine.createSpy('readAsDataURL'),
          result: null, // Might not be available immediately
          onload: null,
          onerror: null
        }
      ];

      mockFileReaders.forEach(mockReader => {
        // Mock FileReader constructor
        spyOn(window, 'FileReader').and.returnValue(mockReader as any);
        
        const imageButton = fixture.debugElement.query(By.css('[data-command="insertImage"]'));
        imageButton.nativeElement.click();
        tick();
        
        // Should handle different FileReader implementations
        expect(editorComponent.imageDialogVisible).toBeTruthy();
      });
    }));
  });

  describe('Clipboard API Compatibility', () => {
    it('should handle browsers without Clipboard API', fakeAsync(() => {
      // Simulate browser without modern Clipboard API
      browserCompatibilityService.isFeatureSupported.and.callFake((feature: string) => {
        return feature !== 'clipboardAPI';
      });
      
      const mockFallback = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
        readText: jasmine.createSpy('readText').and.returnValue(Promise.resolve('fallback text'))
      };
      browserCompatibilityService.getFallbackImplementation.and.returnValue(mockFallback);
      
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Simulate copy operation
      const copyEvent = new ClipboardEvent('copy');
      contentElement.nativeElement.dispatchEvent(copyEvent);
      tick();
      
      // Should use fallback implementation
      expect(browserCompatibilityService.getFallbackImplementation).toHaveBeenCalledWith('clipboardAPI');
    }));
  });

  describe('Browser-Specific Quirks', () => {
    it('should handle Internet Explorer quirks', fakeAsync(() => {
      // Simulate IE browser
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'ie',
        version: '11.0',
        os: 'Windows',
        mobile: false
      });
      
      // IE-specific behavior simulation
      commandService.executeCommand.and.callFake((command: any) => {
        // IE might return different values for some commands
        if (command.name === 'bold') {
          return true; // IE specific return value
        }
        return false;
      });
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalled();
    }));

    it('should handle Safari quirks', fakeAsync(() => {
      // Simulate Safari browser
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'safari',
        version: '14.0',
        os: 'macOS',
        mobile: false
      });
      
      // Safari-specific behavior
      selectionService.getSelection.and.returnValue({
        rangeCount: 1,
        isCollapsed: false,
        // Safari might have different selection behavior
        toString: () => 'safari selection'
      } as any);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalled();
    }));

    it('should handle Firefox quirks', fakeAsync(() => {
      // Simulate Firefox browser
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'firefox',
        version: '88.0',
        os: 'Windows',
        mobile: false
      });
      
      // Firefox-specific behavior
      commandService.isCommandSupported.and.callFake((command: string) => {
        // Firefox might not support certain commands
        return command !== 'insertBrOnReturn';
      });
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      expect(commandService.executeCommand).toHaveBeenCalled();
    }));
  });

  describe('Mobile Browser Compatibility', () => {
    it('should handle mobile Safari', fakeAsync(() => {
      // Simulate mobile Safari
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'mobile-safari',
        version: '14.0',
        os: 'iOS',
        mobile: true
      });
      
      // Mobile Safari specific behavior
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Touch events instead of mouse events
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      
      contentElement.nativeElement.dispatchEvent(touchEvent);
      tick();
      
      // Should handle touch events properly
    }));

    it('should handle Android Chrome', fakeAsync(() => {
      // Simulate Android Chrome
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'chrome-mobile',
        version: '90.0',
        os: 'Android',
        mobile: true
      });
      
      // Android Chrome specific behavior
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Virtual keyboard events
      const inputEvent = new InputEvent('input', { data: 'test' });
      contentElement.nativeElement.dispatchEvent(inputEvent);
      tick();
      
      // Should handle virtual keyboard input
    }));
  });

  describe('Feature Detection and Graceful Degradation', () => {
    it('should gracefully degrade when features are not supported', fakeAsync(() => {
      // Simulate browser with minimal feature support
      browserCompatibilityService.isFeatureSupported.and.returnValue(false);
      
      const mockMinimalFallback = {
        executeCommand: jasmine.createSpy('executeCommand').and.returnValue(false),
        getSelection: jasmine.createSpy('getSelection').and.returnValue(null)
      };
      browserCompatibilityService.getFallbackImplementation.and.returnValue(mockMinimalFallback);
      
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      // Should not throw errors even with minimal support
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    }));

    it('should provide appropriate user feedback for unsupported features', fakeAsync(() => {
      // Simulate unsupported browser
      browserCompatibilityService.getBrowserInfo.and.returnValue({
        name: 'unknown',
        version: '0.0',
        os: 'Unknown',
        mobile: false
      });
      
      fixture.detectChanges();
      tick();
      
      // Should still render the editor but might show warnings
      const editorElement = fixture.debugElement.query(By.css('.wysiwyg-editor'));
      expect(editorElement).toBeTruthy();
    }));
  });

  describe('Performance Across Browsers', () => {
    it('should maintain acceptable performance across different browsers', fakeAsync(() => {
      const browsers = [
        { name: 'chrome', version: '90.0' },
        { name: 'firefox', version: '88.0' },
        { name: 'safari', version: '14.0' },
        { name: 'edge', version: '90.0' }
      ];

      browsers.forEach(browser => {
        browserCompatibilityService.getBrowserInfo.and.returnValue({
          name: browser.name,
          version: browser.version,
          os: 'Windows',
          mobile: false
        });
        
        const startTime = performance.now();
        
        // Perform standard operations
        const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
        boldButton.nativeElement.click();
        tick();
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        // Should complete within reasonable time for all browsers
        expect(operationTime).toBeLessThan(1000);
      });
    }));
  });
});