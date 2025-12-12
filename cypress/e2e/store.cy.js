/// <reference types="cypress" />

describe("Test store.js bundle on /store page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/store");
    cy.get("#cookie-policy-button-accept-all").click();
  });

  it("Renders correctly", () => {
    cy.get("#root").should("not.be.empty");
  });

  // TODO: more tests
});
