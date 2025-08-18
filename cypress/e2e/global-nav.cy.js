/// <reference types="cypress" />

describe("Test about.js bundle on / page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/");
  });

  it("Renders correctly", () => {
    cy.get('.skip-content[role="navigation"]')
      .should("exist")
      .contains("Skip to main content");
  });

  // TODO: more tests
});
