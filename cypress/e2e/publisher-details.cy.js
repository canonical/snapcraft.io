/// <reference types="cypress" />
describe("Test publisher-details.js bundle on a publisher page (specifically /publisher/jetbrains)", () => {
  beforeEach(function () {
    cy.visit("http://localhost:8004/publisher/jetbrains").then(() => {
      // publisher-details.js is only loaded in templates/store/publisher-details.html,
      // when publisher is "kde", "snapcrafters" or "jetbrains", and when there's a blog_slug
      // attribute in the publisher details context
      const script = cy.$$('script[src*="/publisher-details.js"]');
      if (!script.length) {
        this.skip();
      }
    });
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

  it("sets 'window.snapcraft.public.publisherDetails'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.publisherDetails).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.publisherDetails.snapDetailsPosts'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.publisherDetails?.snapDetailsPosts,
      ).to.equal("function");
    });
  });
});
