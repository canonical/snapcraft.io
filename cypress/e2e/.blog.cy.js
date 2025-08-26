/// <reference types="cypress" />

describe("Test blog.js bundle on /blog page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/blog");
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

  it("sets 'window.snapcraft.public.blog'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.blog).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.blog.newsletter'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.blog?.newsletter).to.equal(
        "function",
      );
    });
  });
});
