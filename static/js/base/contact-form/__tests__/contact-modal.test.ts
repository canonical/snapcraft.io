import { setupContactModal } from "../contact-modal";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

function render() {
  document.body.innerHTML = `
    <a id="link" href="/about/contact-us" data-js="contact-form-trigger">Contact us</a>
    <div class="p-modal u-hide js-contact-modal">
      <section role="dialog" tabindex="-1">
        <button class="js-contact-modal-close">Close</button>
        <div class="js-contact-form-panel"></div>
        <div class="js-contact-success" hidden></div>
      </section>
    </div>
  `;
  setupContactModal();
  return {
    link: document.getElementById("link") as HTMLAnchorElement,
    modal: document.querySelector(".js-contact-modal") as HTMLElement,
  };
}

function click(link: HTMLElement, modifiers: MouseEventInit = {}) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  let prevented = false;
  // Runs after the pop-up's own listener; also stops jsdom following the link
  window.addEventListener(
    "click",
    (e) => {
      prevented = e.defaultPrevented;
      e.preventDefault();
    },
    { once: true },
  );
  link.dispatchEvent(event);
  return prevented;
}

describe("Contact pop-up", () => {
  it("opens from a plain click on the link", () => {
    const { link, modal } = render();

    expect(click(link)).toBe(true);
    expect(modal.classList).not.toContain("u-hide");
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
    "leaves a %o click to the browser",
    (modifiers) => {
      const { link, modal } = render();

      expect(click(link, modifiers)).toBe(false);
      expect(modal.classList).toContain("u-hide");
    },
  );

  it("closes with the Close button", () => {
    const { link, modal } = render();
    click(link);

    (document.querySelector(".js-contact-modal-close") as HTMLElement).click();

    expect(modal.classList).toContain("u-hide");
  });
});
