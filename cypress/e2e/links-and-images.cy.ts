describe('WYSIWYG Editor - Links and Images', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Link Creation', () => {
    it('should create link from selected text using toolbar', () => {
      cy.get('.wysiwyg-content').click().type('Visit our website for more information');
      cy.selectEditorText(10, 17); // Select "website"
      
      cy.get('[data-command="createLink"]').click();
      
      // Link dialog should appear
      cy.get('.link-dialog').should('be.visible');
      cy.get('.link-dialog input[name="url"]').type('https://example.com');
      cy.get('.link-dialog input[name="text"]').should('have.value', 'website');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<a href="https://example.com">website</a>');
    });

    it('should create link using Ctrl+K shortcut', () => {
      cy.get('.wysiwyg-content').click().type('Check this link out');
      cy.selectEditorText(6, 15); // Select "this link"
      
      cy.get('.wysiwyg-content').type('{ctrl+k}');
      
      cy.get('.link-dialog').should('be.visible');
      cy.get('.link-dialog input[name="url"]').type('https://test-link.com');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<a href="https://test-link.com">this link</a>');
    });

    it('should create link without selected text', () => {
      cy.get('.wysiwyg-content').click().type('Click here: ');
      
      cy.get('[data-command="createLink"]').click();
      
      cy.get('.link-dialog').should('be.visible');
      cy.get('.link-dialog input[name="url"]').type('https://new-link.com');
      cy.get('.link-dialog input[name="text"]').type('New Link');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', 'Click here: <a href="https://new-link.com">New Link</a>');
    });

    it('should validate URL format', () => {
      cy.get('.wysiwyg-content').click().type('Invalid link test');
      cy.selectEditorText(0, 7); // Select "Invalid"
      
      cy.get('[data-command="createLink"]').click();
      
      // Try invalid URL
      cy.get('.link-dialog input[name="url"]').type('not-a-valid-url');
      cy.get('.link-dialog button[type="submit"]').should('be.disabled');
      
      // Try valid URL
      cy.get('.link-dialog input[name="url"]').clear().type('https://valid-url.com');
      cy.get('.link-dialog button[type="submit"]').should('not.be.disabled');
    });

    it('should handle different URL protocols', () => {
      const protocols = [
        'https://example.com',
        'http://example.com',
        'mailto:test@example.com',
        'tel:+1234567890',
        'ftp://files.example.com'
      ];

      protocols.forEach((url, index) => {
        cy.get('.wysiwyg-content').click().type(`Link ${index + 1} `);
        cy.selectEditorText(0, 4); // Select "Link"
        
        cy.get('[data-command="createLink"]').click();
        cy.get('.link-dialog input[name="url"]').type(url);
        cy.get('.link-dialog button[type="submit"]').click();
        
        cy.getEditorContent().should('contain', `<a href="${url}">Link</a>`);
        
        // Clear for next iteration
        cy.get('.wysiwyg-content').clear();
      });
    });
  });

  describe('Link Editing', () => {
    beforeEach(() => {
      cy.setEditorContent('Visit <a href="https://old-url.com">this link</a> for more info');
    });

    it('should edit existing link by clicking on it', () => {
      cy.get('.wysiwyg-content a').click();
      
      cy.get('.link-dialog').should('be.visible');
      cy.get('.link-dialog input[name="url"]').should('have.value', 'https://old-url.com');
      cy.get('.link-dialog input[name="text"]').should('have.value', 'this link');
      
      // Update URL
      cy.get('.link-dialog input[name="url"]').clear().type('https://new-url.com');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<a href="https://new-url.com">this link</a>');
    });

    it('should update link text', () => {
      cy.get('.wysiwyg-content a').click();
      
      cy.get('.link-dialog input[name="text"]').clear().type('updated link text');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<a href="https://old-url.com">updated link text</a>');
    });

    it('should remove link', () => {
      cy.get('.wysiwyg-content a').click();
      
      cy.get('.link-dialog button[data-action="remove"]').click();
      
      cy.getEditorContent().should('not.contain', '<a href');
      cy.getEditorContent().should('contain', 'this link');
    });

    it('should cancel link editing', () => {
      cy.get('.wysiwyg-content a').click();
      
      cy.get('.link-dialog input[name="url"]').clear().type('https://changed-url.com');
      cy.get('.link-dialog button[data-action="cancel"]').click();
      
      // Original link should be preserved
      cy.getEditorContent().should('contain', '<a href="https://old-url.com">this link</a>');
    });
  });

  describe('Image Insertion', () => {
    it('should insert image via URL', () => {
      cy.get('.wysiwyg-content').click().type('Here is an image: ');
      
      cy.get('[data-command="insertImage"]').click();
      
      cy.get('.image-dialog').should('be.visible');
      cy.get('.image-dialog input[name="url"]').type('https://example.com/image.jpg');
      cy.get('.image-dialog input[name="alt"]').type('Test image');
      cy.get('.image-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<img src="https://example.com/image.jpg" alt="Test image">');
    });

    it('should validate image URL format', () => {
      cy.get('[data-command="insertImage"]').click();
      
      // Invalid URL
      cy.get('.image-dialog input[name="url"]').type('not-an-image-url');
      cy.get('.image-dialog button[type="submit"]').should('be.disabled');
      
      // Valid image URL
      cy.get('.image-dialog input[name="url"]').clear().type('https://example.com/image.png');
      cy.get('.image-dialog button[type="submit"]').should('not.be.disabled');
    });

    it('should handle file upload', () => {
      cy.get('[data-command="insertImage"]').click();
      
      // Create a mock file
      const fileName = 'test-image.jpg';
      cy.fixture('test-image.jpg', 'base64').then(fileContent => {
        cy.get('.image-dialog input[type="file"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: fileName,
          mimeType: 'image/jpeg'
        });
      });
      
      // Should show preview
      cy.get('.image-dialog .image-preview').should('be.visible');
      cy.get('.image-dialog input[name="alt"]').type('Uploaded image');
      cy.get('.image-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<img');
      cy.getEditorContent().should('contain', 'alt="Uploaded image"');
    });

    it('should validate file types', () => {
      cy.get('[data-command="insertImage"]').click();
      
      // Try invalid file type
      cy.get('.image-dialog input[type="file"]').selectFile({
        contents: 'text content',
        fileName: 'document.txt',
        mimeType: 'text/plain'
      });
      
      cy.get('.image-dialog .error-message').should('contain', 'Invalid file type');
      cy.get('.image-dialog button[type="submit"]').should('be.disabled');
    });

    it('should handle different image formats', () => {
      const imageFormats = ['jpg', 'png', 'gif', 'webp'];
      
      imageFormats.forEach(format => {
        cy.get('[data-command="insertImage"]').click();
        
        cy.get('.image-dialog input[name="url"]').type(`https://example.com/image.${format}`);
        cy.get('.image-dialog input[name="alt"]').type(`${format.toUpperCase()} image`);
        cy.get('.image-dialog button[type="submit"]').click();
        
        cy.getEditorContent().should('contain', `<img src="https://example.com/image.${format}"`);
        
        // Clear for next iteration
        cy.get('.wysiwyg-content').clear();
      });
    });
  });

  describe('Image Management', () => {
    beforeEach(() => {
      cy.setEditorContent('<p>Before image</p><img src="https://example.com/test.jpg" alt="Test image" width="200" height="150"><p>After image</p>');
    });

    it('should select image when clicked', () => {
      cy.get('.wysiwyg-content img').click();
      
      // Image should be selected (resize handles visible)
      cy.get('.image-resize-handles').should('be.visible');
      cy.get('.wysiwyg-content img').should('have.class', 'selected');
    });

    it('should resize image with drag handles', () => {
      cy.get('.wysiwyg-content img').click();
      
      // Drag bottom-right resize handle
      cy.get('.resize-handle.bottom-right')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 250 })
        .trigger('mouseup');
      
      // Image dimensions should have changed
      cy.get('.wysiwyg-content img').should('have.attr', 'width').and('not.equal', '200');
      cy.get('.wysiwyg-content img').should('have.attr', 'height').and('not.equal', '150');
    });

    it('should delete image with Delete key', () => {
      cy.get('.wysiwyg-content img').click();
      cy.get('.wysiwyg-content').type('{del}');
      
      cy.getEditorContent().should('not.contain', '<img');
      cy.getEditorContent().should('contain', 'Before image');
      cy.getEditorContent().should('contain', 'After image');
    });

    it('should delete image with Backspace key', () => {
      cy.get('.wysiwyg-content img').click();
      cy.get('.wysiwyg-content').type('{backspace}');
      
      cy.getEditorContent().should('not.contain', '<img');
    });

    it('should edit image properties', () => {
      cy.get('.wysiwyg-content img').dblclick();
      
      cy.get('.image-dialog').should('be.visible');
      cy.get('.image-dialog input[name="url"]').should('have.value', 'https://example.com/test.jpg');
      cy.get('.image-dialog input[name="alt"]').should('have.value', 'Test image');
      
      // Update alt text
      cy.get('.image-dialog input[name="alt"]').clear().type('Updated alt text');
      cy.get('.image-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', 'alt="Updated alt text"');
    });
  });

  describe('Combined Link and Image Operations', () => {
    it('should create linked image', () => {
      // First insert image
      cy.get('.wysiwyg-content').click();
      cy.get('[data-command="insertImage"]').click();
      cy.get('.image-dialog input[name="url"]').type('https://example.com/image.jpg');
      cy.get('.image-dialog input[name="alt"]').type('Linked image');
      cy.get('.image-dialog button[type="submit"]').click();
      
      // Select image and create link
      cy.get('.wysiwyg-content img').click();
      cy.get('[data-command="createLink"]').click();
      
      cy.get('.link-dialog input[name="url"]').type('https://example.com/page');
      cy.get('.link-dialog button[type="submit"]').click();
      
      cy.getEditorContent().should('contain', '<a href="https://example.com/page"><img src="https://example.com/image.jpg" alt="Linked image"></a>');
    });

    it('should handle complex content with links and images', () => {
      cy.get('.wysiwyg-content').click().type('Check out ');
      
      // Add link
      cy.selectEditorText(0, 9); // Select "Check out"
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog input[name="url"]').type('https://example.com');
      cy.get('.link-dialog button[type="submit"]').click();
      
      // Add text and image
      cy.get('.wysiwyg-content').type('{end} this image: ');
      cy.get('[data-command="insertImage"]').click();
      cy.get('.image-dialog input[name="url"]').type('https://example.com/sample.jpg');
      cy.get('.image-dialog input[name="alt"]').type('Sample');
      cy.get('.image-dialog button[type="submit"]').click();
      
      // Add more text with formatting
      cy.get('.wysiwyg-content').type('{end} and some ');
      cy.get('.wysiwyg-content').type('bold text');
      cy.selectEditorText(-9, -1); // Select "bold text"
      cy.get('[data-command="bold"]').click();
      
      // Verify complex content
      cy.getEditorContent().should('contain', '<a href="https://example.com">Check out</a>');
      cy.getEditorContent().should('contain', '<img src="https://example.com/sample.jpg" alt="Sample">');
      cy.getEditorContent().should('contain', '<strong>bold text</strong>');
    });

    it('should maintain link functionality after image insertion', () => {
      cy.setEditorContent('<a href="https://example.com">Existing link</a>');
      
      // Insert image after link
      cy.get('.wysiwyg-content').click().type('{end} ');
      cy.get('[data-command="insertImage"]').click();
      cy.get('.image-dialog input[name="url"]').type('https://example.com/after.jpg');
      cy.get('.image-dialog input[name="alt"]').type('After link');
      cy.get('.image-dialog button[type="submit"]').click();
      
      // Original link should still work
      cy.get('.wysiwyg-content a').click();
      cy.get('.link-dialog').should('be.visible');
      cy.get('.link-dialog input[name="url"]').should('have.value', 'https://example.com');
    });
  });

  describe('Link and Image Accessibility', () => {
    it('should require alt text for images', () => {
      cy.get('[data-command="insertImage"]').click();
      
      cy.get('.image-dialog input[name="url"]').type('https://example.com/image.jpg');
      // Don't fill alt text
      cy.get('.image-dialog button[type="submit"]').click();
      
      cy.get('.image-dialog .error-message').should('contain', 'Alt text is required');
    });

    it('should provide meaningful link text validation', () => {
      cy.get('.wysiwyg-content').click().type('Click here');
      cy.selectEditorText(0, 10);
      
      cy.get('[data-command="createLink"]').click();
      cy.get('.link-dialog input[name="url"]').type('https://example.com');
      cy.get('.link-dialog button[type="submit"]').click();
      
      // Should show warning about non-descriptive link text
      cy.get('.accessibility-warning').should('contain', 'Consider using more descriptive link text');
    });

    it('should support keyboard navigation for links', () => {
      cy.setEditorContent('Visit <a href="https://example.com">our website</a> for more info');
      
      // Tab to link
      cy.get('body').tab();
      cy.get('.wysiwyg-content a').should('be.focused');
      
      // Enter should activate link dialog
      cy.get('.wysiwyg-content a').type('{enter}');
      cy.get('.link-dialog').should('be.visible');
    });
  });
});