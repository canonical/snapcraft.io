type SnapcraftGlobal = typeof globalThis & {
  snapcraft?: {
    public?: {
      modal?: {
        init: () => void;
      };
    };
  };
};

describe("modal", () => {
  beforeAll(async () => {
    delete (globalThis as SnapcraftGlobal).snapcraft;
    await import("./modal");
    (globalThis as SnapcraftGlobal).snapcraft!.public!.modal!.init();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    document.body.style.position = "";
  });

  afterAll(() => {
    delete (globalThis as SnapcraftGlobal).snapcraft;
  });

  test("opens and closes a controlled modal", () => {
    document.body.innerHTML = `
      <button data-js-toggle-modal aria-controls="test-modal">Open</button>
      <div id="test-modal" class="p-modal" style="display: none"></div>
    `;
    const button = document.querySelector<HTMLButtonElement>("button")!;
    const modal = document.querySelector<HTMLElement>("#test-modal")!;

    button.click();

    expect(modal.style.display).toBe("flex");
    expect(document.body.style.position).toBe("fixed");

    button.click();

    expect(modal.style.display).toBe("none");
    expect(document.body.style.position).toBe("relative");
  });

  test("closes a modal when the overlay is clicked", () => {
    document.body.innerHTML = `
      <div id="test-modal" class="p-modal" style="display: flex"></div>
    `;
    const modal = document.querySelector<HTMLElement>("#test-modal")!;

    modal.click();

    expect(modal.style.display).toBe("none");
    expect(document.body.style.position).toBe("relative");
  });

  test("ignores clicks outside modal controls", () => {
    document.body.innerHTML = `
      <button>Ignore</button>
      <div id="test-modal" class="p-modal" style="display: none"></div>
    `;

    document.querySelector<HTMLButtonElement>("button")!.click();

    expect(
      document.querySelector<HTMLElement>("#test-modal")!.style.display,
    ).toBe("none");
    expect(document.body.style.position).toBe("");
  });
});
