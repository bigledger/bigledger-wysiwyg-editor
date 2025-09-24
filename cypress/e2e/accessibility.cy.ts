describe('WYSIWYG Editor - Accessibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
    cy.injectAxe();
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through toolbar', () => {
      // Tab through toolbar buttons
      cy.get('body').tab();
      cy.get('.wysiwyg-toolbar button:first').should('be.focused');
      
      cy.get('body').tab();
      cy.get('.wysiwyg-toolbar button:nth-child(2)').should('be.focused');
      
      cy.get('body').tab();
      cy.get('.wysiwyg-toolbar button:nth-child(3)').should('be.focused');
    });

    it('should allow keyboard access to editor content', () => {
      // Tab to content area
      cy.get('body').tab({ shift: true }); // Go backwards to content
      cy.get('.wysiwyg-content').should('be.focused');
      
      // Should be able to type
      cy.get('.wysiwyg-content').type('Keyboard accessible content');
      cy.getEditorContent().should('contain', 'Keyboard accessible content');
    });

    it('should support keyboard shortcuts for formatting', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard shortcuts test');
      cy.selectEditorText(0, 8); // Select "Keyboard"
      
      // Test Ctrl+B for bold
      cy.get('.wysiwyg-content').type('{ctrl+b}');
      cy.getEditorContent().should('contain', '<strong>Keyboard</strong>');
      
      // Test Ctrl+I for italic
      cy.selectEditorText(9, 18); // Select "shortcuts"
      cy.get('.wysiwyg-content').type('{ctrl+i}');
      cy.getEditorContent().should('contain', '<em>shortcuts</em>');
      
      // Test Ctrl+U for underline
      cy.selectEditorText(19, 23); // Select "test"
      cy.get('.wysiwyg-content').type('{ctrl+u}');
      cy.getEditorContent().should('contain', '<u>test</u>');
    });

    it('should support Escape key to close dialogs', () => {
      cy.get('.wysiwyg-content').click().type('Link test');
      cy.selectEditorText(0, 4);
      
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog').should('be.visible');
      
      // Press Escape to close
      cy.get('.link-dialog').type('{esc}');
      cy.get('.link-dialog').should('not.exist');
    });

    it('should support Enter key to activate toolbar buttons', () => {
      cy.get('.wysiwyg-content').click().type('Enter key test');
      cy.selectEditorText(0, 5); // Select "Enter"
      
      // Tab to bold button and press Enter
      cy.get('[data-command="bold"]').focus();
      cy.get('[data-command="bold"]').type('{enter}');
      
      cy.getEditorContent().should('contain', '<strong>Enter</strong>');
    });

    it('should support arrow key navigation in lists', () => {
      cy.get('.wysiwyg-content').click().type('Item 1');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}Item 2{enter}Item 3');
      
      // Navigate up with arrow key
      cy.get('.wysiwyg-content').type('{uparrow}');
      cy.get('.wysiwyg-content').type(' - modified');
      
      cy.getEditorContent().should('contain', 'Item 2 - modified');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on toolbar buttons', () => {
      cy.get('[data-command="bold"]').should('have.attr', 'aria-label', 'Bold');
      cy.get('[data-command="italic"]').should('have.attr', 'aria-label', 'Italic');
      cy.get('[data-command="underline"]').should('have.attr', 'aria-label', 'Underline');
      cy.get('[data-command="createLink"]').should('have.attr', 'aria-label', 'Insert Link');
      cy.get('[data-command="insertImage"]').should('have.attr', 'aria-label', 'Insert Image');
    });

    it('should have proper ARIA roles', () => {
      cy.get('.wysiwyg-toolbar').should('have.attr', 'role', 'toolbar');
      cy.get('.wysiwyg-content').should('have.attr', 'role', 'textbox');
      cy.get('.wysiwyg-content').should('have.attr', 'aria-multiline', 'true');
    });

    it('should announce formatting changes', () => {
      cy.get('.wysiwyg-content').click().type('Screen reader test');
      cy.selectEditorText(0, 6); // Select "Screen"
      
      cy.get('[data-command="bold"]').click();
      
      // Should have aria-live region for announcements
      cy.get('[aria-live="polite"]').should('contain', 'Bold applied');
    });

    it('should provide accessible names for form controls', () => {
      cy.get('.wysiwyg-content').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
      
      // Check if there's a label or aria-label
      cy.get('.wysiwyg-content').then($content => {
        const hasLabel = $content.attr('aria-label') || $content.attr('aria-labelledby');
        expect(hasLabel).to.exist;
      });
    });

    it('should announce list creation', () => {
      cy.get('.wysiwyg-content').click().type('List item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('[aria-live="polite"]').should('contain', 'Bullet list created');
    });

    it('should provide context for nested lists', () => {
      cy.get('.wysiwyg-content').click().type('Parent item');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}Child item{tab}');
      
      // Nested list items should have proper aria-level
      cy.get('.wysiwyg-content ul ul li').should('have.attr', 'aria-level', '2');
    });
  });

  describe('Focus Management', () => {
    it('should maintain logical focus order', () => {
      // Focus should move from toolbar to content area
      cy.get('[data-command="bold"]').focus();
      cy.get('body').tab();
      cy.get('[data-command="italic"]').should('be.focused');
      
      // Continue tabbing through toolbar
      cy.get('body').tab();
      cy.get('[data-command="underline"]').should('be.focused');
    });

    it('should restore focus after dialog closes', () => {
      cy.get('.wysiwyg-content').click().type('Focus test');
      cy.selectEditorText(0, 5);
      
      // Open link dialog
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog').should('be.visible');
      
      // Close dialog
      cy.get('.link-dialog button[data-action="cancel"]').click();
      
      // Focus should return to editor
      cy.get('.wysiwyg-content').should('be.focused');
    });

    it('should trap focus within dialogs', () => {
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog').should('be.visible');
      
      // Tab through dialog elements
      cy.get('.link-dialog input[name="url"]').should('be.focused');
      cy.get('body').tab();
      cy.get('.link-dialog input[name="text"]').should('be.focused');
      cy.get('body').tab();
      cy.get('.link-dialog button[type="submit"]').should('be.focused');
      
      // Tab should cycle back to first element
      cy.get('body').tab();
      cy.get('.link-dialog input[name="url"]').should('be.focused');
    });

    it('should handle focus for dynamically added content', () => {
      cy.get('.wysiwyg-content').click().type('Dynamic content');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}New item');
      
      // Focus should remain in the new list item
      cy.get('.wysiwyg-content li:last-child').should('contain.text', 'New item');
      cy.focused().should('be.within', '.wysiwyg-content');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for text', () => {
      cy.checkA11y('.wysiwyg-content', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('should have sufficient contrast for toolbar buttons', () => {
      cy.checkA11y('.wysiwyg-toolbar', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('should show focus indicators', () => {
      cy.get('[data-command="bold"]').focus();
      cy.get('[data-command="bold"]').should('have.css', 'outline').and('not.equal', 'none');
    });

    it('should support high contrast mode', () => {
      // Simulate high contrast mode
      cy.get('body').invoke('addClass', 'high-contrast');
      
      // Check that elements are still visible and accessible
      cy.get('.wysiwyg-toolbar button').should('be.visible');
      cy.get('.wysiwyg-content').should('be.visible');
      
      cy.checkA11y();
    });

    it('should respect reduced motion preferences', () => {
      // Simulate reduced motion preference
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
            dispatchEvent: cy.stub(),
          }),
        });
      });
      
      // Animations should be disabled or reduced
      cy.get('.wysiwyg-toolbar button').should('have.css', 'transition-duration', '0s');
    });
  });

  describe('Error Handling and User Feedback', () => {
    it('should provide accessible error messages', () => {
      cy.get('[data-command="createLink"]').click();
      
      // Try to submit without URL
      cy.get('.link-dialog button[type="submit"]').click();
      
      // Error message should be associated with input
      cy.get('.link-dialog input[name="url"]').should('have.attr', 'aria-describedby');
      cy.get('.link-dialog .error-message').should('be.visible');
      cy.get('.link-dialog .error-message').should('have.attr', 'role', 'alert');
    });

    it('should announce successful operations', () => {
      cy.get('.wysiwyg-content').click().type('Success test');
      cy.selectEditorText(0, 7);
      
      cy.get('[data-command="bold"]').click();
      
      cy.get('[aria-live="polite"]').should('contain', 'Bold applied');
    });

    it('should provide context for complex operations', () => {
      cy.get('.wysiwyg-content').click().type('Complex operation');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}Second item{tab}');
      
      // Should announce nesting level change
      cy.get('[aria-live="polite"]').should('contain', 'List item indented');
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should have appropriate touch targets', () => {
      cy.viewport('iphone-x');
      
      // Toolbar buttons should be large enough for touch
      cy.get('.wysiwyg-toolbar button').each($btn => {
        cy.wrap($btn).should('have.css', 'min-height', '44px');
        cy.wrap($btn).should('have.css', 'min-width', '44px');
      });
    });

    it('should support touch gestures', () => {
      cy.viewport('iphone-x');
      
      cy.get('.wysiwyg-content').click().type('Touch test content');
      
      // Double tap to select word
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 50, clientY: 20 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      cy.wait(100);
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 50, clientY: 20 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      
      // Should select word
      cy.window().then(win => {
        const selection = win.getSelection();
        expect(selection?.toString().length).to.be.greaterThan(0);
      });
    });

    it('should adapt toolbar for mobile', () => {
      cy.viewport('iphone-x');
      
      // Toolbar should be responsive
      cy.get('.wysiwyg-toolbar').should('have.class', 'mobile-layout');
      
      // Some buttons might be in overflow menu
      cy.get('.toolbar-overflow-menu').should('be.visible');
    });
  });

  describe('Comprehensive Accessibility Audit', () => {
    it('should pass automated accessibility tests', () => {
      // Run comprehensive accessibility check
      cy.checkA11y(undefined, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true },
          'semantic-markup': { enabled: true }
        }
      });
    });

    it('should maintain accessibility with dynamic content', () => {
      // Add various content types
      cy.get('.wysiwyg-content').click().type('Accessibility test with ');
      
      // Add formatted text
      cy.get('.wysiwyg-content').type('bold text');
      cy.selectEditorText(-9, -1);
      cy.get('[data-command="bold"]').click();
      
      // Add list
      cy.get('.wysiwyg-content').type('{end}{enter}List item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      // Add link
      cy.get('.wysiwyg-content').type('{end}{enter}{enter}Check this link');
      cy.selectEditorText(-15, -1);
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog input[name="url"]').type('https://example.com');
      cy.get('.link-dialog button[type="submit"]').click();
      
      // Run accessibility check on complex content
      cy.checkA11y();
    });

    it('should handle accessibility in error states', () => {
      // Trigger error state
      cy.get('[data-command="insertImage"]').click();
      cy.get('.image-dialog input[type="file"]').selectFile({
        contents: 'invalid content',
        fileName: 'invalid.txt',
        mimeType: 'text/plain'
      });
      
      // Check accessibility of error state
      cy.checkA11y('.image-dialog');
    });
  });
});