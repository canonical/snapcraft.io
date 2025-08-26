/// <reference types="cypress" />

describe("Test about.js bundle on /about/publish page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/about/publish");
  });

  it("sets 'window.snapcraft'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.about'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.about).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.about.initFSFLanguageSelect'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.about?.initFSFLanguageSelect).to.equal(
        "function",
      );
    });
  });

  it("sets 'window.snapcraft.about.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.about?.initExpandableArea).to.equal(
        "function",
      );
    });
  });
});
