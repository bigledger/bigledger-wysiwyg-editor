describe('WYSIWYG Editor - Comprehensive User Workflows', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
    cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'true');
  });

  describe('Complete Document Creation Workflow', () => {
    it('should create a complete document with all formatting options', () => {
      // Start with a title
      cy.get('.wysiwyg-content').click().type('Document Title');
      cy.selectEditorText(0, 14);
      
      // Make title bold and larger
      cy.get('[data-command="bold"]').click();
      cy.get('[data-command="fontSize"]').select('18px');
      cy.get('[data-command="justifyCenter"]').click();
      
      // Add a new paragraph
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}This is the introduction paragraph with ');
      
      // Add italic text
      cy.get('.wysiwyg-content').type('italic emphasis');
      cy.selectEditorText(-14, -1); // Select "italic emphasis"
      cy.get('[data-command="italic"]').click();
      
      // Continue with normal text
      cy.get('.wysiwyg-content').type('{end} and some ');
      
      // Add underlined text
      cy.get('.wysiwyg-content').type('underlined text');
      cy.selectEditorText(-15, -1); // Select "underlined text"
      cy.get('[data-command="underline"]').click();
      
      // Add colored text
      cy.get('.wysiwyg-content').type('{end} with ');
      cy.get('.wysiwyg-content').type('red colored text');
      cy.selectEditorText(-15, -1); // Select "red colored text"
      cy.get('[data-command="foreColor"]').select('#ff0000');
      
      // Add a bullet list
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Key features:');
      cy.get('.wysiwyg-content').type('{enter}');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      // Add list items
      cy.get('.wysiwyg-content').type('Easy to use interface');
      cy.get('.wysiwyg-content').type('{enter}Rich text formatting');
      cy.get('.wysiwyg-content').type('{enter}Cross-browser compatibility');
      
      // Add a numbered list
      cy.get('.wysiwyg-content').type('{enter}{enter}Installation steps:');
      cy.get('.wysiwyg-content').type('{enter}');
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.get('.wysiwyg-content').type('Install the package');
      cy.get('.wysiwyg-content').type('{enter}Import the module');
      cy.get('.wysiwyg-content').type('{enter}Add to your template');
      
      // Add a link
      cy.get('.wysiwyg-content').type('{enter}{enter}For more information, visit ');
      cy.get('.wysiwyg-content').type('our website');
      cy.selectEditorText(-11, -1); // Select "our website"
      
      cy.get('[data-command="createLink"]').click();
      cy.get('[data-testid="link-url-input"]').type('https://example.com');
      cy.get('[data-testid="link-text-input"]').should('have.value', 'our website');
      cy.get('[data-testid="link-create-button"]').click();
      
      // Add an image
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}');
      cy.get('[data-command="insertImage"]').click();
      cy.get('[data-testid="image-url-input"]').type('https://via.placeholder.com/300x200');
      cy.get('[data-testid="image-alt-input"]').type('Placeholder image');
      cy.get('[data-testid="image-insert-button"]').click();
      
      // Verify the complete document structure
      cy.getEditorContent().should('contain', 'Document Title');
      cy.getEditorContent().should('contain', '<strong>Document Title</strong>');
      cy.getEditorContent().should('contain', 'font-size: 18px');
      cy.getEditorContent().should('contain', 'text-align: center');
      cy.getEditorContent().should('contain', '<em>italic emphasis</em>');
      cy.getEditorContent().should('contain', '<u>underlined text</u>');
      cy.getEditorContent().should('contain', 'color: #ff0000');
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('contain', '<a href="https://example.com">our website</a>');
      cy.getEditorContent().should('contain', '<img');
      cy.getEditorContent().should('contain', 'alt="Placeholder image"');
    });
  });

  describe('Complete Editing and Revision Workflow', () => {
    it('should handle complete document editing with undo/redo', () => {
      // Create initial content
      cy.setEditorContent('<p>Original content that will be edited</p>');
      
      // Make first edit - add bold formatting
      cy.selectEditorText(0, 8); // Select "Original"
      cy.get('[data-command="bold"]').click();
      
      // Make second edit - add italic formatting
      cy.selectEditorText(9, 16); // Select "content"
      cy.get('[data-command="italic"]').click();
      
      // Make third edit - add more text
      cy.get('.wysiwyg-content').type('{end} with additional information');
      
      // Make fourth edit - change alignment
      cy.get('[data-command="justifyCenter"]').click();
      
      // Verify all changes are applied
      cy.getEditorContent().should('contain', '<strong>Original</strong>');
      cy.getEditorContent().should('contain', '<em>content</em>');
      cy.getEditorContent().should('contain', 'additional information');
      cy.getEditorContent().should('contain', 'text-align: center');
      
      // Test undo operations
      cy.get('[data-command="undo"]').click();
      cy.getEditorContent().should('not.contain', 'text-align: center');
      
      cy.get('[data-command="undo"]').click();
      cy.getEditorContent().should('not.contain', 'additional information');
      
      cy.get('[data-command="undo"]').click();
      cy.getEditorContent().should('not.contain', '<em>content</em>');
      
      cy.get('[data-command="undo"]').click();
      cy.getEditorContent().should('not.contain', '<strong>Original</strong>');
      cy.getEditorContent().should('contain', 'Original content that will be edited');
      
      // Test redo operations
      cy.get('[data-command="redo"]').click();
      cy.getEditorContent().should('contain', '<strong>Original</strong>');
      
      cy.get('[data-command="redo"]').click();
      cy.getEditorContent().should('contain', '<em>content</em>');
      
      cy.get('[data-command="redo"]').click();
      cy.getEditorContent().should('contain', 'additional information');
      
      cy.get('[data-command="redo"]').click();
      cy.getEditorContent().should('contain', 'text-align: center');
    });
  });

  describe('Complete Copy/Paste Workflow', () => {
    it('should handle complex copy/paste operations with formatting preservation', () => {
      // Create source content with various formatting
      const sourceContent = `
        <p><strong>Bold text</strong> and <em>italic text</em></p>
        <ul>
          <li>First item</li>
          <li>Second item with <a href="https://example.com">link</a></li>
        </ul>
        <p style="color: red;">Red colored text</p>
      `;
      
      cy.setEditorContent(sourceContent);
      
      // Select all content
      cy.get('.wysiwyg-content').type('{ctrl+a}');
      
      // Copy content
      cy.get('.wysiwyg-content').type('{ctrl+c}');
      
      // Clear editor
      cy.get('.wysiwyg-content').clear();
      
      // Paste content
      cy.get('.wysiwyg-content').type('{ctrl+v}');
      
      // Verify formatting is preserved
      cy.getEditorContent().should('contain', '<strong>Bold text</strong>');
      cy.getEditorContent().should('contain', '<em>italic text</em>');
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<li>First item</li>');
      cy.getEditorContent().should('contain', '<a href="https://example.com">link</a>');
      cy.getEditorContent().should('contain', 'color: red');
      
      // Test partial copy/paste
      cy.selectEditorText(0, 20); // Select first part
      cy.get('.wysiwyg-content').type('{ctrl+c}');
      
      // Move to end and paste
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Copied: ');
      cy.get('.wysiwyg-content').type('{ctrl+v}');
      
      // Verify partial content is pasted
      cy.getEditorContent().should('contain', 'Copied:');
    });
  });

  describe('Complete Link Management Workflow', () => {
    it('should handle complete link lifecycle - create, edit, remove', () => {
      // Add initial text
      cy.get('.wysiwyg-content').click().type('Visit our homepage for more information about our services.');
      
      // Create first link
      cy.selectEditorText(10, 18); // Select "homepage"
      cy.get('[data-command="createLink"]').click();
      
      cy.get('[data-testid="link-url-input"]').type('https://homepage.example.com');
      cy.get('[data-testid="link-text-input"]').should('have.value', 'homepage');
      cy.get('[data-testid="link-create-button"]').click();
      
      // Verify link creation
      cy.getEditorContent().should('contain', '<a href="https://homepage.example.com">homepage</a>');
      
      // Create second link with different text
      cy.selectEditorText(50, 58); // Select "services"
      cy.get('[data-command="createLink"]').click();
      
      cy.get('[data-testid="link-url-input"]').type('https://services.example.com');
      cy.get('[data-testid="link-text-input"]').clear().type('our services');
      cy.get('[data-testid="link-create-button"]').click();
      
      // Verify second link
      cy.getEditorContent().should('contain', '<a href="https://services.example.com">our services</a>');
      
      // Edit existing link
      cy.get('.wysiwyg-content a[href="https://homepage.example.com"]').click();
      cy.get('[data-command="createLink"]').click();
      
      cy.get('[data-testid="link-url-input"]').should('have.value', 'https://homepage.example.com');
      cy.get('[data-testid="link-url-input"]').clear().type('https://updated-homepage.example.com');
      cy.get('[data-testid="link-text-input"]').clear().type('updated homepage');
      cy.get('[data-testid="link-update-button"]').click();
      
      // Verify link update
      cy.getEditorContent().should('contain', '<a href="https://updated-homepage.example.com">updated homepage</a>');
      cy.getEditorContent().should('not.contain', 'https://homepage.example.com');
      
      // Remove link
      cy.get('.wysiwyg-content a[href="https://services.example.com"]').click();
      cy.get('[data-command="createLink"]').click();
      cy.get('[data-testid="link-remove-button"]').click();
      
      // Verify link removal
      cy.getEditorContent().should('not.contain', '<a href="https://services.example.com">');
      cy.getEditorContent().should('contain', 'our services'); // Text should remain
    });
  });

  describe('Complete Image Management Workflow', () => {
    it('should handle complete image lifecycle - insert, resize, replace, remove', () => {
      // Insert image by URL
      cy.get('.wysiwyg-content').click().type('Here is an image:{enter}');
      cy.get('[data-command="insertImage"]').click();
      
      cy.get('[data-testid="image-url-input"]').type('https://via.placeholder.com/400x300');
      cy.get('[data-testid="image-alt-input"]').type('Original placeholder image');
      cy.get('[data-testid="image-width-input"]').type('400');
      cy.get('[data-testid="image-height-input"]').type('300');
      cy.get('[data-testid="image-insert-button"]').click();
      
      // Verify image insertion
      cy.get('.wysiwyg-content img').should('exist');
      cy.get('.wysiwyg-content img').should('have.attr', 'src', 'https://via.placeholder.com/400x300');
      cy.get('.wysiwyg-content img').should('have.attr', 'alt', 'Original placeholder image');
      cy.get('.wysiwyg-content img').should('have.attr', 'width', '400');
      cy.get('.wysiwyg-content img').should('have.attr', 'height', '300');
      
      // Edit image properties
      cy.get('.wysiwyg-content img').click();
      cy.get('[data-command="insertImage"]').click();
      
      cy.get('[data-testid="image-url-input"]').should('have.value', 'https://via.placeholder.com/400x300');
      cy.get('[data-testid="image-url-input"]').clear().type('https://via.placeholder.com/600x400');
      cy.get('[data-testid="image-alt-input"]').clear().type('Updated placeholder image');
      cy.get('[data-testid="image-width-input"]').clear().type('600');
      cy.get('[data-testid="image-height-input"]').clear().type('400');
      cy.get('[data-testid="image-update-button"]').click();
      
      // Verify image update
      cy.get('.wysiwyg-content img').should('have.attr', 'src', 'https://via.placeholder.com/600x400');
      cy.get('.wysiwyg-content img').should('have.attr', 'alt', 'Updated placeholder image');
      cy.get('.wysiwyg-content img').should('have.attr', 'width', '600');
      cy.get('.wysiwyg-content img').should('have.attr', 'height', '400');
      
      // Test image file upload
      cy.get('.wysiwyg-content').type('{end}{enter}Second image from file:{enter}');
      cy.get('[data-command="insertImage"]').click();
      
      cy.get('[data-testid="image-file-input"]').selectFile('cypress/fixtures/test-image.jpg');
      cy.get('[data-testid="image-alt-input"]').type('Uploaded test image');
      cy.get('[data-testid="image-insert-button"]').click();
      
      // Verify file upload (assuming it creates a data URL or uploads to server)
      cy.get('.wysiwyg-content img').should('have.length', 2);
      cy.get('.wysiwyg-content img').last().should('have.attr', 'alt', 'Uploaded test image');
      
      // Remove image
      cy.get('.wysiwyg-content img').first().click();
      cy.get('[data-command="insertImage"]').click();
      cy.get('[data-testid="image-remove-button"]').click();
      
      // Verify image removal
      cy.get('.wysiwyg-content img').should('have.length', 1);
      cy.get('.wysiwyg-content img').should('have.attr', 'alt', 'Uploaded test image');
    });
  });

  describe('Complete List Management Workflow', () => {
    it('should handle complex list operations with nesting and conversion', () => {
      // Create bullet list
      cy.get('.wysiwyg-content').click().type('Shopping List:');
      cy.get('.wysiwyg-content').type('{enter}');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      // Add list items
      cy.get('.wysiwyg-content').type('Fruits');
      cy.get('.wysiwyg-content').type('{enter}Vegetables');
      cy.get('.wysiwyg-content').type('{enter}Dairy Products');
      cy.get('.wysiwyg-content').type('{enter}Meat');
      
      // Create nested list under Fruits
      cy.get('.wysiwyg-content').type('{home}'); // Go to beginning of "Fruits" line
      cy.get('.wysiwyg-content').type('{end}{enter}'); // New line after Fruits
      cy.get('.wysiwyg-content').type('{tab}Apples'); // Indent for nested item
      cy.get('.wysiwyg-content').type('{enter}Bananas');
      cy.get('.wysiwyg-content').type('{enter}Oranges');
      
      // Go back to main level
      cy.get('.wysiwyg-content').type('{enter}{shift+tab}Beverages');
      
      // Convert to numbered list
      cy.selectEditorText(0, -1); // Select all
      cy.get('[data-command="insertOrderedList"]').click();
      
      // Verify list structure
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('contain', '<li>Fruits');
      cy.getEditorContent().should('contain', '<li>Vegetables</li>');
      cy.getEditorContent().should('contain', '<li>Dairy Products</li>');
      cy.getEditorContent().should('contain', '<li>Meat</li>');
      cy.getEditorContent().should('contain', '<li>Beverages</li>');
      
      // Test list item manipulation
      cy.get('.wysiwyg-content li').contains('Vegetables').click();
      cy.get('.wysiwyg-content').type('{end}{enter}Grains'); // Add new item after Vegetables
      
      // Remove list formatting
      cy.selectEditorText(0, -1);
      cy.get('[data-command="insertOrderedList"]').click(); // Toggle off
      
      // Verify list removal
      cy.getEditorContent().should('not.contain', '<ol>');
      cy.getEditorContent().should('not.contain', '<ul>');
      cy.getEditorContent().should('contain', 'Fruits');
      cy.getEditorContent().should('contain', 'Vegetables');
    });
  });

  describe('Complete Alignment and Formatting Workflow', () => {
    it('should handle complex text alignment and formatting combinations', () => {
      // Create document with different alignments
      cy.get('.wysiwyg-content').click().type('Centered Title');
      cy.selectEditorText(0, -1);
      cy.get('[data-command="bold"]').click();
      cy.get('[data-command="fontSize"]').select('20px');
      cy.get('[data-command="justifyCenter"]').click();
      
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Left-aligned paragraph with normal text that demonstrates the default alignment behavior.');
      cy.selectEditorText(-1, -1); // Select the paragraph
      cy.get('[data-command="justifyLeft"]').click();
      
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Right-aligned paragraph that shows how text flows to the right side of the editor.');
      cy.selectEditorText(-1, -1);
      cy.get('[data-command="justifyRight"]').click();
      
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Justified paragraph that demonstrates how text is distributed evenly across the full width of the editor, creating clean edges on both sides.');
      cy.selectEditorText(-1, -1);
      cy.get('[data-command="justifyFull"]').click();
      
      // Verify alignments
      cy.getEditorContent().should('contain', 'text-align: center');
      cy.getEditorContent().should('contain', 'text-align: left');
      cy.getEditorContent().should('contain', 'text-align: right');
      cy.getEditorContent().should('contain', 'text-align: justify');
      
      // Test mixed formatting within aligned text
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Mixed formatting: ');
      cy.get('.wysiwyg-content').type('bold');
      cy.selectEditorText(-4, -1);
      cy.get('[data-command="bold"]').click();
      
      cy.get('.wysiwyg-content').type('{end}, ');
      cy.get('.wysiwyg-content').type('italic');
      cy.selectEditorText(-6, -1);
      cy.get('[data-command="italic"]').click();
      
      cy.get('.wysiwyg-content').type('{end}, and ');
      cy.get('.wysiwyg-content').type('colored');
      cy.selectEditorText(-7, -1);
      cy.get('[data-command="foreColor"]').select('#0000ff');
      
      // Apply center alignment to mixed formatting
      cy.selectEditorText(-50, -1); // Select the mixed formatting line
      cy.get('[data-command="justifyCenter"]').click();
      
      // Verify mixed formatting with alignment
      cy.getEditorContent().should('contain', '<strong>bold</strong>');
      cy.getEditorContent().should('contain', '<em>italic</em>');
      cy.getEditorContent().should('contain', 'color: #0000ff');
    });
  });

  describe('Complete Keyboard Navigation Workflow', () => {
    it('should handle complete keyboard navigation and shortcuts', () => {
      // Test basic navigation
      cy.get('.wysiwyg-content').click().type('First line{enter}Second line{enter}Third line');
      
      // Test Home/End keys
      cy.get('.wysiwyg-content').type('{home}START: ');
      cy.getEditorContent().should('contain', 'START: Third line');
      
      cy.get('.wysiwyg-content').type('{end} :END');
      cy.getEditorContent().should('contain', 'START: Third line :END');
      
      // Test arrow key navigation
      cy.get('.wysiwyg-content').type('{leftarrow}{leftarrow}{leftarrow}{leftarrow}MID');
      cy.getEditorContent().should('contain', 'START: Third line MID:END');
      
      // Test Ctrl+Arrow for word navigation
      cy.get('.wysiwyg-content').type('{ctrl+leftarrow}{ctrl+leftarrow}WORD ');
      cy.getEditorContent().should('contain', 'START: Third WORD line MID:END');
      
      // Test Page Up/Down (if content is long enough)
      cy.get('.wysiwyg-content').type('{ctrl+home}'); // Go to very beginning
      cy.get('.wysiwyg-content').type('BEGINNING: ');
      cy.getEditorContent().should('contain', 'BEGINNING: First line');
      
      // Test selection with Shift+Arrow
      cy.get('.wysiwyg-content').type('{shift+rightarrow}{shift+rightarrow}{shift+rightarrow}');
      cy.get('[data-command="bold"]').click();
      cy.getEditorContent().should('contain', '<strong>BEG</strong>');
      
      // Test Ctrl+A (select all)
      cy.get('.wysiwyg-content').type('{ctrl+a}');
      cy.get('[data-command="italic"]').click();
      
      // Test keyboard shortcuts
      cy.get('.wysiwyg-content').click().clear().type('Keyboard shortcut test');
      cy.selectEditorText(0, 8); // Select "Keyboard"
      
      // Test Ctrl+B for bold
      cy.get('.wysiwyg-content').type('{ctrl+b}');
      cy.getEditorContent().should('contain', '<strong>Keyboard</strong>');
      
      // Test Ctrl+I for italic
      cy.selectEditorText(9, 17); // Select "shortcut"
      cy.get('.wysiwyg-content').type('{ctrl+i}');
      cy.getEditorContent().should('contain', '<em>shortcut</em>');
      
      // Test Ctrl+U for underline
      cy.selectEditorText(18, 22); // Select "test"
      cy.get('.wysiwyg-content').type('{ctrl+u}');
      cy.getEditorContent().should('contain', '<u>test</u>');
      
      // Test Ctrl+K for link
      cy.selectEditorText(0, 8); // Select "Keyboard" again
      cy.get('.wysiwyg-content').type('{ctrl+k}');
      cy.get('[data-testid="link-dialog"]').should('be.visible');
      cy.get('[data-testid="link-url-input"]').type('https://keyboard.example.com');
      cy.get('[data-testid="link-create-button"]').click();
      
      // Test Ctrl+Z for undo
      cy.get('.wysiwyg-content').type('{ctrl+z}');
      cy.getEditorContent().should('not.contain', '<a href="https://keyboard.example.com">');
      
      // Test Ctrl+Y for redo
      cy.get('.wysiwyg-content').type('{ctrl+y}');
      cy.getEditorContent().should('contain', '<a href="https://keyboard.example.com">');
    });
  });

  describe('Complete Form Integration Workflow', () => {
    it('should handle complete form integration with validation and state management', () => {
      // Test initial form state
      cy.get('[data-testid="form-status"]').should('contain', 'Valid: false');
      cy.get('[data-testid="form-status"]').should('contain', 'Dirty: false');
      cy.get('[data-testid="form-status"]').should('contain', 'Touched: false');
      
      // Add content to make form valid
      cy.get('.wysiwyg-content').click().type('This is enough content to make the form valid according to the minimum length requirement.');
      
      // Check form state changes
      cy.get('[data-testid="form-status"]').should('contain', 'Valid: true');
      cy.get('[data-testid="form-status"]').should('contain', 'Dirty: true');
      
      // Test form submission
      cy.get('[data-testid="submit-button"]').should('not.be.disabled');
      cy.get('[data-testid="submit-button"]').click();
      
      // Verify form submission
      cy.get('[data-testid="submission-result"]').should('contain', 'Form submitted successfully');
      cy.get('[data-testid="submitted-content"]').should('contain', 'This is enough content');
      
      // Test form reset
      cy.get('[data-testid="reset-button"]').click();
      cy.get('.wysiwyg-content').should('be.empty');
      cy.get('[data-testid="form-status"]').should('contain', 'Valid: false');
      cy.get('[data-testid="form-status"]').should('contain', 'Dirty: false');
      
      // Test validation errors
      cy.get('.wysiwyg-content').click().type('Short');
      cy.get('[data-testid="form-status"]').should('contain', 'Valid: false');
      cy.get('[data-testid="validation-errors"]').should('contain', 'Minimum length required');
      
      // Test disabled state
      cy.get('[data-testid="disable-button"]').click();
      cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'false');
      cy.get('.wysiwyg-toolbar button').should('be.disabled');
      
      // Re-enable
      cy.get('[data-testid="enable-button"]').click();
      cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'true');
      cy.get('.wysiwyg-toolbar button').should('not.be.disabled');
    });
  });

  describe('Complete Error Handling and Recovery Workflow', () => {
    it('should handle errors gracefully and provide recovery options', () => {
      // Test with malicious content
      const maliciousContent = '<script>alert("xss")</script><img src="x" onerror="alert(\'xss\')">';
      cy.get('.wysiwyg-content').invoke('html', maliciousContent);
      cy.get('.wysiwyg-content').trigger('input');
      
      // Content should be sanitized
      cy.getEditorContent().should('not.contain', '<script>');
      cy.getEditorContent().should('not.contain', 'onerror');
      
      // Test network error simulation (for image loading)
      cy.get('[data-command="insertImage"]').click();
      cy.get('[data-testid="image-url-input"]').type('https://invalid-domain-that-does-not-exist.com/image.jpg');
      cy.get('[data-testid="image-insert-button"]').click();
      
      // Should handle gracefully
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load image');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Test recovery
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="image-url-input"]').clear().type('https://via.placeholder.com/300x200');
      cy.get('[data-testid="image-insert-button"]').click();
      
      // Should work after retry
      cy.get('.wysiwyg-content img').should('exist');
      
      // Test browser compatibility fallbacks
      cy.window().then(win => {
        // Temporarily disable execCommand to test fallbacks
        const originalExecCommand = win.document.execCommand;
        win.document.execCommand = () => false;
        
        cy.get('.wysiwyg-content').click().type('Fallback test');
        cy.selectEditorText(0, 8);
        cy.get('[data-command="bold"]').click();
        
        // Should still work with fallback
        cy.getEditorContent().should('contain', 'Fallback test');
        
        // Restore original function
        win.document.execCommand = originalExecCommand;
      });
    });
  });

  describe('Complete Performance and Stress Testing', () => {
    it('should handle large documents and rapid operations efficiently', () => {
      // Create large document
      const largeContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000);
      cy.setEditorContent(`<p>${largeContent}</p>`);
      
      // Measure performance of operations on large document
      const startTime = Date.now();
      
      // Perform various operations
      cy.selectEditorText(0, 100);
      cy.get('[data-command="bold"]').click();
      
      cy.selectEditorText(200, 300);
      cy.get('[data-command="italic"]').click();
      
      cy.selectEditorText(500, 600);
      cy.get('[data-command="underline"]').click();
      
      cy.get('[data-command="justifyCenter"]').click();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).to.be.lessThan(5000);
      
      // Test rapid typing
      cy.get('.wysiwyg-content').click().clear();
      const rapidText = 'Rapid typing test '.repeat(100);
      cy.get('.wysiwyg-content').type(rapidText, { delay: 0 });
      
      cy.getEditorContent().should('contain', 'Rapid typing test');
      
      // Test memory usage (basic check)
      cy.window().then(win => {
        if (win.performance && (win.performance as any).memory) {
          const memoryInfo = (win.performance as any).memory;
          expect(memoryInfo.usedJSHeapSize).to.be.lessThan(100 * 1024 * 1024); // Less than 100MB
        }
      });
    });
  });

  describe('Complete Accessibility Workflow', () => {
    it('should provide complete accessibility support', () => {
      // Test keyboard navigation
      cy.get('.wysiwyg-toolbar button').first().focus();
      
      // Navigate through toolbar with Tab
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-command');
      
      // Test Space/Enter activation
      cy.focused().type(' '); // Space should activate button
      
      // Test Arrow key navigation in toolbar
      cy.get('.wysiwyg-toolbar').type('{rightarrow}');
      cy.focused().should('have.attr', 'data-command');
      
      // Test screen reader support
      cy.get('.wysiwyg-content').should('have.attr', 'role', 'textbox');
      cy.get('.wysiwyg-content').should('have.attr', 'aria-label');
      
      // Test toolbar button accessibility
      cy.get('.wysiwyg-toolbar button').each($button => {
        cy.wrap($button).should('have.attr', 'aria-label');
        cy.wrap($button).should('have.attr', 'title');
      });
      
      // Test high contrast mode support
      cy.get('body').invoke('addClass', 'high-contrast');
      cy.get('.wysiwyg-editor').should('be.visible');
      cy.get('.wysiwyg-toolbar button').should('be.visible');
      
      // Test reduced motion support
      cy.get('body').invoke('addClass', 'reduce-motion');
      cy.get('[data-command="bold"]').click();
      // Animations should be reduced or disabled
      
      // Test focus management
      cy.get('.wysiwyg-content').click();
      cy.focused().should('have.class', 'wysiwyg-content');
      
      cy.get('[data-command="createLink"]').click();
      cy.focused().should('have.attr', 'data-testid', 'link-url-input');
      
      // Test escape key to close dialogs
      cy.focused().type('{esc}');
      cy.get('[data-testid="link-dialog"]').should('not.be.visible');
      cy.focused().should('have.class', 'wysiwyg-content');
    });
  });
});