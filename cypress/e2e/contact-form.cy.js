/// <reference types="cypress" />

const BASE = "http://localhost:8004";
const MARKETO_SUBMIT = "https://ubuntu.com/marketo/submit";

// Mirrors ubuntu.com/marketo/submit: success redirects to returnURL as-is,
// failure redirects to the returnURL page with #contact-form-fail
function mockUbuntuSubmit(result = "success", delay = 0) {
  cy.intercept("POST", MARKETO_SUBMIT, (req) => {
    const returnURL = new URL(new URLSearchParams(req.body).get("returnURL"));
    // The full page returns to production; stay on the local server
    const local = new URL(returnURL.pathname + returnURL.search, BASE);
    local.hash = returnURL.hash;
    if (result === "fail") {
      local.search = "";
      local.hash = "contact-form-fail";
    }
    req.reply({
      statusCode: 302,
      headers: { location: local.href },
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

function openPopup(path = "/") {
  cy.visit(`${BASE}${path}`);
  cy.get("footer").contains("a", "Contact us").click();
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
        "https://snapcraft.io/about/thank-you#contact-form-success",
      );
      // Form 2639 has no acquisition_url field; Marketo skips leads that send it
      expect(fields.has("acquisition_url")).to.equal(false);
      expect(fields.get("_cookies_accepted")).to.equal("essential");
      expect(fields.get("phone")).to.equal("");
    });
    cy.location("pathname").should("eq", "/about/thank-you");
    cy.contains("h1", "Thanks for contacting us");
    cy.contains("h2", "A member of our team will be in touch shortly.");
  });

  it("Sends no State, even for the US", () => {
    mockUbuntuSubmit();
    openPopup();

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      cy.get('select[name="country"]').select("US");
      cy.get('[name="State"]').should("not.exist");
      cy.get('[type="submit"]').click();
    });

    cy.wait("@marketoSubmit").then(({ request }) => {
      // ubuntu.com moves country out of the lead, so Marketo rejects any State
      expect(new URLSearchParams(request.body).has("State")).to.equal(false);
    });
  });

  it("Footer link opens the pop-up, then success", () => {
    mockUbuntuSubmit();
    openPopup();
    cy.location("pathname").should("eq", "/");
    cy.get("#contact-form-modal").should("be.visible");

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      cy.get('[type="submit"]').click();
    });

    cy.wait("@marketoSubmit").then(({ request }) => {
      const fields = new URLSearchParams(request.body);
      expect(fields.get("returnURL")).to.equal(`${BASE}/#contact-form-success`);
    });
    cy.location("pathname").should("eq", "/");
    cy.get("#contact-form-modal")
      .should("be.visible")
      .and("contain", "Thanks for contacting us")
      .and("contain", "A member of our team will be in touch shortly.");
    cy.get("#contact-form-modal .js-contact-success").within(() => {
      cy.get("h2").should("not.exist");
      cy.contains("h3", "Thanks for contacting us");
    });

    cy.location("hash").should("eq", "");
    cy.reload();
    cy.get("#contact-form-modal").should("not.be.visible");
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
    openPopup();

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
    cy.then(() => {
      expect(requests).to.equal(0);
    });
  });

  it("Send button while sending", () => {
    mockUbuntuSubmit("success", 3000);
    openPopup();

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      // Check before Cypress waits for the next page to load
      cy.get('[type="submit"]').then(($button) => {
        $button[0].click();
        expect($button[0].disabled).to.equal(true);
        expect($button[0].textContent).to.contain("Submitting…");
      });
    });
  });

  function expectRefilled() {
    cy.get('input[name="firstName"]').should("have.value", "Test");
    cy.get('input[name="email"]').should("have.value", "test.user@example.com");
    cy.get('select[name="country"]').should("have.value", "NL");
    cy.get('textarea[name="Comments_from_lead__c"]').should(
      "have.value",
      "Hello",
    );
  }

  it("Pop-up, ubuntu.com returns #contact-form-fail", () => {
    mockUbuntuSubmit("fail");
    openPopup();

    cy.get("#contact-form-modal").within(() => {
      fillForm();
      cy.get('[type="submit"]').click();
    });

    cy.wait("@marketoSubmit");
    cy.location("pathname").should("eq", "/");
    cy.get("#contact-form-modal")
      .should("be.visible")
      .and(
        "contain",
        "There was an error while sending your message. Please try again.",
      );
    // The error sits above the refilled form, with no extra step
    cy.get("#contact-form-modal").within(() => {
      cy.contains("button", "Try again").should("not.exist");
      expectRefilled();
    });

    cy.location("hash").should("eq", "");
    cy.get("#contact-form-modal .p-modal__close").click();
    cy.get("footer").contains("a", "Contact us").click();
    cy.get("#contact-form-modal").within(expectRefilled);

    openPopup();
    cy.get('#contact-form-modal input[name="firstName"]').should(
      "have.value",
      "",
    );
    cy.get("#contact-form-modal .js-contact-error").should("not.be.visible");
  });

  it("Full page, ubuntu.com returns #contact-form-fail", () => {
    mockUbuntuSubmit("fail");
    cy.visit(`${BASE}/about/contact-us`);

    fillForm();
    cy.get(`form[action="${MARKETO_SUBMIT}"] [type="submit"]`).click();

    cy.wait("@marketoSubmit");
    cy.location("pathname").should("eq", "/about/contact-us");
    cy.contains(
      "There was an error while sending your message. Please try again.",
    ).should("be.visible");
    expectRefilled();
    cy.location("hash").should("eq", "");

    // Opening the page normally starts empty
    cy.visit(`${BASE}/about/contact-us`);
    cy.get('input[name="firstName"]').should("have.value", "");
  });

  function sendFromLandingLink(consent) {
    cy.setCookie("_cookies_accepted", consent);
    mockUbuntuSubmit();
    openPopup(
      "/?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_content=ad1&utm_term=snaps&gclid=g123&fbclid=f456",
    );
    cy.get("#contact-form-modal").within(() => {
      fillForm();
      cy.get('[type="submit"]').click();
    });
    return cy
      .wait("@marketoSubmit")
      .then((interception) => new URLSearchParams(interception.request.body));
  }

  const TRACKING = {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "spring",
    utm_content: "ad1",
    utm_term: "snaps",
    GCLID__c: "g123",
    Facebook_Click_ID__c: "f456",
  };

  it("Cookies accepted", () => {
    sendFromLandingLink("all").then((body) => {
      Object.entries(TRACKING).forEach(([name, value]) => {
        expect(body.get(name), name).to.equal(value);
      });
      expect(body.get("_cookies_accepted")).to.equal("all");
      expect(body.get("preferredLanguage")).to.not.equal("");
    });
  });

  it("Cookies rejected", () => {
    sendFromLandingLink("essential").then((body) => {
      Object.keys(TRACKING).forEach((name) => {
        expect(body.get(name) || "", name).to.equal("");
      });
      expect(body.get("_cookies_accepted")).to.equal("essential");
      expect(body.has("acquisition_url")).to.equal(false);
      expect(body.get("returnURL")).to.equal(`${BASE}/#contact-form-success`);
    });
  });

  it("IoT category page links", () => {
    const IOT_CONTACT =
      "https://ubuntu.com/internet-of-things/contact-us?product=appstore";
    cy.visit(`${BASE}/iot`);

    cy.get(`a[href="${IOT_CONTACT}"]`)
      .should("have.length", 2)
      .each(($link) => {
        expect($link.attr("data-js")).to.not.equal("contact-form-trigger");
      });

    cy.get("footer").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/iot");
    cy.get("#contact-form-modal").should("be.visible");
  });

  it("Pop-up keyboard use", () => {
    const footerLink = "footer a[data-js='contact-form-trigger']";
    cy.visit(`${BASE}/`);
    cy.get(footerLink).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.focused().should("have.attr", "role", "dialog");
    cy.get("#contact-form-modal [role=dialog]").should(
      "have.attr",
      "aria-modal",
      "true",
    );
    cy.get("#contact-form-modal [role=dialog]")
      .invoke("attr", "aria-labelledby")
      .then((id) => {
        cy.get(`#${id}`).should("have.text", "Contact us");
      });

    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.class", "p-modal__close");
    cy.focused().trigger("keydown", { key: "Tab", shiftKey: true });
    cy.focused().should("have.attr", "type", "submit");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.class", "p-modal__close");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.attr", "name", "firstName");

    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get("#contact-form-modal").should("not.be.visible");
    cy.focused().should("match", footerLink);

    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get("#contact-form-modal .p-modal__close").click();
    cy.get("#contact-form-modal").should("not.be.visible");
    cy.focused().should("match", footerLink);
  });

  it("Footer link on the contact page stays on the page", () => {
    cy.visit(`${BASE}/about/contact-us`);
    cy.get("footer").contains("a", "Contact us").click();
    cy.location("pathname").should("eq", "/about/contact-us");
    cy.get("#contact-form-modal").should("not.exist");
  });
});
