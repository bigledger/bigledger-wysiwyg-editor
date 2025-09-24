describe('WYSIWYG Editor - Cross-Browser Compatibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Browser Detection and Fallbacks', () => {
    it('should detect browser capabilities', () => {
      cy.window().then(win => {
        // Check if browser compatibility service is working
        cy.get('[data-testid="browser-info"]').should('contain', win.navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other');
      });
    });

    it('should provide fallbacks for unsupported features', () => {
      // Mock older browser without certain APIs
      cy.window().then(win => {
        // Temporarily remove modern APIs to test fallbacks
        const originalExecCommand = win.document.execCommand;
        delete (win.document as any).execCommand;
        
        cy.get('.wysiwyg-content').click().type('Fallback test');
        cy.selectEditorText(0, 8);
        
        // Should still work with fallback implementation
        cy.get('[data-command="bold"]').click();
        cy.getEditorContent().should('contain', '<strong>Fallback</strong>');
        
        // Restore original function
        (win.document as any).execCommand = originalExecCommand;
      });
    });

    it('should handle missing Selection API gracefully', () => {
      cy.window().then(win => {
        const originalGetSelection = win.getSelection;
        (win as any).getSelection = undefined;
        
        cy.get('.wysiwyg-content').click().type('Selection fallback test');
        
        // Should still allow basic text input
        cy.getEditorContent().should('contain', 'Selection fallback test');
        
        // Restore original function
        (win as any).getSelection = originalGetSelection;
      });
    });
  });

  describe('Content Editable Behavior', () => {
    it('should handle contenteditable consistently across browsers', () => {
      cy.get('.wysiwyg-content').should('have.attr', 'contenteditable', 'true');
      
      // Test basic typing
      cy.get('.wysiwyg-content').click().type('Cross-browser typing test');
      cy.getEditorContent().should('contain', 'Cross-browser typing test');
      
      // Test Enter key behavior
      cy.get('.wysiwyg-content').type('{enter}New line');
      cy.getEditorContent().should('contain', 'New line');
    });

    it('should normalize line break handling', () => {
      cy.get('.wysiwyg-content').click().type('Line 1{enter}Line 2{enter}Line 3');
      
      // Should create consistent paragraph structure
      cy.getEditorContent().should('match', /<p>Line 1<\/p>/);
      cy.getEditorContent().should('match', /<p>Line 2<\/p>/);
      cy.getEditorContent().should('match', /<p>Line 3<\/p>/);
    });

    it('should handle paste events consistently', () => {
      const testContent = 'Pasted content with <strong>formatting</strong>';
      
      cy.get('.wysiwyg-content').click().then(() => {
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: new DataTransfer()
        });
        pasteEvent.clipboardData?.setData('text/html', testContent);
        
        cy.get('.wysiwyg-content').then($editor => {
          $editor[0].dispatchEvent(pasteEvent);
        });
      });
      
      cy.getEditorContent().should('contain', 'Pasted content');
      cy.getEditorContent().should('contain', '<strong>formatting</strong>');
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle keyboard shortcuts consistently', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard test');
      cy.selectEditorText(0, 8);
      
      // Test Ctrl+B (or Cmd+B on Mac)
      cy.get('.wysiwyg-content').type('{ctrl+b}');
      cy.getEditorContent().should('contain', '<strong>Keyboard</strong>');
      
      // Test Ctrl+I
      cy.selectEditorText(9, 13);
      cy.get('.wysiwyg-content').type('{ctrl+i}');
      cy.getEditorContent().should('contain', '<em>test</em>');
    });

    it('should handle special keys across browsers', () => {
      cy.get('.wysiwyg-content').click().type('Special keys test');
      
      // Test Home key
      cy.get('.wysiwyg-content').type('{home}Start: ');
      cy.getEditorContent().should('contain', 'Start: Special keys test');
      
      // Test End key
      cy.get('.wysiwyg-content').type('{end} :End');
      cy.getEditorContent().should('contain', 'Start: Special keys test :End');
      
      // Test Delete key
      cy.get('.wysiwyg-content').type('{home}{del}{del}{del}{del}{del}{del}');
      cy.getEditorContent().should('contain', 'Special keys test :End');
    });

    it('should handle Tab key in lists consistently', () => {
      cy.get('.wysiwyg-content').click().type('Parent item');
      cy.get('[data-command="insertUnorderedList"]').click();
      cy.get('.wysiwyg-content').type('{enter}Child item{tab}');
      
      // Should create nested list structure
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', '<li>Parent item</li>');
      cy.getEditorContent().should('contain', '<li>Child item</li>');
    });
  });

  describe('CSS and Styling Compatibility', () => {
    it('should apply styles consistently across browsers', () => {
      cy.get('.wysiwyg-content').click().type('Styling test');
      cy.selectEditorText(0, 7);
      
      cy.get('[data-command="bold"]').click();
      
      // Check that bold styling is applied
      cy.get('.wysiwyg-content strong').should('have.css', 'font-weight').and('match', /^(bold|700)$/);
    });

    it('should handle font size changes consistently', () => {
      cy.get('.wysiwyg-content').click().type('Font size test');
      cy.selectEditorText(0, 4);
      
      cy.get('[data-command="fontSize"]').select('18px');
      
      // Should apply font size
      cy.getEditorContent().should('contain', 'font-size: 18px');
    });

    it('should handle color changes across browsers', () => {
      cy.get('.wysiwyg-content').click().type('Color test');
      cy.selectEditorText(0, 5);
      
      cy.get('[data-command="foreColor"]').click();
      cy.get('.color-picker [data-color="#ff0000"]').click();
      
      cy.getEditorContent().should('contain', 'color: #ff0000');
    });
  });

  describe('Event Handling Compatibility', () => {
    it('should handle input events consistently', () => {
      let inputEventCount = 0;
      
      cy.get('.wysiwyg-content').then($editor => {
        $editor[0].addEventListener('input', () => {
          inputEventCount++;
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Input event test');
      
      cy.then(() => {
        expect(inputEventCount).to.be.greaterThan(0);
      });
    });

    it('should handle selection change events', () => {
      let selectionChangeCount = 0;
      
      cy.document().then(doc => {
        doc.addEventListener('selectionchange', () => {
          selectionChangeCount++;
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Selection test');
      cy.selectEditorText(0, 9);
      
      cy.then(() => {
        expect(selectionChangeCount).to.be.greaterThan(0);
      });
    });

    it('should handle focus and blur events', () => {
      let focusEventFired = false;
      let blurEventFired = false;
      
      cy.get('.wysiwyg-content').then($editor => {
        $editor[0].addEventListener('focus', () => {
          focusEventFired = true;
        });
        $editor[0].addEventListener('blur', () => {
          blurEventFired = true;
        });
      });
      
      cy.get('.wysiwyg-content').click();
      cy.get('body').click();
      
      cy.then(() => {
        expect(focusEventFired).to.be.true;
        expect(blurEventFired).to.be.true;
      });
    });
  });

  describe('Range and Selection API Compatibility', () => {
    it('should create ranges consistently', () => {
      cy.get('.wysiwyg-content').click().type('Range API test');
      
      cy.window().then(win => {
        const range = win.document.createRange();
        const textNode = win.document.querySelector('.wysiwyg-content')?.firstChild;
        
        if (textNode) {
          range.setStart(textNode, 0);
          range.setEnd(textNode, 5);
          
          const selection = win.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          expect(selection?.toString()).to.equal('Range');
        }
      });
    });

    it('should handle range boundaries correctly', () => {
      cy.setEditorContent('<p>First paragraph</p><p>Second paragraph</p>');
      
      cy.window().then(win => {
        const firstP = win.document.querySelector('.wysiwyg-content p:first-child');
        const secondP = win.document.querySelector('.wysiwyg-content p:last-child');
        
        if (firstP && secondP) {
          const range = win.document.createRange();
          range.setStart(firstP.firstChild!, 6);
          range.setEnd(secondP.firstChild!, 6);
          
          const selection = win.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          expect(selection?.toString()).to.contain('paragraph');
        }
      });
    });
  });

  describe('Command Execution Compatibility', () => {
    it('should execute formatting commands consistently', () => {
      cy.get('.wysiwyg-content').click().type('Command test');
      cy.selectEditorText(0, 7);
      
      cy.window().then(win => {
        const success = win.document.execCommand('bold', false);
        expect(success).to.be.true;
      });
      
      cy.getEditorContent().should('contain', '<strong>Command</strong>');
    });

    it('should query command state correctly', () => {
      cy.setEditorContent('<strong>Bold text</strong> normal text');
      
      // Click in bold text
      cy.get('.wysiwyg-content strong').click();
      
      cy.window().then(win => {
        const isBold = win.document.queryCommandState('bold');
        expect(isBold).to.be.true;
      });
      
      // Click in normal text
      cy.get('.wysiwyg-content').contains('normal').click();
      
      cy.window().then(win => {
        const isBold = win.document.queryCommandState('bold');
        expect(isBold).to.be.false;
      });
    });

    it('should handle unsupported commands gracefully', () => {
      cy.get('.wysiwyg-content').click().type('Unsupported command test');
      
      cy.window().then(win => {
        // Try a command that might not be supported in all browsers
        const success = win.document.execCommand('nonExistentCommand', false);
        expect(success).to.be.false;
      });
      
      // Editor should still be functional
      cy.get('.wysiwyg-content').type(' - still working');
      cy.getEditorContent().should('contain', 'still working');
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should work on mobile Safari', () => {
      cy.viewport('iphone-x');
      
      // Simulate mobile Safari user agent
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          configurable: true
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Mobile Safari test');
      cy.getEditorContent().should('contain', 'Mobile Safari test');
      
      // Test formatting
      cy.selectEditorText(0, 6);
      cy.get('[data-command="bold"]').click();
      cy.getEditorContent().should('contain', '<strong>Mobile</strong>');
    });

    it('should work on mobile Chrome', () => {
      cy.viewport('samsung-s10');
      
      // Simulate mobile Chrome user agent
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          configurable: true
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Mobile Chrome test');
      cy.getEditorContent().should('contain', 'Mobile Chrome test');
    });

    it('should handle touch events on mobile', () => {
      cy.viewport('ipad-2');
      
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      cy.get('.wysiwyg-content').type('Touch input test');
      
      cy.getEditorContent().should('contain', 'Touch input test');
    });
  });

  describe('Performance Across Browsers', () => {
    it('should handle large content efficiently', () => {
      const largeContent = 'Large content test. '.repeat(1000);
      
      const startTime = Date.now();
      cy.setEditorContent(largeContent);
      const endTime = Date.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).to.be.lessThan(5000);
      
      cy.getEditorContent().should('contain', 'Large content test');
    });

    it('should handle rapid input efficiently', () => {
      cy.get('.wysiwyg-content').click();
      
      // Type rapidly
      const rapidText = 'Rapid typing test with lots of characters to simulate fast user input';
      cy.get('.wysiwyg-content').type(rapidText, { delay: 0 });
      
      cy.getEditorContent().should('contain', rapidText);
    });

    it('should handle multiple formatting operations efficiently', () => {
      cy.get('.wysiwyg-content').click().type('Performance test with multiple formatting operations');
      
      // Apply multiple formats rapidly
      cy.selectEditorText(0, 11); // "Performance"
      cy.get('[data-command="bold"]').click();
      
      cy.selectEditorText(12, 16); // "test"
      cy.get('[data-command="italic"]').click();
      
      cy.selectEditorText(22, 30); // "multiple"
      cy.get('[data-command="underline"]').click();
      
      cy.getEditorContent().should('contain', '<strong>Performance</strong>');
      cy.getEditorContent().should('contain', '<em>test</em>');
      cy.getEditorContent().should('contain', '<u>multiple</u>');
    });
  });
});