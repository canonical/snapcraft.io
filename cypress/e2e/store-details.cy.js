/// <reference types="cypress" />

describe("Test store-details.js bundle on a details page (specifically /artikulate)", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/artikulate");
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

  it("sets 'window.snapcraft.public.storeDetails'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.storeDetails).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.map'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.storeDetails?.map).to.equal(
        "function",
      );
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.screenshots'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.storeDetails?.screenshots,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.channelMap'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.storeDetails?.channelMap,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.snapDetailsPosts'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.storeDetails?.snapDetailsPosts,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.initEmbeddedCardModal'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.storeDetails?.initEmbeddedCardModal,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.storeDetails?.initExpandableArea,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.initReportSnap'", () => {
    cy.window().then((window) => {
      expect(
        typeof window.snapcraft.public.storeDetails.initReportSnap,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.storeDetails.videos'", () => {
    cy.window().then((window) => {
      expect(typeof window.snapcraft.public.storeDetails.videos).to.equal(
        "function",
      );
    });
  });
});
