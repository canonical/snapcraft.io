/// <reference types="cypress" />

describe("Test featured-snaps.js bundle on / page", () => {
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

  it("sets 'window.snapcraft.public.featuredSnaps'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.featuredSnaps).to.equal(
        "object",
      );
    });
  });

  it("sets 'window.snapcraft.public.featuredSnaps.init'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.featuredSnaps?.init).to.equal(
        "function",
      );
    });
  });
});
