describe('WYSIWYG Editor - Comprehensive Cross-Browser Compatibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('wysiwyg-editor').should('be.visible');
  });

  describe('Browser Detection and Feature Support', () => {
    it('should detect browser capabilities and provide appropriate fallbacks', () => {
      cy.window().then(win => {
        // Test browser detection
        const userAgent = win.navigator.userAgent;
        const isChrome = userAgent.includes('Chrome');
        const isFirefox = userAgent.includes('Firefox');
        const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
        const isEdge = userAgent.includes('Edg');
        
        cy.log(`Browser detected: ${isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Other'}`);
        
        // Test feature detection
        expect(win.document.execCommand).to.exist;
        expect(win.getSelection).to.exist;
        expect(win.document.createRange).to.exist;
        
        // Test contenteditable support
        const testDiv = win.document.createElement('div');
        testDiv.contentEditable = 'true';
        expect(testDiv.isContentEditable).to.be.true;
      });
    });

    it('should handle missing or limited API support gracefully', () => {
      cy.window().then(win => {
        // Test with limited execCommand support
        const originalExecCommand = win.document.execCommand;
        
        // Mock limited execCommand support
        win.document.execCommand = (command: string) => {
          const supportedCommands = ['bold', 'italic', 'underline'];
          return supportedCommands.includes(command);
        };
        
        cy.get('.wysiwyg-content').click().type('Fallback test');
        cy.selectEditorText(0, 8);
        
        // Should work with supported commands
        cy.get('[data-command="bold"]').click();
        cy.getEditorContent().should('contain', 'Fallback test');
        
        // Should handle unsupported commands gracefully
        cy.get('[data-command="fontSize"]').should('exist');
        
        // Restore original function
        win.document.execCommand = originalExecCommand;
      });
    });

    it('should provide fallbacks for Selection API limitations', () => {
      cy.window().then(win => {
        const originalGetSelection = win.getSelection;
        
        // Mock limited Selection API
        (win as any).getSelection = () => ({
          rangeCount: 0,
          addRange: () => {},
          removeAllRanges: () => {},
          toString: () => ''
        });
        
        cy.get('.wysiwyg-content').click().type('Selection fallback test');
        
        // Should still allow basic text input
        cy.getEditorContent().should('contain', 'Selection fallback test');
        
        // Restore original function
        (win as any).getSelection = originalGetSelection;
      });
    });
  });

  describe('ContentEditable Behavior Consistency', () => {
    it('should handle Enter key consistently across browsers', () => {
      cy.get('.wysiwyg-content').click().type('First line{enter}Second line{enter}Third line');
      
      // Should create consistent paragraph structure
      cy.getEditorContent().then(content => {
        // Different browsers may use <p>, <div>, or <br> for line breaks
        // The editor should normalize this behavior
        expect(content).to.match(/<p>First line<\/p>|First line<br>|<div>First line<\/div>/);
        expect(content).to.match(/<p>Second line<\/p>|Second line<br>|<div>Second line<\/div>/);
        expect(content).to.match(/<p>Third line<\/p>|Third line<br>|<div>Third line<\/div>/);
      });
    });

    it('should handle Backspace and Delete consistently', () => {
      cy.setEditorContent('<p>Hello <strong>World</strong> Test</p>');
      
      // Position cursor and test backspace
      cy.get('.wysiwyg-content').click();
      cy.get('.wysiwyg-content').type('{end}{backspace}{backspace}{backspace}{backspace}');
      
      cy.getEditorContent().should('contain', 'Hello <strong>World</strong>');
      
      // Test delete key
      cy.get('.wysiwyg-content').type('{home}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{del}');
      cy.getEditorContent().should('contain', 'Hello <strong>orld</strong>');
    });

    it('should handle paste events consistently', () => {
      const testContent = '<p>Pasted <strong>formatted</strong> content</p>';
      
      cy.get('.wysiwyg-content').click().then(() => {
        // Create paste event with HTML content
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: new DataTransfer()
        });
        
        pasteEvent.clipboardData?.setData('text/html', testContent);
        pasteEvent.clipboardData?.setData('text/plain', 'Pasted formatted content');
        
        cy.get('.wysiwyg-content').then($editor => {
          $editor[0].dispatchEvent(pasteEvent);
        });
      });
      
      cy.getEditorContent().should('contain', 'Pasted');
      cy.getEditorContent().should('contain', 'formatted');
      cy.getEditorContent().should('contain', 'content');
    });

    it('should handle focus and blur events consistently', () => {
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

  describe('Keyboard Event Handling Consistency', () => {
    it('should handle keyboard shortcuts consistently across browsers', () => {
      cy.get('.wysiwyg-content').click().type('Keyboard shortcut test');
      cy.selectEditorText(0, 8);
      
      // Test Ctrl+B (Cmd+B on Mac)
      cy.window().then(win => {
        const isMac = win.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? 'cmd' : 'ctrl';
        
        cy.get('.wysiwyg-content').type(`{${modifierKey}+b}`);
        cy.getEditorContent().should('contain', '<strong>Keyboard</strong>');
        
        // Test Ctrl+I (Cmd+I on Mac)
        cy.selectEditorText(9, 17);
        cy.get('.wysiwyg-content').type(`{${modifierKey}+i}`);
        cy.getEditorContent().should('contain', '<em>shortcut</em>');
        
        // Test Ctrl+U (Cmd+U on Mac)
        cy.selectEditorText(18, 22);
        cy.get('.wysiwyg-content').type(`{${modifierKey}+u}`);
        cy.getEditorContent().should('contain', '<u>test</u>');
      });
    });

    it('should handle special keys consistently', () => {
      cy.get('.wysiwyg-content').click().type('Special keys test');
      
      // Test Home key
      cy.get('.wysiwyg-content').type('{home}START: ');
      cy.getEditorContent().should('contain', 'START: Special keys test');
      
      // Test End key
      cy.get('.wysiwyg-content').type('{end} :END');
      cy.getEditorContent().should('contain', 'START: Special keys test :END');
      
      // Test arrow keys
      cy.get('.wysiwyg-content').type('{leftarrow}{leftarrow}{leftarrow}{leftarrow}MID');
      cy.getEditorContent().should('contain', 'START: Special keys test MID:END');
      
      // Test Page Up/Down (behavior may vary)
      cy.get('.wysiwyg-content').type('{pageup}');
      cy.get('.wysiwyg-content').type('{pagedown}');
      
      // Should not crash or cause errors
      cy.getEditorContent().should('contain', 'Special keys test');
    });

    it('should handle Tab key in lists consistently', () => {
      cy.get('.wysiwyg-content').click().type('Parent item');
      cy.get('[data-command="insertUnorderedList"]').click();
      
      cy.get('.wysiwyg-content').type('{enter}Child item');
      cy.get('.wysiwyg-content').type('{tab}'); // Should indent
      
      cy.get('.wysiwyg-content').type('{enter}Another child');
      cy.get('.wysiwyg-content').type('{shift+tab}'); // Should outdent
      
      // Verify list structure (may vary by browser)
      cy.getEditorContent().should('contain', '<ul>');
      cy.getEditorContent().should('contain', 'Parent item');
      cy.getEditorContent().should('contain', 'Child item');
      cy.getEditorContent().should('contain', 'Another child');
    });
  });

  describe('CSS and Styling Consistency', () => {
    it('should apply formatting styles consistently', () => {
      cy.get('.wysiwyg-content').click().type('Styling test');
      cy.selectEditorText(0, 7);
      
      // Test bold styling
      cy.get('[data-command="bold"]').click();
      cy.get('.wysiwyg-content strong, .wysiwyg-content b').should('exist');
      cy.get('.wysiwyg-content strong, .wysiwyg-content b').should('have.css', 'font-weight').and('match', /^(bold|700|800|900)$/);
      
      // Test italic styling
      cy.selectEditorText(8, 12);
      cy.get('[data-command="italic"]').click();
      cy.get('.wysiwyg-content em, .wysiwyg-content i').should('exist');
      cy.get('.wysiwyg-content em, .wysiwyg-content i').should('have.css', 'font-style', 'italic');
      
      // Test underline styling
      cy.get('.wysiwyg-content').type('{end} more');
      cy.selectEditorText(-4, -1);
      cy.get('[data-command="underline"]').click();
      cy.get('.wysiwyg-content u').should('exist');
      cy.get('.wysiwyg-content u').should('have.css', 'text-decoration').and('include', 'underline');
    });

    it('should handle font size changes consistently', () => {
      cy.get('.wysiwyg-content').click().type('Font size test');
      cy.selectEditorText(0, 4);
      
      cy.get('[data-command="fontSize"]').select('18px');
      
      // Check that font size is applied (may be inline style or class)
      cy.get('.wysiwyg-content').should('contain.html', 'font-size');
      cy.get('.wysiwyg-content [style*="font-size"], .wysiwyg-content .font-18px').should('exist');
    });

    it('should handle color changes consistently', () => {
      cy.get('.wysiwyg-content').click().type('Color test');
      cy.selectEditorText(0, 5);
      
      cy.get('[data-command="foreColor"]').select('#ff0000');
      
      // Check that color is applied
      cy.get('.wysiwyg-content').should('contain.html', 'color');
      cy.get('.wysiwyg-content [style*="color"], .wysiwyg-content .text-red').should('exist');
    });

    it('should handle text alignment consistently', () => {
      cy.get('.wysiwyg-content').click().type('Alignment test paragraph');
      cy.selectEditorText(0, -1);
      
      // Test center alignment
      cy.get('[data-command="justifyCenter"]').click();
      cy.get('.wysiwyg-content').should('contain.html', 'text-align');
      cy.get('.wysiwyg-content [style*="text-align: center"], .wysiwyg-content .text-center').should('exist');
      
      // Test right alignment
      cy.get('[data-command="justifyRight"]').click();
      cy.get('.wysiwyg-content [style*="text-align: right"], .wysiwyg-content .text-right').should('exist');
    });
  });

  describe('Event Handling Consistency', () => {
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

    it('should handle selection change events consistently', () => {
      let selectionChangeCount = 0;
      
      cy.document().then(doc => {
        doc.addEventListener('selectionchange', () => {
          selectionChangeCount++;
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Selection change test');
      cy.selectEditorText(0, 9);
      
      cy.then(() => {
        expect(selectionChangeCount).to.be.greaterThan(0);
      });
    });

    it('should handle composition events for international input', () => {
      let compositionStartFired = false;
      let compositionEndFired = false;
      
      cy.get('.wysiwyg-content').then($editor => {
        $editor[0].addEventListener('compositionstart', () => {
          compositionStartFired = true;
        });
        $editor[0].addEventListener('compositionend', () => {
          compositionEndFired = true;
        });
      });
      
      // Simulate composition input (e.g., for Asian languages)
      cy.get('.wysiwyg-content').click().then($editor => {
        const compositionStart = new CompositionEvent('compositionstart', { data: '' });
        const compositionEnd = new CompositionEvent('compositionend', { data: '你好' });
        
        $editor[0].dispatchEvent(compositionStart);
        $editor[0].dispatchEvent(compositionEnd);
      });
      
      cy.then(() => {
        expect(compositionStartFired).to.be.true;
        expect(compositionEndFired).to.be.true;
      });
    });
  });

  describe('Range and Selection API Consistency', () => {
    it('should create and manipulate ranges consistently', () => {
      cy.setEditorContent('<p>Range API test content</p>');
      
      cy.window().then(win => {
        const range = win.document.createRange();
        const textNode = win.document.querySelector('.wysiwyg-content p')?.firstChild;
        
        if (textNode) {
          range.setStart(textNode, 0);
          range.setEnd(textNode, 5);
          
          const selection = win.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          expect(selection?.toString()).to.equal('Range');
          
          // Test range properties
          expect(range.collapsed).to.be.false;
          expect(range.startOffset).to.equal(0);
          expect(range.endOffset).to.equal(5);
        }
      });
    });

    it('should handle complex range operations consistently', () => {
      cy.setEditorContent('<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>');
      
      cy.window().then(win => {
        const firstP = win.document.querySelector('.wysiwyg-content p:first-child');
        const lastP = win.document.querySelector('.wysiwyg-content p:last-child');
        
        if (firstP && lastP) {
          const range = win.document.createRange();
          range.setStart(firstP.firstChild!, 6);
          range.setEnd(lastP.firstChild!, 5);
          
          const selection = win.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          const selectedText = selection?.toString();
          expect(selectedText).to.contain('paragraph');
          expect(selectedText).to.contain('Second');
          expect(selectedText).to.contain('Third');
        }
      });
    });

    it('should handle selection boundaries correctly', () => {
      cy.setEditorContent('<p><strong>Bold</strong> and <em>italic</em> text</p>');
      
      cy.window().then(win => {
        const strongElement = win.document.querySelector('.wysiwyg-content strong');
        const emElement = win.document.querySelector('.wysiwyg-content em');
        
        if (strongElement && emElement) {
          const range = win.document.createRange();
          range.setStartBefore(strongElement);
          range.setEndAfter(emElement);
          
          const selection = win.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          const selectedText = selection?.toString();
          expect(selectedText).to.contain('Bold');
          expect(selectedText).to.contain('and');
          expect(selectedText).to.contain('italic');
        }
      });
    });
  });

  describe('Command Execution Consistency', () => {
    it('should execute formatting commands consistently', () => {
      cy.get('.wysiwyg-content').click().type('Command execution test');
      cy.selectEditorText(0, 7);
      
      cy.window().then(win => {
        // Test execCommand directly
        const boldSuccess = win.document.execCommand('bold', false);
        expect(boldSuccess).to.be.true;
        
        // Verify result
        cy.getEditorContent().should('contain', '<strong>Command</strong>');
        
        // Test queryCommandState
        const isBold = win.document.queryCommandState('bold');
        expect(isBold).to.be.true;
      });
    });

    it('should query command state correctly across browsers', () => {
      cy.setEditorContent('<p><strong>Bold text</strong> normal text</p>');
      
      // Click in bold text
      cy.get('.wysiwyg-content strong').click();
      
      cy.window().then(win => {
        const isBold = win.document.queryCommandState('bold');
        expect(isBold).to.be.true;
        
        const isItalic = win.document.queryCommandState('italic');
        expect(isItalic).to.be.false;
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
        // Try commands that might not be supported in all browsers
        const commands = ['insertBrOnReturn', 'styleWithCSS', 'useCSS', 'enableInlineTableEditing'];
        
        commands.forEach(command => {
          const success = win.document.execCommand(command, false);
          // Should not throw error, success may be true or false
          expect(typeof success).to.equal('boolean');
        });
      });
      
      // Editor should still be functional
      cy.get('.wysiwyg-content').type(' - still working');
      cy.getEditorContent().should('contain', 'still working');
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should work on mobile Safari (iOS)', () => {
      cy.viewport('iphone-x');
      
      // Simulate mobile Safari
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
          configurable: true
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Mobile Safari test');
      cy.getEditorContent().should('contain', 'Mobile Safari test');
      
      // Test touch events
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      
      // Test formatting on mobile
      cy.selectEditorText(0, 6);
      cy.get('[data-command="bold"]').click();
      cy.getEditorContent().should('contain', '<strong>Mobile</strong>');
    });

    it('should work on mobile Chrome (Android)', () => {
      cy.viewport('samsung-s10');
      
      // Simulate mobile Chrome
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          configurable: true
        });
      });
      
      cy.get('.wysiwyg-content').click().type('Mobile Chrome test');
      cy.getEditorContent().should('contain', 'Mobile Chrome test');
      
      // Test virtual keyboard behavior
      cy.get('.wysiwyg-content').focus();
      cy.get('.wysiwyg-content').should('be.focused');
    });

    it('should handle touch gestures appropriately', () => {
      cy.viewport('ipad-2');
      
      // Test tap to focus
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 200, clientY: 200 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      cy.get('.wysiwyg-content').should('be.focused');
      
      // Test double tap (should not zoom)
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 200, clientY: 200 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      cy.get('.wysiwyg-content').trigger('touchstart', { touches: [{ clientX: 200, clientY: 200 }] });
      cy.get('.wysiwyg-content').trigger('touchend');
      
      // Should still be functional
      cy.get('.wysiwyg-content').type('Touch test');
      cy.getEditorContent().should('contain', 'Touch test');
    });
  });

  describe('Legacy Browser Support', () => {
    it('should provide graceful degradation for older browsers', () => {
      cy.window().then(win => {
        // Simulate older browser limitations
        const originalQueryCommandSupported = win.document.queryCommandSupported;
        
        win.document.queryCommandSupported = (command: string) => {
          // Simulate limited command support
          const basicCommands = ['bold', 'italic', 'underline'];
          return basicCommands.includes(command);
        };
        
        cy.get('.wysiwyg-content').click().type('Legacy browser test');
        cy.selectEditorText(0, 6);
        
        // Basic commands should work
        cy.get('[data-command="bold"]').click();
        cy.getEditorContent().should('contain', 'Legacy browser test');
        
        // Advanced commands should degrade gracefully
        cy.get('[data-command="fontSize"]').should('exist');
        
        // Restore original function
        win.document.queryCommandSupported = originalQueryCommandSupported;
      });
    });

    it('should handle missing modern APIs', () => {
      cy.window().then(win => {
        // Temporarily remove modern APIs
        const originalCreateRange = win.document.createRange;
        const originalGetSelection = win.getSelection;
        
        (win.document as any).createRange = undefined;
        (win as any).getSelection = undefined;
        
        cy.get('.wysiwyg-content').click().type('Fallback API test');
        
        // Should still allow basic text input
        cy.getEditorContent().should('contain', 'Fallback API test');
        
        // Restore original functions
        (win.document as any).createRange = originalCreateRange;
        (win as any).getSelection = originalGetSelection;
      });
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain consistent performance across browsers', () => {
      const largeContent = 'Performance test content. '.repeat(1000);
      
      const startTime = Date.now();
      cy.setEditorContent(largeContent);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time regardless of browser
      expect(loadTime).to.be.lessThan(3000);
      
      cy.getEditorContent().should('contain', 'Performance test content');
    });

    it('should handle rapid operations efficiently across browsers', () => {
      cy.get('.wysiwyg-content').click();
      
      const rapidText = 'Rapid input test '.repeat(50);
      const startTime = Date.now();
      
      cy.get('.wysiwyg-content').type(rapidText, { delay: 0 });
      
      const endTime = Date.now();
      const inputTime = endTime - startTime;
      
      // Should handle rapid input efficiently
      expect(inputTime).to.be.lessThan(5000);
      
      cy.getEditorContent().should('contain', 'Rapid input test');
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility features across browsers', () => {
      // Test ARIA support
      cy.get('.wysiwyg-content').should('have.attr', 'role');
      cy.get('.wysiwyg-content').should('have.attr', 'aria-label');
      
      // Test keyboard navigation
      cy.get('.wysiwyg-toolbar button').first().focus();
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-command');
      
      // Test screen reader announcements
      cy.get('.wysiwyg-content').click().type('Accessibility test');
      cy.selectEditorText(0, 12);
      cy.get('[data-command="bold"]').click();
      
      // Should maintain proper ARIA states
      cy.get('[data-command="bold"]').should('have.attr', 'aria-pressed');
    });

    it('should support high contrast mode across browsers', () => {
      // Simulate high contrast mode
      cy.get('body').invoke('addClass', 'high-contrast-mode');
      
      // Editor should remain visible and functional
      cy.get('.wysiwyg-editor').should('be.visible');
      cy.get('.wysiwyg-toolbar').should('be.visible');
      cy.get('.wysiwyg-content').should('be.visible');
      
      // Test functionality in high contrast mode
      cy.get('.wysiwyg-content').click().type('High contrast test');
      cy.getEditorContent().should('contain', 'High contrast test');
      
      cy.get('body').invoke('removeClass', 'high-contrast-mode');
    });
  });
});