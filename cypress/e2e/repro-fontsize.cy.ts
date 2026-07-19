describe('Font Size Double-Click Repro', () => {
  beforeEach(() => {
    cy.visit('/demo/toolbar-config');
    cy.wait(3000);
  });

  it('repro font size single click', () => {
    cy.get('.wysiwyg-content').first().click().type('Font size test text');
    cy.wait(500);
    cy.selectEditorText(0, 4);
    cy.wait(500);

    cy.get('[data-command="fontSize"] .wysiwyg-toolbar__dropdown-trigger').click();
    cy.wait(500);
    cy.get('[data-command="fontSize"] .wysiwyg-toolbar__dropdown-option').contains('16px').click();
    cy.wait(500);

    cy.get('.wysiwyg-content').first().invoke('html').then(html => {
      console.log('FONT SIZE 1st click HTML:', html);
    });
  });
});
