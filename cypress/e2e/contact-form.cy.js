/// <reference types="cypress" />

const BASE = "http://localhost:8004";
const MARKETO_SUBMIT = "https://ubuntu.com/marketo/submit";

// Mirrors ubuntu.com/marketo/submit: success redirects to returnURL as-is,
// failure redirects to the returnURL page with #contact-form-fail
function mockUbuntuSubmit(result = "success", delay = 0) {
  cy.intercept("POST", MARKETO_SUBMIT, (req) => {
    const returnURL = new URL(new URLSearchParams(req.body).get("returnURL"));
    if (result === "fail") {
      returnURL.search = "";
      returnURL.hash = "contact-form-fail";
    }
    req.reply({
      statusCode: 302,
      headers: { location: returnURL.href },
      delay,
    });
  }).as("marketoSubmit");
}

// Cypress cannot turn JS off, so strip scripts and inline handlers from HTML
function disableJavaScript() {
  cy.intercept({ method: "GET", url: `${BASE}/**` }, (req) => {
    req.on("response", (res) => {
      const type = res.headers["content-type"] || "";
      if (type.includes("text/html") && typeof res.body === "string") {
        const doc = new DOMParser().parseFromString(res.body, "text/html");
        doc.querySelectorAll("script").forEach((script) => script.remove());
        doc.querySelectorAll("*").forEach((element) => {
          Array.from(element.attributes)
            .filter((attribute) => attribute.name.startsWith("on"))
            .forEach((attribute) => element.removeAttribute(attribute.name));
        });
        res.body = `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
      }
    });
  });
}

function fillForm() {
  cy.get('input[name="firstName"]').type("Test");
  cy.get('input[name="lastName"]').type("User");
  cy.get('input[name="email"]').type("test.user@example.com");
  cy.get('select[name="country"]').select("NL");
  cy.get('input[name="company"]').type("Example Ltd");
  cy.get('input[name="title"]').type("Engineer");
  cy.get('textarea[name="Comments_from_lead__c"]').type("Hello");
}

describe("Contact form", () => {
  beforeEach(() => {
    // Hide the cookie banner, which covers the footer
    cy.setCookie("_cookies_accepted", "essential");
  });

  it("No JS, full page success", () => {
    disableJavaScript();
    mockUbuntuSubmit();
    cy.visit(`${BASE}/`);

    cy.get("footer").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/about/contact-us");
    fillForm();
    cy.get('form [type="submit"]').click();

    cy.wait("@marketoSubmit").then(({ request }) => {
      const fields = new URLSearchParams(request.body);
      expect(fields.get("formid")).to.equal("2639");
      expect(fields.get("returnURL")).to.equal(
        `${BASE}/about/thank-you#contact-form-success`,
      );
      expect(fields.get("acquisition_url")).to.equal(
        `${BASE}/about/contact-us`,
      );
      expect(fields.get("_cookies_accepted")).to.equal("essential");
      expect(fields.get("phone")).to.equal("");
    });
    cy.location("pathname").should("eq", "/about/thank-you");
    cy.contains("h1", "Thanks for contacting us");
  });

  it("Footer link opens the pop-up, then success", () => {
    mockUbuntuSubmit();
    cy.visit(`${BASE}/`);

    cy.get("footer").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/");
    cy.get("#contact-form-modal").should("be.visible");
    cy.window().then((win) => {
      const events = (win.dataLayer || []).map((entry) => entry.event);
      expect(events).to.include("contact_form_opened");
    });

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      // Check before Cypress waits for the next page to load
      cy.get('[type="submit"]').then(($button) => {
        $button[0].click();
        const win = $button[0].ownerDocument.defaultView;
        const events = (win.dataLayer || []).map((entry) => entry.event);
        expect(events).to.include("contact_form_submitted");
      });
    });

    cy.wait("@marketoSubmit").then(({ request }) => {
      const fields = new URLSearchParams(request.body);
      expect(fields.get("returnURL")).to.equal(`${BASE}/#contact-form-success`);
    });
    cy.location("pathname").should("eq", "/");
    cy.location("hash").should("eq", "#contact-form-success");
    cy.get("#contact-form-modal")
      .should("be.visible")
      .and("contain", "Thanks for contacting us")
      .and("contain", "A member of our team will be in touch shortly.");
    cy.window().then((win) => {
      const events = (win.dataLayer || []).map((entry) => entry.event);
      expect(events).to.include("contact_form_success");
    });
  });

  it("Snap page and empty search links", () => {
    cy.visit(`${BASE}/node-red`);
    cy.contains("a", "Snaps and IoT").click();
    cy.location("pathname").should("eq", "/node-red");
    cy.get("#contact-form-modal").should("be.visible");

    cy.visit(`${BASE}/search?q=zzqqxxnotasnap`);
    cy.contains("h2", "Still no luck?");
    cy.get("main").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/search");
    cy.get("#contact-form-modal").should("be.visible");
  });

  it("Required field missing", () => {
    let requests = 0;
    cy.intercept("POST", MARKETO_SUBMIT, () => {
      requests += 1;
    });
    cy.visit(`${BASE}/`);
    cy.get("footer").contains("a", "Contact us").click();

    cy.get("#contact-form-modal").within(() => {
      cy.get('[type="submit"]').click();

      // be.visible misreports inside the scrolling fixed-position modal
      cy.get("[required]").each(($field) => {
        cy.wrap($field)
          .should("have.attr", "aria-invalid", "true")
          .closest(".p-form-validation")
          .should("have.class", "is-error")
          .find(".p-form-validation__message")
          .should("have.css", "display", "block")
          .and("not.be.empty")
          .invoke("attr", "id")
          .then((id) => {
            cy.wrap($field).should("have.attr", "aria-describedby", id);
          });
      });
      cy.get('input[name="phone"]')
        .closest(".p-form-validation")
        .should("not.have.class", "is-error");
      cy.focused().should("have.attr", "name", "firstName");
      cy.get('[type="submit"]').should("not.be.disabled");

      cy.get('input[name="firstName"]').type("Test", { force: true });
      cy.get('input[name="firstName"]').should("not.have.attr", "aria-invalid");
      cy.get('input[name="firstName"]')
        .closest(".p-form-validation")
        .should("not.have.class", "is-error");
    });

    cy.get("#contact-form-modal").should("be.visible");
    cy.window().then((win) => {
      const events = (win.dataLayer || []).map((entry) => entry.event);
      expect(events).not.to.include("contact_form_submitted");
      expect(requests).to.equal(0);
    });
  });

  it("Send button while sending", () => {
    mockUbuntuSubmit("success", 3000);
    cy.visit(`${BASE}/`);
    cy.get("footer").contains("a", "Contact us").click();

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      // Check before Cypress waits for the next page to load
      cy.get('[type="submit"]').then(($button) => {
        $button[0].click();
        expect($button[0].disabled).to.equal(true);
      });
    });
  });

  it("Pop-up, ubuntu.com returns #contact-form-fail", () => {
    mockUbuntuSubmit("fail");
    cy.visit(`${BASE}/`);
    cy.get("footer").contains("a", "Contact us").click();

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      cy.get('[type="submit"]').click();
    });

    cy.wait("@marketoSubmit");
    cy.location("pathname").should("eq", "/");
    cy.location("hash").should("eq", "#contact-form-fail");
    cy.get("#contact-form-modal")
      .should("be.visible")
      .and(
        "contain",
        "There was an error while sending your message. Please try again.",
      );
    cy.window().then((win) => {
      const events = (win.dataLayer || []).map((entry) => entry.event);
      expect(events).to.include("contact_form_failed");
    });

    cy.get("#contact-form-modal").contains("button", "Try again").click();
    cy.get("#contact-form-modal").within(() => {
      cy.get('input[name="firstName"]').should("have.value", "Test");
      cy.get('input[name="email"]').should(
        "have.value",
        "test.user@example.com",
      );
      cy.get('select[name="country"]').should("have.value", "NL");
      cy.get('textarea[name="Comments_from_lead__c"]').should(
        "have.value",
        "Hello",
      );
    });
  });

  it("Full page, ubuntu.com returns #contact-form-fail", () => {
    mockUbuntuSubmit("fail");
    cy.visit(`${BASE}/about/contact-us`);

    fillForm();
    cy.get(`form[action="${MARKETO_SUBMIT}"] [type="submit"]`).click();

    cy.wait("@marketoSubmit");
    cy.location("pathname").should("eq", "/about/contact-us/error");
    cy.contains(
      "There was an error while sending your message. Please try again.",
    );
    cy.window().then((win) => {
      const events = (win.dataLayer || []).map((entry) => entry.event);
      expect(events).to.include("contact_form_failed");
    });

    cy.contains("a", "Try again").click();
    cy.location("pathname").should("eq", "/about/contact-us");
    cy.get('input[name="firstName"]').should("have.value", "Test");
    cy.get('select[name="country"]').should("have.value", "NL");
    cy.get('textarea[name="Comments_from_lead__c"]').should(
      "have.value",
      "Hello",
    );
  });

  it("Footer link on the contact page stays on the page", () => {
    cy.visit(`${BASE}/about/contact-us`);
    cy.get("footer").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/about/contact-us");
    cy.get("#contact-form-modal").should("not.exist");
  });
});
