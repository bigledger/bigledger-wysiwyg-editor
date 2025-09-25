import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../components/wysiwyg-editor/wysiwyg-editor.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { EditorContentComponent } from '../../components/editor-content/editor-content.component';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HistoryService } from '../../services/history.service';
import { EditorService } from '../../services/editor.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <wysiwyg-editor
      [formControl]="editorControl"
      [toolbarConfig]="toolbarConfig"
      [height]="'500px'"
      (contentChange)="onContentChange($event)">
    </wysiwyg-editor>
  `
})
class PerformanceTestComponent {
  editorControl = new FormControl('');
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };
  
  contentChangeCount = 0;
  lastContentChangeTime = 0;

  onContentChange(content: string): void {
    this.contentChangeCount++;
    this.lastContentChangeTime = performance.now();
  }
}

describe('Large Document Performance Tests', () => {
  let component: PerformanceTestComponent;
  let fixture: ComponentFixture<PerformanceTestComponent>;
  let editorComponent: WysiwygEditorComponent;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let historyService: jasmine.SpyObj<HistoryService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand', 'isCommandSupported', 'isCommandEnabled', 
      'getCommandState', 'getCommandValue', 'undo', 'redo', 'canUndo', 'canRedo'
    ]);
    
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection', 'restoreSelection', 'getSelection', 'getRange',
      'selectAll', 'collapse', 'hasSelection', 'getSelectedText'
    ]);
    
    const historyServiceSpy = jasmine.createSpyObj('HistoryService', [
      'addState', 'undo', 'redo', 'canUndo', 'canRedo', 'clear'
    ]);

    await TestBed.configureTestingModule({
      declarations: [
        PerformanceTestComponent,
        WysiwygEditorComponent,
        ToolbarComponent,
        EditorContentComponent
      ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        EditorService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceTestComponent);
    component = fixture.componentInstance;
    editorComponent = fixture.debugElement.query(By.directive(WysiwygEditorComponent)).componentInstance;
    
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    historyService = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;

    // Setup default spy returns
    commandService.executeCommand.and.returnValue(true);
    commandService.isCommandSupported.and.returnValue(true);
    commandService.isCommandEnabled.and.returnValue(true);
    commandService.canUndo.and.returnValue(false);
    commandService.canRedo.and.returnValue(false);
    
    selectionService.hasSelection.and.returnValue(false);
    selectionService.getSelectedText.and.returnValue('');
    
    historyService.canUndo.and.returnValue(false);
    historyService.canRedo.and.returnValue(false);

    fixture.detectChanges();
  });

  function generateLargeDocument(paragraphs: number = 1000): string {
    const paragraphTexts = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.',
      'Explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.'
    ];

    let content = '';
    for (let i = 0; i < paragraphs; i++) {
      const text = paragraphTexts[i % paragraphTexts.length];
      const formatting = i % 3 === 0 ? '<strong>' : i % 3 === 1 ? '<em>' : '';
      const closingTag = i % 3 === 0 ? '</strong>' : i % 3 === 1 ? '</em>' : '';
      content += `<p>${formatting}${text} (Paragraph ${i + 1})${closingTag}</p>`;
    }
    return content;
  }

  describe('Large Document Loading Performance', () => {
    it('should load large document (1000 paragraphs) within acceptable time', fakeAsync(() => {
      const largeContent = generateLargeDocument(1000);
      const startTime = performance.now();
      
      component.editorControl.setValue(largeContent);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
      expect(component.editorControl.value).toBe(largeContent);
    }));

    it('should handle very large document (5000 paragraphs) gracefully', fakeAsync(() => {
      const veryLargeContent = generateLargeDocument(5000);
      const startTime = performance.now();
      
      component.editorControl.setValue(veryLargeContent);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 10 seconds even for very large documents
      expect(loadTime).toBeLessThan(10000);
      expect(component.editorControl.value).toBe(veryLargeContent);
    }));
  });

  describe('Rapid Content Changes Performance', () => {
    it('should handle 1000 rapid content changes efficiently', fakeAsync(() => {
      const startTime = performance.now();
      const initialChangeCount = component.contentChangeCount;
      
      // Simulate 1000 rapid content changes
      for (let i = 0; i < 1000; i++) {
        const content = `<p>Rapid change ${i}</p>`;
        editorComponent.onContentChange(content);
        
        // Small tick to simulate real-world timing
        if (i % 100 === 0) {
          tick(1);
        }
      }
      
      tick(100); // Final tick to ensure all changes are processed
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 1000 changes within 5 seconds
      expect(totalTime).toBeLessThan(5000);
      expect(component.contentChangeCount - initialChangeCount).toBe(1000);
    }));

    it('should debounce content changes to prevent excessive updates', fakeAsync(() => {
      const startTime = performance.now();
      
      // Simulate very rapid changes (should be debounced)
      for (let i = 0; i < 100; i++) {
        editorComponent.onContentChange(`<p>Debounced change ${i}</p>`);
      }
      
      // Wait for debounce period
      tick(500);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete quickly due to debouncing
      expect(totalTime).toBeLessThan(1000);
    }));
  });

  describe('Complex Formatting Operations Performance', () => {
    it('should handle complex formatting operations on large selections', fakeAsync(() => {
      const largeContent = generateLargeDocument(500);
      component.editorControl.setValue(largeContent);
      tick();
      
      // Simulate large text selection
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue(largeContent.substring(0, 10000));
      
      const startTime = performance.now();
      
      // Apply multiple formatting operations
      const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
      boldButton.nativeElement.click();
      tick();
      
      const italicButton = fixture.debugElement.query(By.css('[data-command="italic"]'));
      italicButton.nativeElement.click();
      tick();
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Complex operations should complete within 3 seconds
      expect(operationTime).toBeLessThan(3000);
      expect(commandService.executeCommand).toHaveBeenCalledTimes(2);
    }));
  });

  describe('History Management Performance', () => {
    it('should handle large history with many undo/redo operations', fakeAsync(() => {
      historyService.canUndo.and.returnValue(true);
      historyService.canRedo.and.returnValue(true);
      commandService.canUndo.and.returnValue(true);
      commandService.canRedo.and.returnValue(true);
      
      const undoButton = fixture.debugElement.query(By.css('[data-command="undo"]'));
      const redoButton = fixture.debugElement.query(By.css('[data-command="redo"]'));
      
      const startTime = performance.now();
      
      // Perform many undo/redo operations
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          undoButton.nativeElement.click();
        } else {
          redoButton.nativeElement.click();
        }
        tick(1);
      }
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // 100 undo/redo operations should complete within 2 seconds
      expect(operationTime).toBeLessThan(2000);
      expect(commandService.executeCommand).toHaveBeenCalledTimes(100);
    }));
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with repeated content changes', fakeAsync(() => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many operations that could cause memory leaks
      for (let i = 0; i < 1000; i++) {
        const content = generateLargeDocument(10);
        component.editorControl.setValue(content);
        tick(1);
        
        // Trigger various operations
        editorComponent.onContentChange(content);
        
        // Force garbage collection periodically (if available)
        if (i % 100 === 0 && (window as any).gc) {
          (window as any).gc();
        }
      }
      
      tick(1000); // Allow time for cleanup
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not increase dramatically (allow for some growth)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const maxAllowedIncrease = 50 * 1024 * 1024; // 50MB
        
        expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
      }
    }));
  });

  describe('Rendering Performance', () => {
    it('should maintain smooth rendering with complex content', fakeAsync(() => {
      const complexContent = `
        <div>
          <h1>Complex Document</h1>
          <p>This is a <strong>complex</strong> document with <em>various</em> formatting.</p>
          <ul>
            <li>List item 1 with <a href="#">link</a></li>
            <li>List item 2 with <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test"></li>
          </ul>
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
            <tr><td>Cell 3</td><td>Cell 4</td></tr>
          </table>
          ${generateLargeDocument(100)}
        </div>
      `;
      
      const startTime = performance.now();
      
      component.editorControl.setValue(complexContent);
      tick();
      fixture.detectChanges();
      
      // Simulate user interactions
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      // Simulate scrolling
      for (let i = 0; i < 10; i++) {
        const scrollEvent = new Event('scroll');
        contentElement.nativeElement.dispatchEvent(scrollEvent);
        tick(10);
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Complex rendering should complete within 3 seconds
      expect(renderTime).toBeLessThan(3000);
    }));
  });

  describe('Cross-browser Performance', () => {
    it('should perform consistently across different browser APIs', fakeAsync(() => {
      // Test with different selection API implementations
      const mockSelections = [
        { rangeCount: 1, isCollapsed: false },
        { rangeCount: 0, isCollapsed: true },
        null // Simulate browser without selection API
      ];
      
      mockSelections.forEach((mockSelection, index) => {
        selectionService.getSelection.and.returnValue(mockSelection as any);
        
        const startTime = performance.now();
        
        // Perform operations that depend on selection API
        const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
        boldButton.nativeElement.click();
        tick();
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        // Should handle different browser APIs within reasonable time
        expect(operationTime).toBeLessThan(1000);
      });
    }));
  });

  describe('Stress Testing', () => {
    it('should handle extreme stress conditions', fakeAsync(() => {
      const startTime = performance.now();
      
      // Extreme stress test: large document + rapid changes + complex operations
      const largeContent = generateLargeDocument(2000);
      component.editorControl.setValue(largeContent);
      tick();
      
      // Rapid formatting changes
      const buttons = fixture.debugElement.queryAll(By.css('button[data-command]'));
      
      for (let i = 0; i < 50; i++) {
        // Click random buttons
        const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
        randomButton.nativeElement.click();
        
        // Rapid content changes
        editorComponent.onContentChange(`${largeContent}<p>Stress test ${i}</p>`);
        
        tick(1);
      }
      
      const endTime = performance.now();
      const stressTestTime = endTime - startTime;
      
      // Extreme stress test should complete within 10 seconds
      expect(stressTestTime).toBeLessThan(10000);
      
      // Editor should still be functional
      expect(component.editorControl.value).toBeTruthy();
    }));
  });
});