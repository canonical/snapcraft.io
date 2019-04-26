import initAccordion, { initAccordionButtons } from "./accordion";

// jsdom (in version that comes with jest) doesn't support .closest
// so we need to polyfill that
// shouldn't be needed when jsdom used by jest is updated to v11.12.0
window.Element.prototype.closest = function(selector) {
  var el = this;
  while (el) {
    if (el.matches(selector)) {
      return el;
    }
    el = el.parentElement;
  }
};

describe("accordion", () => {
  let button1;
  let button2;
  let button3;
  let panel1;
  let panel2;
  let panel3;

  function setupAccordion() {
    const accordionHTML = `
    <div class="p-accordion" role="tablist" aria-multiselect="true">
      <ul class="p-accordion__list">
        <li class="p-accordion__group">
          <button type="button" class="p-accordion__tab" id="tab1" role="tab" aria-controls="#tab1-section" aria-expanded="true">Owner</button>
          <section class="p-accordion__panel" id="tab1-section" role="tabpanel" aria-hidden="false" aria-labelledby="tab1-section">
            <p>Open panel</p>
          </section>
        </li>
        <li class="p-accordion__group">
          <button type="button" class="p-accordion__tab" id="tab2" role="tab" aria-controls="#tab2-section" aria-expanded="false">Status</button>
          <section class="p-accordion__panel" id="tab2-section" role="tabpanel" aria-hidden="true" aria-labelledby="tab2-section">
            <p>Closed panel</p>
          </section>
        </li>
        <li class="p-accordion__group">
          <button type="button" class="p-accordion__tab" id="tab3" role="tab" aria-controls="#tab3-section" aria-expanded="false">Tags</button>
          <section class="p-accordion__panel" id="tab3-section" role="tabpanel" aria-hidden="true" aria-labelledby="tab3-section">
            <p>Closed panel</p>
          </section>
        </li>
      </ul>
    </div>
  `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = accordionHTML;

    button1 = wrapper.querySelector("#tab1");
    button2 = wrapper.querySelector("#tab2");
    button3 = wrapper.querySelector("#tab3");

    panel1 = wrapper.querySelector("#tab1-section");
    panel2 = wrapper.querySelector("#tab2-section");
    panel3 = wrapper.querySelector("#tab3-section");

    document.body.appendChild(wrapper);
  }

  describe("initAccordion", () => {
    beforeEach(() => {
      setupAccordion();
      initAccordion(".p-accordion");
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("should do nothing when clicked on open tab", () => {
      button1.click();

      expect(button1.getAttribute("aria-expanded")).toBe("true");
      expect(panel1.getAttribute("aria-hidden")).toBe("false");
      expect(button2.getAttribute("aria-expanded")).toBe("false");
      expect(panel2.getAttribute("aria-hidden")).toBe("true");
      expect(button3.getAttribute("aria-expanded")).toBe("false");
      expect(panel3.getAttribute("aria-hidden")).toBe("true");
    });

    it("should open panel when clicked on closed tab", () => {
      button2.click();

      expect(button1.getAttribute("aria-expanded")).toBe("false");
      expect(panel1.getAttribute("aria-hidden")).toBe("true");
      expect(button2.getAttribute("aria-expanded")).toBe("true");
      expect(panel2.getAttribute("aria-hidden")).toBe("false");
      expect(button3.getAttribute("aria-expanded")).toBe("false");
      expect(panel3.getAttribute("aria-hidden")).toBe("true");
    });

    it("should do nothing when clicked on disabled tab", () => {
      button3.disabled = true;
      button3.click();

      expect(button1.getAttribute("aria-expanded")).toBe("true");
      expect(panel1.getAttribute("aria-hidden")).toBe("false");
      expect(button2.getAttribute("aria-expanded")).toBe("false");
      expect(panel2.getAttribute("aria-hidden")).toBe("true");
      expect(button3.getAttribute("aria-expanded")).toBe("false");
      expect(panel3.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("initAccordionButtons", () => {
    let continueButton;
    let successEl;

    beforeEach(() => {
      setupAccordion();
      continueButton = document.createElement("button");
      successEl = document.createElement("i");
      successEl.className = "p-icon--success u-hide";
      panel1.appendChild(continueButton);
      panel1.appendChild(successEl);
      initAccordionButtons(continueButton);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("should close current panel and open next one", () => {
      continueButton.click();

      expect(button1.getAttribute("aria-expanded")).toBe("false");
      expect(panel1.getAttribute("aria-hidden")).toBe("true");
      expect(button2.getAttribute("aria-expanded")).toBe("true");
      expect(panel2.getAttribute("aria-hidden")).toBe("false");
    });

    it("should close current panel and open next one", () => {
      continueButton.click();

      expect(successEl.classList.contains("u-hide")).toBe(false);
    });
  });
});
