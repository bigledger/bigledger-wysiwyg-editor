/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import 'cypress-axe';

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(undefined, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true }
    }
  });
});

// Custom command to inject axe
Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    const script = win.document.createElement('script');
    script.src = '/node_modules/axe-core/axe.min.js';
    win.document.head.appendChild(script);
  });
});

// Custom command to get editor content
Cypress.Commands.add('getEditorContent', () => {
  return cy.get('.wysiwyg-content').invoke('html');
});

// Custom command to set editor content
Cypress.Commands.add('setEditorContent', (content: string) => {
  cy.get('.wysiwyg-content').then(($editor) => {
    $editor[0].innerHTML = content;
    $editor[0].dispatchEvent(new Event('input', { bubbles: true }));
  });
});

// Custom command to select text in editor
Cypress.Commands.add('selectEditorText', (start: number, end: number) => {
  cy.get('.wysiwyg-content').then(($editor) => {
    const editor = $editor[0];
    const textNode = editor.firstChild || editor;
    
    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
});