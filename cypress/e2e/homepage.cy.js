/// <reference types="cypress" />

describe("Test homepage.js bundle on / page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/");
  });

  it("sets 'window.snapcraft'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.homepage'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.homepage).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.homepage.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.homepage?.initExpandableArea,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.homepage.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.homepage?.initFSFLanguageSelect,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.homepage.nps'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.homepage?.nps).to.equal(
        "function",
      );
    });
  });
});
