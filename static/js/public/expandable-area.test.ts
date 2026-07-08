import initExpandableArea from "./expandable-area";

describe("expandable area", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("expands a collapsed area", () => {
    document.body.innerHTML = `
      <div data-js="js-show-more" class="p-show-more is-collapsed">
        <div class="p-show-more__fade"></div>
        <a class="p-show-more__link" href="#">Show more</a>
      </div>
    `;

    initExpandableArea("", "");

    document.querySelector<HTMLAnchorElement>(".p-show-more__link")!.click();

    expect(
      document
        .querySelector<HTMLElement>(".p-show-more__fade")!
        .classList.contains("u-hide"),
    ).toBe(true);
    expect(
      document
        .querySelector<HTMLElement>("[data-js='js-show-more']")!
        .classList.contains("is-collapsed"),
    ).toBe(false);
  });

  test("does not bind the expand click without a fade element", () => {
    document.body.innerHTML = `
      <div data-js="js-show-more" class="p-show-more is-collapsed">
        <a class="p-show-more__link" href="#">Show more</a>
      </div>
    `;

    initExpandableArea("", "");

    document.querySelector<HTMLAnchorElement>(".p-show-more__link")!.click();

    expect(
      document
        .querySelector<HTMLElement>("[data-js='js-show-more']")!
        .classList.contains("is-collapsed"),
    ).toBe(true);
  });

  test("removes show-more styling when content does not overflow", () => {
    document.body.innerHTML = `
      <div data-js="js-show-more" class="p-show-more is-collapsed">
        <div class="overflow-content"></div>
        <div class="visible-content"></div>
        <div class="p-show-more__fade"></div>
        <a class="p-show-more__link" href="#">Show more</a>
      </div>
    `;
    const overflowEl =
      document.querySelector<HTMLElement>(".overflow-content")!;
    const visibleEl = document.querySelector<HTMLElement>(".visible-content")!;
    Object.defineProperty(overflowEl, "scrollHeight", { value: 100 });
    Object.defineProperty(visibleEl, "scrollHeight", { value: 100 });

    initExpandableArea(".overflow-content", ".visible-content");

    const container = document.querySelector<HTMLElement>(".is-collapsed")!;

    expect(container.getAttribute("data-js")).toBeNull();
    expect(container.classList.contains("p-show-more")).toBe(false);
  });
});
