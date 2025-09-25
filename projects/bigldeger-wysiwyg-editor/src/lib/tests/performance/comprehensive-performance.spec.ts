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
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { ToolbarConfig } from '../../models/toolbar.interface';

@Component({
  template: `
    <wysiwyg-editor
      [formControl]="editorControl"
      [toolbarConfig]="toolbarConfig"
      [height]="'600px'"
      (contentChange)="onContentChange($event)"
      (selectionChange)="onSelectionChange($event)">
    </wysiwyg-editor>
    
    <div class="performance-metrics">
      <div>Content Changes: {{ contentChangeCount }}</div>
      <div>Selection Changes: {{ selectionChangeCount }}</div>
      <div>Last Operation Time: {{ lastOperationTime }}ms</div>
      <div>Average Operation Time: {{ averageOperationTime }}ms</div>
      <div>Memory Usage: {{ memoryUsage }}MB</div>
    </div>
  `
})
class PerformanceTestComponent {
  editorControl = new FormControl('');
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'dropdown', command: 'fontSize', label: 'Font Size', options: [
        { value: '12px', label: '12px' },
        { value: '14px', label: '14px' },
        { value: '16px', label: '16px' },
        { value: '18px', label: '18px' },
        { value: '20px', label: '20px' },
        { value: '24px', label: '24px' }
      ]},
      { type: 'dropdown', command: 'foreColor', label: 'Text Color', options: [
        { value: '#000000', label: 'Black' },
        { value: '#ff0000', label: 'Red' },
        { value: '#00ff00', label: 'Green' },
        { value: '#0000ff', label: 'Blue' },
        { value: '#ffff00', label: 'Yellow' },
        { value: '#ff00ff', label: 'Magenta' },
        { value: '#00ffff', label: 'Cyan' }
      ]},
      { type: 'button', command: 'createLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' },
      { type: 'button', command: 'insertUnorderedList', icon: 'list-ul', label: 'Bullet List' },
      { type: 'button', command: 'insertOrderedList', icon: 'list-ol', label: 'Numbered List' },
      { type: 'button', command: 'justifyLeft', icon: 'align-left', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'align-center', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'align-right', label: 'Align Right' },
      { type: 'button', command: 'justifyFull', icon: 'align-justify', label: 'Justify' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };
  
  contentChangeCount = 0;
  selectionChangeCount = 0;
  lastOperationTime = 0;
  operationTimes: number[] = [];
  averageOperationTime = 0;
  memoryUsage = 0;

  onContentChange(content: string): void {
    this.contentChangeCount++;
    this.updateMemoryUsage();
  }

  onSelectionChange(selection: any): void {
    this.selectionChangeCount++;
  }
  
  recordOperationTime(time: number): void {
    this.lastOperationTime = time;
    this.operationTimes.push(time);
    this.averageOperationTime = this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length;
  }
  
  updateMemoryUsage(): void {
    if ((performance as any).memory) {
      this.memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
  }
}

