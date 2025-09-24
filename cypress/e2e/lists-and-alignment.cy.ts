describe('WYSIWYG Editor - Lists and Alignment', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Bullet Lists', () => {
    it('should create bullet list from text', () => {
      cy.get('.wysiwyg-content').click().type('First item');
      
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<li>First item</li>');
    });

    it('should create new list items with Enter key', () => {
      cy.get('.wysiwyg-content').click().type('First item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Second item');
      cy.get('.wysiwyg-content').type('{enter}Third item');
      
      cy.getEditorContent().should('contain', '<li>First item</li>');
      cy.getEditorContent().should('contain', '<li>Second item</li>');
      cy.getEditorContent().should('contain', '<li>Third item</li>');
    });

    it('should exit list with double Enter', () => {
      cy.get('.wysiwyg-content').click().type('List item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}{enter}Normal text');
      
      cy.getEditorContent().should('contain', '<li>List item</li>');
      cy.getEditorContent().should('contain', '</ul>');
      cy.getEditorContent().should('match', /<\/ul>[\s\S]*Normal text/);
    });

    it('should handle nested bullet lists with Tab', () => {
      cy.get('.wysiwyg-content').click().type('Parent item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Child item{tab}');
      
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<li>Parent item</li>');
      cy.getEditorContent().should('contain', '<li>Child item</li>');
    });

    it('should outdent nested lists with Shift+Tab', () => {
      cy.setEditorContent(`
        <ul>
          <li>Parent item
            <ul>
              <li>Child item</li>
            </ul>
          </li>
        </ul>
      `);
      
      // Position cursor in child item
      cy.get('.wysiwyg-content ul ul li').click();
      cy.get('.wysiwyg-content').type('{shift+tab}');
      
      // Child should now be at same level as parent
      cy.get('.wysiwyg-content ul > li').should('have.length', 2);
    });

    it('should toggle list off when clicking button again', () => {
      cy.get('.wysiwyg-content').click().type('List item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ul>');
      
      // Toggle off
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.getEditorContent().should('not.contain', '<ul>');
      cy.getEditorContent().should('contain', 'List item');
    });
  });

  describe('Numbered Lists', () => {
    it('should create numbered list from text', () => {
      cy.get('.wysiwyg-content').click().type('First item');
      
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('contain', '<li>First item</li>');
    });

    it('should create sequential numbered items', () => {
      cy.get('.wysiwyg-content').click().type('First item');
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Second item');
      cy.get('.wysiwyg-content').type('{enter}Third item');
      
      cy.get('.wysiwyg-content ol li').should('have.length', 3);
      cy.get('.wysiwyg-content ol li').eq(0).should('contain', 'First item');
      cy.get('.wysiwyg-content ol li').eq(1).should('contain', 'Second item');
      cy.get('.wysiwyg-content ol li').eq(2).should('contain', 'Third item');
    });

    it('should handle nested numbered lists', () => {
      cy.get('.wysiwyg-content').click().type('Main point');
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Sub point{tab}');
      
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('contain', '<li>Main point');
      cy.getEditorContent().should('contain', '<li>Sub point</li>');
    });

    it('should convert between bullet and numbered lists', () => {
      cy.get('.wysiwyg-content').click().type('List item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ul>');
      
      // Convert to numbered list
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('not.contain', '<ul>');
      cy.getEditorContent().should('contain', '<li>List item</li>');
    });
  });

  describe('Mixed Lists', () => {
    it('should handle mixed bullet and numbered lists', () => {
      cy.get('.wysiwyg-content').click().type('Bullet item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}{enter}Numbered item');
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.getEditorContent().should('contain', '<ul><li>Bullet item</li></ul>');
      cy.getEditorContent().should('contain', '<ol><li>Numbered item</li></ol>');
    });

    it('should handle complex nested structures', () => {
      cy.get('.wysiwyg-content').click().type('Main bullet');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Sub numbered{tab}');
      cy.get('[data-command="insertOrderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Another sub{enter}{shift+tab}Back to bullet');
      
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<ol>');
      cy.getEditorContent().should('contain', 'Main bullet');
      cy.getEditorContent().should('contain', 'Sub numbered');
      cy.getEditorContent().should('contain', 'Another sub');
      cy.getEditorContent().should('contain', 'Back to bullet');
    });
  });

  describe('Text Alignment', () => {
    it('should align text to left', () => {
      cy.get('.wysiwyg-content').click().type('Left aligned text');
      cy.selectEditorText(0, 17);
      
      cy.get('[data-command="justifyLeft"]').click();
      
      cy.getEditorContent().should('contain', 'text-align: left');
    });

    it('should align text to center', () => {
      cy.get('.wysiwyg-content').click().type('Center aligned text');
      cy.selectEditorText(0, 19);
      
      cy.get('[data-command="justifyCenter"]').click();
      
      cy.getEditorContent().should('contain', 'text-align: center');
    });

    it('should align text to right', () => {
      cy.get('.wysiwyg-content').click().type('Right aligned text');
      cy.selectEditorText(0, 18);
      
      cy.get('[data-command="justifyRight"]').click();
      
      cy.getEditorContent().should('contain', 'text-align: right');
    });

    it('should justify text', () => {
      cy.get('.wysiwyg-content').click().type('Justified text that should be spread across the full width');
      cy.selectEditorText(0, 56);
      
      cy.get('[data-command="justifyFull"]').click();
      
      cy.getEditorContent().should('contain', 'text-align: justify');
    });

    it('should handle alignment changes', () => {
      cy.get('.wysiwyg-content').click().type('Alignment test');
      cy.selectEditorText(0, 14);
      
      // Start with center
      cy.get('[data-command="justifyCenter"]').click();
      cy.getEditorContent().should('contain', 'text-align: center');
      
      // Change to right
      cy.selectEditorText(0, 14);
      cy.get('[data-command="justifyRight"]').click();
      cy.getEditorContent().should('contain', 'text-align: right');
      cy.getEditorContent().should('not.contain', 'text-align: center');
    });

    it('should align different paragraphs independently', () => {
      cy.get('.wysiwyg-content').click().type('First paragraph{enter}Second paragraph');
      
      // Align first paragraph to center
      cy.selectEditorText(0, 15);
      cy.get('[data-command="justifyCenter"]').click();
      
      // Align second paragraph to right
      cy.selectEditorText(16, 32);
      cy.get('[data-command="justifyRight"]').click();
      
      cy.getEditorContent().should('contain', 'text-align: center');
      cy.getEditorContent().should('contain', 'text-align: right');
    });
  });

  describe('List Formatting Combinations', () => {
    it('should apply text formatting within list items', () => {
      cy.get('.wysiwyg-content').click().type('Bold list item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.selectEditorText(0, 4); // Select "Bold"
      cy.get('[data-command="bold"]').click();
      
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<li><strong>Bold</strong> list item</li>');
    });

    it('should align list items', () => {
      cy.get('.wysiwyg-content').click().type('Centered list item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('[data-command="justifyCenter"]').click();
      
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', 'text-align: center');
    });

    it('should handle complex formatting in nested lists', () => {
      cy.get('.wysiwyg-content').click().type('Parent item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      // Make parent bold
      cy.selectEditorText(0, 11);
      cy.get('[data-command="bold"]').click();
      
      // Add child item
      cy.get('.wysiwyg-content').type('{end}{enter}Child item{tab}');
      
      // Make child italic
      cy.selectEditorText(12, 22);
      cy.get('[data-command="italic"]').click();
      
      cy.getEditorContent().should('contain', '<strong>Parent item</strong>');
      cy.getEditorContent().should('contain', '<em>Child item</em>');
    });
  });

  describe('Keyboard Navigation in Lists', () => {
    it('should navigate between list items with arrow keys', () => {
      cy.get('.wysiwyg-content').click().type('Item 1');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}Item 2{enter}Item 3');
      
      // Navigate up
      cy.get('.wysiwyg-content').type('{uparrow}');
      cy.get('.wysiwyg-content').type(' - modified');
      
      cy.getEditorContent().should('contain', 'Item 2 - modified');
    });

    it('should handle Home and End keys in list items', () => {
      cy.get('.wysiwyg-content').click().type('Long list item text');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      // Go to end and add text
      cy.get('.wysiwyg-content').type('{end} - end');
      cy.getEditorContent().should('contain', 'Long list item text - end');
      
      // Go to home and add text
      cy.get('.wysiwyg-content').type('{home}Start - ');
      cy.getEditorContent().should('contain', 'Start - Long list item text - end');
    });
  });
});