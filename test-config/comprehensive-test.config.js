/**
 * Comprehensive Test Configuration for WYSIWYG Editor
 * 
 * This configuration ensures all integration tests cover the complete
 * functionality as specified in the requirements document.
 */

const testConfig = {
  // Test coverage requirements
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  
  // Test categories and their requirements mapping
  testCategories: {
    unit: {
      description: 'Unit tests for individual components and services',
      requirements: ['All requirements'],
      files: [
        'src/lib/**/*.spec.ts'
      ],
      excludeFiles: [
        'src/lib/tests/integration/**/*.spec.ts',
        'src/lib/tests/performance/**/*.spec.ts'
      ]
    },
    
    integration: {
      description: 'Integration tests for complete workflows',
      requirements: ['1.1', '1.2', '1.3', '1.4', '6.1', '6.2', '6.3', '6.4'],
      files: [
        'src/lib/tests/integration/complete-editor-workflows.integration.spec.ts',
        'src/lib/tests/integration/comprehensive-workflows.integration.spec.ts',
        'src/lib/tests/integration/forms-integration.spec.ts',
        'src/lib/tests/integration/link-image-workflows.integration.spec.ts',
        'src/lib/tests/integration/command-history.integration.spec.ts',
        'src/lib/tests/integration/error-handling.integration.spec.ts',
        'src/lib/tests/integration/accessibility-compliance.spec.ts',
        'src/lib/tests/integration/cross-browser-compatibility.spec.ts'
      ]
    },
    
    performance: {
      description: 'Performance tests for large documents and complex operations',
      requirements: ['1.1', '1.4'],
      files: [
        'src/lib/tests/performance/large-document.performance.spec.ts',
        'src/lib/tests/performance/comprehensive-performance.spec.ts',
        'src/lib/tests/performance/performance.spec.ts'
      ]
    },
    
    e2e: {
      description: 'End-to-end tests for complete user workflows',
      requirements: ['All requirements'],
      files: [
        'cypress/e2e/editor-basic-functionality.cy.ts',
        'cypress/e2e/text-formatting.cy.ts',
        'cypress/e2e/links-and-images.cy.ts',
        'cypress/e2e/lists-and-alignment.cy.ts',
        'cypress/e2e/accessibility.cy.ts',
        'cypress/e2e/comprehensive-user-workflows.cy.ts',
        'cypress/e2e/comprehensive-cross-browser.cy.ts'
      ]
    }
  },
  
  // Requirements coverage mapping
  requirementsCoverage: {
    '1.1': {
      description: 'Angular component installation and usage',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'editor-basic-functionality.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '1.2': {
      description: 'Functional text editor rendering',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'editor-basic-functionality.cy.ts',
        'text-formatting.cy.ts'
      ]
    },
    
    '1.3': {
      description: 'Editor configuration via input properties',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '1.4': {
      description: 'Content change event emission',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'forms-integration.spec.ts'
      ]
    },
    
    '2.1': {
      description: 'Bold text formatting',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '2.2': {
      description: 'Italic text formatting',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '2.3': {
      description: 'Underline text formatting',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '2.4': {
      description: 'Font size selection',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts'
      ]
    },
    
    '2.5': {
      description: 'Font color selection',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts'
      ]
    },
    
    '2.6': {
      description: 'Background color selection',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'text-formatting.cy.ts'
      ]
    },
    
    '3.1': {
      description: 'Bullet list creation',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '3.2': {
      description: 'Numbered list creation',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '3.3': {
      description: 'Text alignment options',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '3.4': {
      description: 'Enter key creates new list item',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '3.5': {
      description: 'Tab key indents list item',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '3.6': {
      description: 'Shift+Tab outdents list item',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'lists-and-alignment.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '4.1': {
      description: 'Link creation dialog',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '4.2': {
      description: 'Hyperlink creation',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '4.3': {
      description: 'Link editing and removal',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '4.4': {
      description: 'URL format validation',
      testFiles: [
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts'
      ]
    },
    
    '5.1': {
      description: 'Image upload and URL options',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '5.2': {
      description: 'Image insertion at cursor',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '5.3': {
      description: 'Image resize and removal',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '5.4': {
      description: 'Common image format support',
      testFiles: [
        'link-image-workflows.integration.spec.ts',
        'links-and-images.cy.ts'
      ]
    },
    
    '6.1': {
      description: 'ngModel two-way data binding',
      testFiles: [
        'forms-integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '6.2': {
      description: 'Reactive forms FormControl support',
      testFiles: [
        'forms-integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '6.3': {
      description: 'Content change updates model',
      testFiles: [
        'forms-integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '6.4': {
      description: 'Programmatic model updates editor',
      testFiles: [
        'forms-integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '7.1': {
      description: 'Toolbar configuration',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '7.2': {
      description: 'Editor height specification',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '7.3': {
      description: 'Placeholder text display',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'editor-basic-functionality.cy.ts'
      ]
    },
    
    '7.4': {
      description: 'Read-only mode',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'editor-basic-functionality.cy.ts'
      ]
    },
    
    '8.1': {
      description: 'Ctrl+B bold shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '8.2': {
      description: 'Ctrl+I italic shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '8.3': {
      description: 'Ctrl+U underline shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '8.4': {
      description: 'Ctrl+Z undo shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'command-history.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '8.5': {
      description: 'Ctrl+Y redo shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'command-history.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '8.6': {
      description: 'Ctrl+K link shortcut',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'comprehensive-user-workflows.cy.ts'
      ]
    },
    
    '9.1': {
      description: 'Valid HTML markup generation',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'error-handling.integration.spec.ts'
      ]
    },
    
    '9.2': {
      description: 'Semantic HTML tag usage',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts'
      ]
    },
    
    '9.3': {
      description: 'Sanitized HTML output',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'error-handling.integration.spec.ts'
      ]
    },
    
    '9.4': {
      description: 'Malicious content filtering',
      testFiles: [
        'complete-editor-workflows.integration.spec.ts',
        'comprehensive-workflows.integration.spec.ts',
        'error-handling.integration.spec.ts'
      ]
    }
  },
  
  // Performance benchmarks
  performanceBenchmarks: {
    largeDocumentLoad: {
      description: 'Load document with 1000+ paragraphs',
      maxTime: 2000, // 2 seconds
      testFiles: ['large-document.performance.spec.ts', 'comprehensive-performance.spec.ts']
    },
    
    rapidOperations: {
      description: 'Handle 100+ rapid formatting operations',
      maxTime: 1000, // 1 second
      testFiles: ['comprehensive-performance.spec.ts']
    },
    
    memoryUsage: {
      description: 'Memory usage under 100MB after operations',
      maxMemory: 100 * 1024 * 1024, // 100MB
      testFiles: ['comprehensive-performance.spec.ts']
    },
    
    renderingPerformance: {
      description: 'Smooth rendering with complex content',
      maxTime: 3000, // 3 seconds
      testFiles: ['comprehensive-performance.spec.ts']
    }
  },
  
  // Cross-browser compatibility requirements
  browserSupport: {
    chrome: { minVersion: 90, required: true },
    firefox: { minVersion: 88, required: true },
    safari: { minVersion: 14, required: true },
    edge: { minVersion: 90, required: true }
  },
  
  // Accessibility requirements
  accessibilityStandards: {
    wcag: '2.1 AA',
    keyboardNavigation: true,
    screenReaderSupport: true,
    highContrastMode: true,
    focusManagement: true
  },
  
  // Test execution configuration
  execution: {
    timeout: 30000, // 30 seconds per test
    retries: 2,
    parallel: false, // Run sequentially for stability
    headless: true,
    screenshots: true,
    videos: false
  }
};

module.exports = testConfig;