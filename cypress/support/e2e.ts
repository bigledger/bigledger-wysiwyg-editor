// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  return false;
});

// Add custom commands for accessibility testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to check accessibility
       * @example cy.checkA11y()
       */
      checkA11y(): Chainable<Element>;
      
      /**
       * Custom command to inject axe for accessibility testing
       * @example cy.injectAxe()
       */
      injectAxe(): Chainable<Element>;
      
      /**
       * Custom command to get editor content
       * @example cy.getEditorContent()
       */
      getEditorContent(): Chainable<Element>;
      
      /**
       * Custom command to set editor content
       * @example cy.setEditorContent('<p>Hello World</p>')
       */
      setEditorContent(content: string): Chainable<Element>;
      
      /**
       * Custom command to select text in editor
       * @example cy.selectEditorText(0, 5)
       */
      selectEditorText(start: number, end: number): Chainable<Element>;
    }
  }
}