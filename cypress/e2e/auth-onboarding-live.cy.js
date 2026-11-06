// Opt-in integration coverage for a local app using REAL production SSO/APIs.
// Never creates accounts, accepts agreements, edits profiles or injects cookies.
// Exact exchange-expiry recovery is covered separately by the offline Python
// regression tests; this smoke test does not claim to reproduce live expiry.
const localSmoke = Cypress.env("LOCAL_AUTH_SMOKE") === true;
const interactiveSSO =
  localSmoke &&
  Cypress.env("LIVE_SSO_ONBOARDING") === true &&
  Cypress.config("isInteractive");

function requireLoopbackApp() {
  const base = new URL(Cypress.config("baseUrl"));
  expect(["127.0.0.1", "localhost"]).to.include(base.hostname);
  expect(base.protocol).to.equal("http:");
}

(localSmoke ? describe : describe.skip)(
  "Local authentication boundaries",
  () => {
    beforeEach(requireLoopbackApp);

    it("redirects an anonymous account request to login with its destination", () => {
      cy.request({
        url: "/admin/account",
        followRedirect: false,
        failOnStatusCode: false,
        log: false,
      }).then((response) => {
        expect(response.status).to.equal(302);
        const target = new URL(
          response.headers.location,
          Cypress.config("baseUrl"),
        );
        expect(target.origin).to.equal(
          new URL(Cypress.config("baseUrl")).origin,
        );
        expect(target.pathname).to.equal("/login");
        expect(target.searchParams.get("next")).to.equal("/admin/account");
      });
    });
  },
);

(interactiveSSO ? describe : describe.skip)(
  "Human-assisted production SSO onboarding (preserves unsigned agreement)",
  () => {
    beforeEach(requireLoopbackApp);

    it("returns from real SSO to local onboarding without accepting terms", () => {
      // Fail closed if the human accidentally submits the agreement while
      // paused. This is a write blocker, not a mocked authentication response.
      cy.intercept(
        "POST",
        new URL("/account/agreement", Cypress.config("baseUrl")).href,
        { forceNetworkError: true },
      );
      cy.visit("/admin/account");
      cy.origin("https://login.ubuntu.com", () => {
        cy.location("origin").should("equal", "https://login.ubuntu.com");
        cy.log(
          "Complete real SSO manually. Authorize only the local callback. " +
            "Do not accept the Snap Store agreement. Resume after returning locally.",
        );
        cy.pause();
      });
      cy.location("origin").should(
        "equal",
        new URL(Cypress.config("baseUrl")).origin,
      );
      cy.location("pathname").should("equal", "/account/agreement");
      cy.contains("Developer Programme Agreement").should("be.visible");
      cy.get('input[name="i_agree"]').should("not.be.checked");

      // A fresh never-onboarded account currently has no Store account to
      // exchange against. Preserve this distinction from expired exchange.
      cy.request({
        url: "/admin/account",
        followRedirect: false,
        failOnStatusCode: false,
        log: false,
      })
        .its("status")
        .should("equal", 404);
      cy.get('input[name="i_agree"]').should("not.be.checked");
    });
  },
);
