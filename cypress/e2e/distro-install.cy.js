/// <reference types="cypress" />

describe("Test distro-install.js bundle on a distro install page (specifically /install/artikulate/arch)", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/install/artikulate/arch");
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

  it("sets 'window.snapcraft.public.distroInstall'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.distroInstall).to.equal(
        "object",
      );
    });
  });

  it("sets 'window.snapcraft.public.distroInstall.screenshots'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.distroInstall?.screenshots,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.distroInstall.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.distroInstall?.initExpandableArea,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.distroInstall.triggerEventWhenVisible'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.distroInstall
          ?.triggerEventWhenVisible,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.distroInstall.videos'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.distroInstall?.videos).to.equal(
        "function",
      );
    });
  });
});
