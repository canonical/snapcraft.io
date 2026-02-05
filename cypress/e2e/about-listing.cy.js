/// <reference types="cypress" />

describe("Test about-listing.js bundle on /about/listing page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/about/listing");
    cy.get("#cookie-policy-button-accept-all").click();
  });

  it("Sets event listeners on tabs in desktop layout", () => {
    cy.viewport(1440, 900);

    cy.get("[data-js='listing-tabs-link']").each((tabLink) => {
      const href = tabLink.attr("href");
      cy.wrap(tabLink).click();
      cy.get(href).should("be.visible");
    });
  });

  it("Sets event listeners on tab dropdown in mobile layout", () => {
    cy.viewport(480, 800);

    cy.get("[data-js='listing-tabs-select']").then((_dropdown) => {
      const dropdown = cy.wrap(_dropdown);

      cy.get("[data-js='listing-tabs-select'] option").each((option, i) => {
        dropdown.select(i);
        cy.get(option.val()).should("be.visible");
      });
    });
  });
});
