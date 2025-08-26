/// <reference types="cypress" />

describe("Test fsf.js bundle on /first-snap page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8004/first-snap");
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

  it("sets 'window.snapcraft.public.fsf'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.fsf).to.equal("object");
    });
  });

  it("sets 'window.snapcraft.public.fsf.initAccordion'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.fsf?.initAccordion).to.equal(
        "function",
      );
    });
  });

  it("sets 'window.snapcraft.public.fsf.initExpandableArea'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.initExpandableArea,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.fsf.initFSFLanguageSelect'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.initFSFLanguageSelect,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.fsf.firstSnapFlow'", () => {
    cy.window().then((window) => {
      expect(typeof window?.snapcraft?.public?.fsf?.firstSnapFlow).to.equal(
        "object",
      );
    });
  });

  it("sets 'window.snapcraft.public.fsf.firstSnapFlow.initChooseName'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.firstSnapFlow?.initChooseName,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.fsf.firstSnapFlow.initRegisterName'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.firstSnapFlow?.initRegisterName,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.fsf.firstSnapFlow.install'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.firstSnapFlow?.install,
      ).to.equal("function");
    });
  });

  it("sets 'window.snapcraft.public.fsf.firstSnapFlow.push'", () => {
    cy.window().then((window) => {
      expect(
        typeof window?.snapcraft?.public?.fsf?.firstSnapFlow?.push,
      ).to.equal("function");
    });
  });
});