describe('Comprehensive Performance Tests', () => {
  let component: PerformanceTestComponent;
  let fixture: ComponentFixture<PerformanceTestComponent>;
  let editorComponent: WysiwygEditorComponent;
  let commandService: jasmine.SpyObj<CommandService>;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let historyService: jasmine.SpyObj<HistoryService>;
  let editorService: jasmine.SpyObj<EditorService>;
  let sanitizerService: jasmine.SpyObj<HTMLSanitizerService>;

  beforeEach(async () => {
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand', 'isCommandSupported', 'isCommandEnabled', 
      'getCommandState', 'getCommandValue', 'insertImage', 'createLink',
      'undo', 'redo', 'canUndo', 'canRedo', 'insertHTML', 'insertText',
      'removeFormatting', 'executeCommands'
    ]);
    
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection', 'restoreSelection', 'getSelection', 'getRange',
      'selectAll', 'collapse', 'hasSelection', 'getSelectedText', 'wrapSelection'
    ]);
    
    const historyServiceSpy = jasmine.createSpyObj('HistoryService', [
      'addState', 'undo', 'redo', 'canUndo', 'canRedo', 'clear',
      'getStates', 'getCurrentIndex', 'setMaxStates'
    ]);
    
    const editorServiceSpy = jasmine.createSpyObj('EditorService', [
      'executeCommand', 'setContent', 'getContent', 'focus', 'blur'
    ]);
    
    const sanitizerServiceSpy = jasmine.createSpyObj('HTMLSanitizerService', [
      'sanitize', 'stripTags', 'cleanAttributes', 'isValidHTML'
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
        { provide: EditorService, useValue: editorServiceSpy },
        { provide: HTMLSanitizerService, useValue: sanitizerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceTestComponent);
    component = fixture.componentInstance;
    editorComponent = fixture.debugElement.query(By.directive(WysiwygEditorComponent)).componentInstance;
    
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    historyService = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;
    editorService = TestBed.inject(EditorService) as jasmine.SpyObj<EditorService>;
    sanitizerService = TestBed.inject(HTMLSanitizerService) as jasmine.SpyObj<HTMLSanitizerService>;

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
    
    sanitizerService.sanitize.and.returnValue('');
    sanitizerService.isValidHTML.and.returnValue(true);

    fixture.detectChanges();
  });

  function generateComplexDocument(size: 'small' | 'medium' | 'large' | 'xlarge'): string {
    const sizes = {
      small: 100,
      medium: 1000,
      large: 5000,
      xlarge: 10000
    };
    
    const paragraphCount = sizes[size];
    let content = '<h1>Performance Test Document</h1>';
    
    const sampleTexts = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.',
      'Et harum quidem rerum facilis est et expedita distinctio nam libero.',
      'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.'
    ];
    
    const formatOptions = [
      '<p>{text}</p>',
      '<p><strong>{text}</strong></p>',
      '<p><em>{text}</em></p>',
      '<p><u>{text}</u></p>',
      '<p style="color: red;">{text}</p>',
      '<p style="font-size: 18px;">{text}</p>',
      '<p style="text-align: center;">{text}</p>',
      '<h2>{text}</h2>',
      '<h3>{text}</h3>',
      '<blockquote>{text}</blockquote>'
    ];
    
    for (let i = 0; i < paragraphCount; i++) {
      const text = sampleTexts[i % sampleTexts.length] + ` (Paragraph ${i + 1})`;
      const format = formatOptions[i % formatOptions.length];
      content += format.replace('{text}', text);
      
      // Add lists every 20 paragraphs
      if (i % 20 === 19) {
        content += '<ul>';
        for (let j = 0; j < 5; j++) {
          content += `<li>List item ${j + 1} in section ${Math.floor(i / 20) + 1}</li>`;
        }
        content += '</ul>';
      }
      
      // Add links every 30 paragraphs
      if (i % 30 === 29) {
        content += `<p>Reference link: <a href="https://example.com/ref${i}">Link ${i}</a></p>`;
      }
      
      // Add images every 50 paragraphs
      if (i % 50 === 49) {
        content += `<p><img src="https://via.placeholder.com/300x200" alt="Image ${i}" width="300" height="200"></p>`;
      }
    }
    
    return content;
  }

  describe('Large Document Performance', () => {
    it('should handle small documents (100 paragraphs) efficiently', fakeAsync(() => {
      const content = generateComplexDocument('small');
      const startTime = performance.now();
      
      component.editorControl.setValue(content);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      component.recordOperationTime(loadTime);
      
      expect(loadTime).toBeLessThan(500); // 500ms for small documents
      expect(component.editorControl.value).toBe(content);
    }));

    it('should handle medium documents (1000 paragraphs) efficiently', fakeAsync(() => {
      const content = generateComplexDocument('medium');
      const startTime = performance.now();
      
      component.editorControl.setValue(content);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      component.recordOperationTime(loadTime);
      
      expect(loadTime).toBeLessThan(2000); // 2 seconds for medium documents
      expect(component.editorControl.value).toBe(content);
    }));

    it('should handle large documents (5000 paragraphs) efficiently', fakeAsync(() => {
      const content = generateComplexDocument('large');
      const startTime = performance.now();
      
      component.editorControl.setValue(content);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      component.recordOperationTime(loadTime);
      
      expect(loadTime).toBeLessThan(5000); // 5 seconds for large documents
      expect(component.editorControl.value).toBe(content);
    }));

    it('should handle extra large documents (10000 paragraphs) gracefully', fakeAsync(() => {
      const content = generateComplexDocument('xlarge');
      const startTime = performance.now();
      
      component.editorControl.setValue(content);
      tick();
      fixture.detectChanges();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      component.recordOperationTime(loadTime);
      
      expect(loadTime).toBeLessThan(10000); // 10 seconds for extra large documents
      expect(component.editorControl.value).toBe(content);
    }));
  });

  describe('Rapid Operations Performance', () => {
    it('should handle 1000 rapid content changes efficiently', fakeAsync(() => {
      const startTime = performance.now();
      const initialChangeCount = component.contentChangeCount;
      
      for (let i = 0; i < 1000; i++) {
        const content = `<p>Rapid change ${i} with some additional content to make it realistic</p>`;
        editorComponent.onContentChange(content);
        
        if (i % 100 === 0) {
          tick(1);
        }
      }
      
      tick(100);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      component.recordOperationTime(totalTime);
      
      expect(totalTime).toBeLessThan(3000); // 3 seconds for 1000 changes
      expect(component.contentChangeCount - initialChangeCount).toBe(1000);
    }));

    it('should handle rapid formatting operations efficiently', fakeAsync(() => {
      const largeContent = generateComplexDocument('medium');
      component.editorControl.setValue(largeContent);
      tick();
      
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue('selected text');
      
      const startTime = performance.now();
      
      // Perform 100 rapid formatting operations
      const buttons = fixture.debugElement.queryAll(By.css('button[data-command]'));
      
      for (let i = 0; i < 100; i++) {
        const randomButton = buttons[i % buttons.length];
        randomButton.nativeElement.click();
        
        if (i % 10 === 0) {
          tick(1);
        }
      }
      
      tick(50);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      component.recordOperationTime(operationTime);
      
      expect(operationTime).toBeLessThan(2000); // 2 seconds for 100 operations
      expect(commandService.executeCommand).toHaveBeenCalledTimes(100);
    }));

    it('should handle rapid selection changes efficiently', fakeAsync(() => {
      const startTime = performance.now();
      const initialSelectionCount = component.selectionChangeCount;
      
      // Simulate 500 rapid selection changes
      for (let i = 0; i < 500; i++) {
        const mockSelection = {
          collapsed: i % 2 === 0,
          range: document.createRange(),
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left' as 'left' as 'left'
          }
        };
        
        editorComponent.onSelectionChange(mockSelection);
        
        if (i % 50 === 0) {
          tick(1);
        }
      }
      
      tick(50);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      component.recordOperationTime(totalTime);
      
      expect(totalTime).toBeLessThan(1000); // 1 second for 500 selection changes
      expect(component.selectionChangeCount - initialSelectionCount).toBe(500);
    }));
  });

  describe('Complex Operations Performance', () => {
    it('should handle complex formatting on large selections efficiently', fakeAsync(() => {
      const largeContent = generateComplexDocument('large');
      component.editorControl.setValue(largeContent);
      tick();
      
      // Simulate large selection
      selectionService.hasSelection.and.returnValue(true);
      selectionService.getSelectedText.and.returnValue(largeContent.substring(0, 50000));
      
      const startTime = performance.now();
      
      // Apply multiple complex formatting operations
      const operations = [
        'bold', 'italic', 'underline', 'fontSize', 'foreColor',
        'justifyCenter', 'insertUnorderedList', 'createLink'
      ];
      
      operations.forEach((operation, index) => {
        const button = fixture.debugElement.query(By.css(`[data-command="${operation}"]`));
        if (button) {
          button.nativeElement.click();
          tick(10);
        }
      });
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      component.recordOperationTime(operationTime);
      
      expect(operationTime).toBeLessThan(3000); // 3 seconds for complex operations
    }));

    it('should handle batch operations efficiently', fakeAsync(() => {
      const content = generateComplexDocument('medium');
      component.editorControl.setValue(content);
      tick();
      
      const startTime = performance.now();
      
      // Simulate batch operations
      const batchCommands = [
        { name: 'bold' },
        { name: 'italic' },
        { name: 'fontSize', value: '18px' },
        { name: 'foreColor', value: '#ff0000' },
        { name: 'justifyCenter' }
      ];
      
      // Execute batch commands
      commandService.executeCommands.and.returnValue(true);
      
      for (let i = 0; i < 50; i++) {
        commandService.executeCommands(batchCommands);
        tick(1);
      }
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;
      
      component.recordOperationTime(batchTime);
      
      expect(batchTime).toBeLessThan(1500); // 1.5 seconds for 50 batch operations
      expect(commandService.executeCommands).toHaveBeenCalledTimes(50);
    }));
  });

  describe('History Management Performance', () => {
    it('should handle large history efficiently', fakeAsync(() => {
      historyService.canUndo.and.returnValue(true);
      historyService.canRedo.and.returnValue(true);
      commandService.canUndo.and.returnValue(true);
      commandService.canRedo.and.returnValue(true);
      
      const undoButton = fixture.debugElement.query(By.css('[data-command="undo"]'));
      const redoButton = fixture.debugElement.query(By.css('[data-command="redo"]'));
      
      const startTime = performance.now();
      
      // Perform 200 undo/redo operations
      for (let i = 0; i < 200; i++) {
        if (i % 2 === 0) {
          undoButton.nativeElement.click();
        } else {
          redoButton.nativeElement.click();
        }
        
        if (i % 20 === 0) {
          tick(1);
        }
      }
      
      tick(50);
      
      const endTime = performance.now();
      const historyTime = endTime - startTime;
      
      component.recordOperationTime(historyTime);
      
      expect(historyTime).toBeLessThan(2000); // 2 seconds for 200 history operations
      expect(commandService.executeCommand).toHaveBeenCalledTimes(200);
    }));

    it('should handle history with large states efficiently', fakeAsync(() => {
      const largeStates = [];
      
      // Create 100 large history states
      for (let i = 0; i < 100; i++) {
        largeStates.push({
          id: `state_${i}`,
          content: generateComplexDocument('small'),
          timestamp: Date.now() + i,
          operation: `operation_${i}`,
          selection: { start: 0, end: 0 }
        });
      }
      
      historyService.getAllStates.and.returnValue(largeStates);
      
      const startTime = performance.now();
      
      // Simulate history operations with large states
      for (let i = 0; i < 50; i++) {
        historyService.addState(largeStates[i % largeStates.length]);
        tick(1);
      }
      
      const endTime = performance.now();
      const stateTime = endTime - startTime;
      
      component.recordOperationTime(stateTime);
      
      expect(stateTime).toBeLessThan(1000); // 1 second for 50 large state operations
    }));
  });

  describe('Memory Management Performance', () => {
    it('should not cause memory leaks with repeated operations', fakeAsync(() => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform operations that could cause memory leaks
      for (let i = 0; i < 500; i++) {
        const content = generateComplexDocument('small');
        component.editorControl.setValue(content);
        tick(1);
        
        editorComponent.onContentChange(content);
        
        // Simulate various operations
        if (i % 10 === 0) {
          const mockSelection = { 
            collapsed: false, 
            range: document.createRange(),
            formats: {
              bold: false,
              italic: false,
              underline: false,
              fontSize: '14px',
              fontColor: '#000000',
              backgroundColor: 'transparent',
              alignment: 'left' as 'left'
            }
          };
          editorComponent.onSelectionChange(mockSelection);
        }
        
        // Force garbage collection periodically (if available)
        if (i % 100 === 0 && (window as any).gc) {
          (window as any).gc();
        }
      }
      
      tick(1000);
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const maxAllowedIncrease = 100 * 1024 * 1024; // 100MB
        
        expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
      }
      
      component.updateMemoryUsage();
      expect(component.memoryUsage).toBeLessThan(200); // Less than 200MB total
    }));

    it('should handle DOM node cleanup efficiently', fakeAsync(() => {
      const initialNodeCount = document.querySelectorAll('*').length;
      
      // Create and destroy many editor instances
      for (let i = 0; i < 50; i++) {
        const tempContent = generateComplexDocument('small');
        component.editorControl.setValue(tempContent);
        tick(1);
        
        // Simulate component lifecycle
        editorComponent.ngOnInit();
        editorComponent.ngOnDestroy();
        
        if (i % 10 === 0) {
          tick(10);
        }
      }
      
      tick(100);
      
      const finalNodeCount = document.querySelectorAll('*').length;
      const nodeIncrease = finalNodeCount - initialNodeCount;
      
      // Should not accumulate too many DOM nodes
      expect(nodeIncrease).toBeLessThan(1000);
    }));
  });

  describe('Rendering Performance', () => {
    it('should maintain smooth rendering with complex content', fakeAsync(() => {
      const complexContent = generateComplexDocument('large');
      
      const startTime = performance.now();
      
      component.editorControl.setValue(complexContent);
      tick();
      fixture.detectChanges();
      
      // Simulate user interactions that trigger re-renders
      const contentElement = fixture.debugElement.query(By.css('.wysiwyg-content'));
      
      for (let i = 0; i < 20; i++) {
        // Simulate scrolling
        const scrollEvent = new Event('scroll');
        contentElement.nativeElement.dispatchEvent(scrollEvent);
        
        // Simulate selection changes
        const selectionEvent = new Event('selectionchange');
        document.dispatchEvent(selectionEvent);
        
        tick(10);
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      component.recordOperationTime(renderTime);
      
      expect(renderTime).toBeLessThan(3000); // 3 seconds for complex rendering
    }));

    it('should handle rapid DOM updates efficiently', fakeAsync(() => {
      const startTime = performance.now();
      
      // Perform rapid DOM updates
      for (let i = 0; i < 100; i++) {
        const content = `<p>Update ${i}: ${generateComplexDocument('small').substring(0, 1000)}</p>`;
        editorComponent.onContentChange(content);
        
        if (i % 10 === 0) {
          tick(1);
          fixture.detectChanges();
        }
      }
      
      tick(100);
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      component.recordOperationTime(updateTime);
      
      expect(updateTime).toBeLessThan(2000); // 2 seconds for 100 DOM updates
    }));
  });

  describe('Cross-Browser Performance', () => {
    it('should perform consistently with different API implementations', fakeAsync(() => {
      const apiVariations = [
        { execCommand: true, selection: true, range: true },
        { execCommand: false, selection: true, range: true },
        { execCommand: true, selection: false, range: true },
        { execCommand: true, selection: true, range: false }
      ];
      
      apiVariations.forEach((variation, index) => {
        commandService.isCommandSupported.and.returnValue(variation.execCommand);
        selectionService.getSelection.and.returnValue(variation.selection ? {} as Selection : null);
        selectionService.getRange.and.returnValue(variation.range ? {} as Range : null);
        
        const startTime = performance.now();
        
        // Perform operations with different API support
        const content = generateComplexDocument('medium');
        component.editorControl.setValue(content);
        tick();
        
        // Test formatting operations
        const boldButton = fixture.debugElement.query(By.css('[data-command="bold"]'));
        boldButton.nativeElement.click();
        tick();
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        component.recordOperationTime(operationTime);
        
        // Should handle all variations within reasonable time
        expect(operationTime).toBeLessThan(3000);
      });
    }));
  });

  describe('Stress Testing', () => {
    it('should handle extreme stress conditions', fakeAsync(() => {
      const startTime = performance.now();
      
      // Extreme stress: large document + rapid changes + complex operations
      const xlargeContent = generateComplexDocument('xlarge');
      component.editorControl.setValue(xlargeContent);
      tick();
      
      // Rapid operations under stress
      const buttons = fixture.debugElement.queryAll(By.css('button[data-command]'));
      
      for (let i = 0; i < 100; i++) {
        // Random button clicks
        const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
        randomButton.nativeElement.click();
        
        // Rapid content changes
        editorComponent.onContentChange(`${xlargeContent}<p>Stress test ${i}</p>`);
        
        // Selection changes
        const mockSelection = { 
          collapsed: i % 2 === 0, 
          range: document.createRange(),
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left' as 'left'
          }
        };
        editorComponent.onSelectionChange(mockSelection);
        
        if (i % 10 === 0) {
          tick(1);
        }
      }
      
      tick(500);
      
      const endTime = performance.now();
      const stressTime = endTime - startTime;
      
      component.recordOperationTime(stressTime);
      
      // Should survive extreme stress within 15 seconds
      expect(stressTime).toBeLessThan(15000);
      
      // Editor should still be functional
      expect(component.editorControl.value).toBeTruthy();
      expect(component.contentChangeCount).toBeGreaterThan(0);
    }));

    it('should maintain performance under concurrent operations', fakeAsync(() => {
      const startTime = performance.now();
      
      // Simulate concurrent operations
      const operations = [];
      
      for (let i = 0; i < 50; i++) {
        operations.push(() => {
          const content = generateComplexDocument('small');
          component.editorControl.setValue(content);
          editorComponent.onContentChange(content);
        });
        
        operations.push(() => {
          const mockSelection = { 
            collapsed: false, 
            range: document.createRange(),
            formats: {
              bold: false,
              italic: false,
              underline: false,
              fontSize: '14px',
              fontColor: '#000000',
              backgroundColor: 'transparent',
              alignment: 'left' as 'left'
            }
          };
          editorComponent.onSelectionChange(mockSelection);
        });
        
        operations.push(() => {
          const buttons = fixture.debugElement.queryAll(By.css('button[data-command]'));
          if (buttons.length > 0) {
            const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
            randomButton.nativeElement.click();
          }
        });
      }
      
      // Execute all operations rapidly
      operations.forEach((operation, index) => {
        operation();
        if (index % 20 === 0) {
          tick(1);
        }
      });
      
      tick(200);
      
      const endTime = performance.now();
      const concurrentTime = endTime - startTime;
      
      component.recordOperationTime(concurrentTime);
      
      expect(concurrentTime).toBeLessThan(5000); // 5 seconds for concurrent operations
      expect(component.contentChangeCount).toBeGreaterThan(0);
      expect(component.selectionChangeCount).toBeGreaterThan(0);
    }));
  });

  describe('Performance Metrics and Monitoring', () => {
    it('should provide accurate performance metrics', fakeAsync(() => {
      // Perform various operations and collect metrics
      const operations = [
        () => component.editorControl.setValue(generateComplexDocument('small')),
        () => component.editorControl.setValue(generateComplexDocument('medium')),
        () => editorComponent.onContentChange('<p>Test content</p>'),
        () => editorComponent.onSelectionChange({ 
          collapsed: false, 
          range: document.createRange(),
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left' as 'left'
          }
        })
      ];
      
      operations.forEach(operation => {
        const opStartTime = performance.now();
        operation();
        tick(1);
        const opEndTime = performance.now();
        component.recordOperationTime(opEndTime - opStartTime);
      });
      
      tick(100);
      
      // Verify metrics are reasonable
      expect(component.operationTimes.length).toBe(operations.length);
      expect(component.averageOperationTime).toBeGreaterThan(0);
      expect(component.averageOperationTime).toBeLessThan(1000); // Average should be under 1 second
      
      // All individual operations should be reasonable
      component.operationTimes.forEach(time => {
        expect(time).toBeGreaterThan(0);
        expect(time).toBeLessThan(5000); // No single operation should take more than 5 seconds
      });
    }));
  });
});
