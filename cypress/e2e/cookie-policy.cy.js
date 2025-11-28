/// <reference types="cypress" />

describe("Test cookie-policy.js bundle on / page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/");
  });

  it("Renders correctly", () => {
    cy.get("dialog.cookie-policy").should("not.be.empty");
  });

  it("Closes when accepting", () => {
    cy.get("#cookie-policy-button-accept-all").click();
    cy.get("dialog.cookie-policy").should("not.exist");
  });

  // TODO: more tests
});
