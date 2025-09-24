describe('WYSIWYG Editor - Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Editor Initialization', () => {
    it('should render the editor with toolbar and content area', () => {
      cy.get('.wysiwyg-toolbar').should('be.visible');
      cy.get('.wysiwyg-content').should('be.visible');
      cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'true');
    });

    it('should show placeholder text when empty', () => {
      cy.get('.wysiwyg-content').should('have.attr', 'data-placeholder');
      cy.get('.wysiwyg-content').should('be.empty');
    });

    it('should focus on content area when clicked', () => {
      cy.get('.wysiwyg-content').click();
      cy.get('.wysiwyg-content').should('be.focused');
    });
  });

  describe('Text Input and Editing', () => {
    it('should allow typing text', () => {
      cy.get('.wysiwyg-content').click().type('Hello World!');
      cy.getEditorContent().should('contain', 'Hello World!');
    });

    it('should handle multiline text', () => {
      cy.get('.wysiwyg-content')
        .click()
        .type('First line{enter}Second line{enter}Third line');
      
      cy.getEditorContent().should('contain', 'First line');
      cy.getEditorContent().should('contain', 'Second line');
      cy.getEditorContent().should('contain', 'Third line');
    });

    it('should handle special characters', () => {
      const specialText = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      cy.get('.wysiwyg-content').click().type(specialText);
      cy.getEditorContent().should('contain', specialText);
    });

    it('should handle backspace and delete', () => {
      cy.get('.wysiwyg-content').click().type('Hello World');
      
      // Test backspace
      cy.get('.wysiwyg-content').type('{backspace}{backspace}{backspace}{backspace}{backspace}');
      cy.getEditorContent().should('contain', 'Hello');
      cy.getEditorContent().should('not.contain', 'World');
      
      // Test delete
      cy.get('.wysiwyg-content').type('{leftarrow}{leftarrow}{del}');
      cy.getEditorContent().should('contain', 'Helo');
    });
  });

  describe('Text Selection', () => {
    beforeEach(() => {
      cy.setEditorContent('The quick brown fox jumps over the lazy dog');
    });

    it('should select text with mouse drag', () => {
      cy.get('.wysiwyg-content')
        .trigger('mousedown', { which: 1, clientX: 50, clientY: 20 })
        .trigger('mousemove', { which: 1, clientX: 150, clientY: 20 })
        .trigger('mouseup');
      
      cy.window().then((win) => {
        const selection = win.getSelection();
        expect(selection?.toString()).to.not.be.empty;
      });
    });

    it('should select all text with Ctrl+A', () => {
      cy.get('.wysiwyg-content').click().type('{ctrl+a}');
      
      cy.window().then((win) => {
        const selection = win.getSelection();
        expect(selection?.toString()).to.contain('The quick brown fox');
      });
    });

    it('should handle double-click to select word', () => {
      cy.get('.wysiwyg-content').dblclick();
      
      cy.window().then((win) => {
        const selection = win.getSelection();
        expect(selection?.toString().length).to.be.greaterThan(0);
      });
    });
  });

  describe('Copy, Cut, and Paste', () => {
    beforeEach(() => {
      cy.setEditorContent('Sample text for copy paste operations');
    });

    it('should copy and paste text', () => {
      // Select some text
      cy.selectEditorText(0, 6); // Select "Sample"
      
      // Copy
      cy.get('.wysiwyg-content').type('{ctrl+c}');
      
      // Move cursor to end and paste
      cy.get('.wysiwyg-content').type('{end} - ');
      cy.get('.wysiwyg-content').type('{ctrl+v}');
      
      cy.getEditorContent().should('contain', 'Sample text for copy paste operations - Sample');
    });

    it('should cut and paste text', () => {
      // Select some text
      cy.selectEditorText(0, 7); // Select "Sample "
      
      // Cut
      cy.get('.wysiwyg-content').type('{ctrl+x}');
      
      // Verify text was removed
      cy.getEditorContent().should('not.contain', 'Sample ');
      cy.getEditorContent().should('contain', 'text for copy paste operations');
      
      // Move cursor to end and paste
      cy.get('.wysiwyg-content').type('{end} - ');
      cy.get('.wysiwyg-content').type('{ctrl+v}');
      
      cy.getEditorContent().should('contain', 'text for copy paste operations - Sample ');
    });

    it('should handle paste from external source', () => {
      const clipboardText = 'Pasted from external source';
      
      cy.get('.wysiwyg-content').click().then(() => {
        // Simulate paste event
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: new DataTransfer()
        });
        pasteEvent.clipboardData?.setData('text/plain', clipboardText);
        
        cy.get('.wysiwyg-content').then(($editor) => {
          $editor[0].dispatchEvent(pasteEvent);
        });
      });
      
      cy.getEditorContent().should('contain', clipboardText);
    });
  });

  describe('Undo and Redo', () => {
    it('should undo text input with Ctrl+Z', () => {
      cy.get('.wysiwyg-content').click().type('First text');
      cy.getEditorContent().should('contain', 'First text');
      
      cy.get('.wysiwyg-content').type('{ctrl+z}');
      cy.getEditorContent().should('not.contain', 'First text');
    });

    it('should redo text input with Ctrl+Y', () => {
      cy.get('.wysiwyg-content').click().type('Undo redo test');
      cy.get('.wysiwyg-content').type('{ctrl+z}'); // Undo
      cy.get('.wysiwyg-content').type('{ctrl+y}'); // Redo
      
      cy.getEditorContent().should('contain', 'Undo redo test');
    });

    it('should handle multiple undo/redo operations', () => {
      cy.get('.wysiwyg-content').click().type('Step 1');
      cy.get('.wysiwyg-content').type('{enter}Step 2');
      cy.get('.wysiwyg-content').type('{enter}Step 3');
      
      // Undo twice
      cy.get('.wysiwyg-content').type('{ctrl+z}{ctrl+z}');
      cy.getEditorContent().should('contain', 'Step 1');
      cy.getEditorContent().should('not.contain', 'Step 2');
      cy.getEditorContent().should('not.contain', 'Step 3');
      
      // Redo once
      cy.get('.wysiwyg-content').type('{ctrl+y}');
      cy.getEditorContent().should('contain', 'Step 2');
      cy.getEditorContent().should('not.contain', 'Step 3');
    });
  });

  describe('Content Persistence', () => {
    it('should maintain content when editor loses and regains focus', () => {
      const testContent = 'Content persistence test';
      cy.get('.wysiwyg-content').click().type(testContent);
      
      // Click outside editor
      cy.get('body').click();
      
      // Click back on editor
      cy.get('.wysiwyg-content').click();
      
      cy.getEditorContent().should('contain', testContent);
    });

    it('should preserve cursor position after focus loss', () => {
      cy.get('.wysiwyg-content').click().type('Hello World');
      
      // Position cursor in middle
      cy.get('.wysiwyg-content').type('{leftarrow}{leftarrow}{leftarrow}');
      
      // Lose focus and regain
      cy.get('body').click();
      cy.get('.wysiwyg-content').click();
      
      // Type to verify cursor position
      cy.get('.wysiwyg-content').type('XXX');
      cy.getEditorContent().should('contain', 'Hello WoXXXrld');
    });
  });

  describe('Readonly Mode', () => {
    it('should disable editing in readonly mode', () => {
      // Assuming there's a way to toggle readonly mode
      cy.get('[data-testid="readonly-toggle"]').click();
      
      cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'false');
      cy.get('.wysiwyg-content').click().type('Should not appear');
      
      cy.getEditorContent().should('not.contain', 'Should not appear');
    });

    it('should disable toolbar buttons in readonly mode', () => {
      cy.get('[data-testid="readonly-toggle"]').click();
      
      cy.get('.wysiwyg-toolbar button').should('be.disabled');
    });
  });
});