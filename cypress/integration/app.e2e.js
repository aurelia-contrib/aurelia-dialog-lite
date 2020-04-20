/// <reference types="Cypress" />

context('The app', () => {
  it('shows hello-world message', () => {
    cy.visit('/');
    cy.get('.hello-world').contains('Hello world from Aurelia!');
  });
});
