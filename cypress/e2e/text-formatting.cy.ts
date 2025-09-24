describe('WYSIWYG Editor - Text Formatting', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Basic Text Formatting', () => {
    it('should apply bold formatting with toolbar button', () => {
      cy.get('.wysiwyg-content').click().type('Bold text test');
      cy.selectEditorText(0, 4); // Select "Bold"
      
      cy.get('[data-command="bold"]').click();
      
      cy.getEditorContent().should('contain', '<strong>Bold</strong>');
      cy.getEditorContent().should('contain', 'text test');
    });

    it('should apply bold formatting with Ctrl+B', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard bold test');
      cy.selectEditorText(9, 13); // Select "bold"
      
      cy.get('.wysiwyg-content').type('{ctrl+b}');
      
      cy.getEditorContent().should('contain', '<strong>bold</strong>');
    });

    it('should toggle bold formatting on and off', () => {
      cy.get('.wysiwyg-content').click().type('Toggle test');
      cy.selectEditorText(0, 6); // Select "Toggle"
      
      // Apply bold
      cy.get('[data-command="bold"]').click();
      cy.getEditorContent().should('contain', '<strong>Toggle</strong>');
      
      // Remove bold
      cy.get('[data-command="bold"]').click();
      cy.getEditorContent().should('not.contain', '<strong>Toggle</strong>');
      cy.getEditorContent().should('contain', 'Toggle test');
    });

    it('should apply italic formatting', () => {
      cy.get('.wysiwyg-content').click().type('Italic text test');
      cy.selectEditorText(0, 6); // Select "Italic"
      
      cy.get('[data-command="italic"]').click();
      
      cy.getEditorContent().should('contain', '<em>Italic</em>');
    });

    it('should apply italic formatting with Ctrl+I', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard italic test');
      cy.selectEditorText(9, 15); // Select "italic"
      
      cy.get('.wysiwyg-content').type('{ctrl+i}');
      
      cy.getEditorContent().should('contain', '<em>italic</em>');
    });

    it('should apply underline formatting', () => {
      cy.get('.wysiwyg-content').click().type('Underline text test');
      cy.selectEditorText(0, 9); // Select "Underline"
      
      cy.get('[data-command="underline"]').click();
      
      cy.getEditorContent().should('contain', '<u>Underline</u>');
    });

    it('should apply underline formatting with Ctrl+U', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard underline test');
      cy.selectEditorText(9, 18); // Select "underline"
      
      cy.get('.wysiwyg-content').type('{ctrl+u}');
      
      cy.getEditorContent().should('contain', '<u>underline</u>');
    });
  });

  describe('Combined Formatting', () => {
    it('should apply multiple formats to same text', () => {
      cy.get('.wysiwyg-content').click().type('Multi format test');
      cy.selectEditorText(0, 5); // Select "Multi"
      
      // Apply bold
      cy.get('[data-command="bold"]').click();
      
      // Keep selection and apply italic
      cy.selectEditorText(0, 5);
      cy.get('[data-command="italic"]').click();
      
      // Keep selection and apply underline
      cy.selectEditorText(0, 5);
      cy.get('[data-command="underline"]').click();
      
      cy.getEditorContent().should('contain', '<strong><em><u>Multi</u></em></strong>');
    });

    it('should handle overlapping format selections', () => {
      cy.get('.wysiwyg-content').click().type('Overlapping format test');
      
      // Apply bold to "Overlapping format"
      cy.selectEditorText(0, 17);
      cy.get('[data-command="bold"]').click();
      
      // Apply italic to "format test"
      cy.selectEditorText(12, 23);
      cy.get('[data-command="italic"]').click();
      
      cy.getEditorContent().should('contain', '<strong>Overlapping <em>format</em></strong><em> test</em>');
    });

    it('should preserve formatting when typing at boundaries', () => {
      cy.get('.wysiwyg-content').click().type('Test text');
      cy.selectEditorText(0, 4); // Select "Test"
      
      cy.get('[data-command="bold"]').click();
      
      // Position cursor after bold text and type
      cy.get('.wysiwyg-content').click().type('{end} more');
      
      cy.getEditorContent().should('contain', '<strong>Test</strong> text more');
    });
  });

  describe('Font Size Formatting', () => {
    it('should change font size using dropdown', () => {
      cy.get('.wysiwyg-content').click().type('Font size test');
      cy.selectEditorText(0, 4); // Select "Font"
      
      cy.get('[data-command="fontSize"]').select('18px');
      
      cy.getEditorContent().should('contain', 'font-size: 18px');
    });

    it('should handle different font sizes', () => {
      cy.get('.wysiwyg-content').click().type('Small Medium Large');
      
      // Small font
      cy.selectEditorText(0, 5);
      cy.get('[data-command="fontSize"]').select('12px');
      
      // Medium font
      cy.selectEditorText(6, 12);
      cy.get('[data-command="fontSize"]').select('16px');
      
      // Large font
      cy.selectEditorText(13, 18);
      cy.get('[data-command="fontSize"]').select('24px');
      
      cy.getEditorContent().should('contain', 'font-size: 12px');
      cy.getEditorContent().should('contain', 'font-size: 16px');
      cy.getEditorContent().should('contain', 'font-size: 24px');
    });
  });

  describe('Color Formatting', () => {
    it('should change text color', () => {
      cy.get('.wysiwyg-content').click().type('Colored text');
      cy.selectEditorText(0, 7); // Select "Colored"
      
      cy.get('[data-command="foreColor"]').click();
      cy.get('.color-picker [data-color="#ff0000"]').click(); // Red color
      
      cy.getEditorContent().should('contain', 'color: #ff0000');
    });

    it('should change background color', () => {
      cy.get('.wysiwyg-content').click().type('Highlighted text');
      cy.selectEditorText(0, 11); // Select "Highlighted"
      
      cy.get('[data-command="backColor"]').click();
      cy.get('.color-picker [data-color="#ffff00"]').click(); // Yellow background
      
      cy.getEditorContent().should('contain', 'background-color: #ffff00');
    });

    it('should combine text and background colors', () => {
      cy.get('.wysiwyg-content').click().type('Colorful text');
      cy.selectEditorText(0, 8); // Select "Colorful"
      
      // Set text color
      cy.get('[data-command="foreColor"]').click();
      cy.get('.color-picker [data-color="#0000ff"]').click(); // Blue text
      
      // Keep selection and set background color
      cy.selectEditorText(0, 8);
      cy.get('[data-command="backColor"]').click();
      cy.get('.color-picker [data-color="#ffff00"]').click(); // Yellow background
      
      cy.getEditorContent().should('contain', 'color: #0000ff');
      cy.getEditorContent().should('contain', 'background-color: #ffff00');
    });
  });

  describe('Format Removal', () => {
    it('should remove all formatting', () => {
      cy.get('.wysiwyg-content').click().type('Formatted text');
      cy.selectEditorText(0, 9); // Select "Formatted"
      
      // Apply multiple formats
      cy.get('[data-command="bold"]').click();
      cy.selectEditorText(0, 9);
      cy.get('[data-command="italic"]').click();
      cy.selectEditorText(0, 9);
      cy.get('[data-command="underline"]').click();
      
      // Remove formatting
      cy.selectEditorText(0, 9);
      cy.get('[data-command="removeFormat"]').click();
      
      cy.getEditorContent().should('not.contain', '<strong>');
      cy.getEditorContent().should('not.contain', '<em>');
      cy.getEditorContent().should('not.contain', '<u>');
      cy.getEditorContent().should('contain', 'Formatted text');
    });

    it('should remove specific formatting while preserving others', () => {
      cy.get('.wysiwyg-content').click().type('Mixed format');
      cy.selectEditorText(0, 5); // Select "Mixed"
      
      // Apply bold and italic
      cy.get('[data-command="bold"]').click();
      cy.selectEditorText(0, 5);
      cy.get('[data-command="italic"]').click();
      
      // Remove only bold
      cy.selectEditorText(0, 5);
      cy.get('[data-command="bold"]').click(); // Toggle off
      
      cy.getEditorContent().should('not.contain', '<strong>');
      cy.getEditorContent().should('contain', '<em>Mixed</em>');
    });
  });

  describe('Toolbar State Indicators', () => {
    it('should show active state for applied formats', () => {
      cy.get('.wysiwyg-content').click().type('Active state test');
      cy.selectEditorText(0, 6); // Select "Active"
      
      // Apply bold
      cy.get('[data-command="bold"]').click();
      
      // Check if bold button shows active state
      cy.get('[data-command="bold"]').should('have.class', 'active');
      
      // Position cursor in bold text
      cy.get('.wysiwyg-content').click();
      cy.selectEditorText(2, 2); // Position cursor in middle of "Active"
      
      // Bold button should still be active
      cy.get('[data-command="bold"]').should('have.class', 'active');
    });

    it('should update toolbar state when cursor moves', () => {
      cy.setEditorContent('<strong>Bold</strong> normal <em>italic</em> text');
      
      // Click in bold text
      cy.get('.wysiwyg-content strong').click();
      cy.get('[data-command="bold"]').should('have.class', 'active');
      cy.get('[data-command="italic"]').should('not.have.class', 'active');
      
      // Click in italic text
      cy.get('.wysiwyg-content em').click();
      cy.get('[data-command="bold"]').should('not.have.class', 'active');
      cy.get('[data-command="italic"]').should('have.class', 'active');
      
      // Click in normal text
      cy.get('.wysiwyg-content').contains('normal').click();
      cy.get('[data-command="bold"]').should('not.have.class', 'active');
      cy.get('[data-command="italic"]').should('not.have.class', 'active');
    });
  });
});