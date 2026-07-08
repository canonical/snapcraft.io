import "@testing-library/jest-dom";
import {
  collapseDropdown,
  expandDropdown,
  setActiveDropdown,
  setFocusable,
  setListFocusable,
  setupAnimationStart,
} from "../dropdownUtils";

const createNavigationFixture = () => {
  document.body.innerHTML = `
    <nav class="p-navigation p-navigation--sliding">
      <div class="p-navigation__nav">
        <ul class="p-navigation__items js-primary-items">
          <li class="p-navigation__item--dropdown-toggle js-products-item">
            <button
              class="p-navigation__link js-products-toggle"
              aria-controls="products-dropdown"
              aria-expanded="false"
            >
              Products
            </button>
            <ul
              id="products-dropdown"
              class="p-navigation__dropdown js-products-dropdown"
              aria-hidden="true"
            >
              <li>
                <a class="js-product-link" href="/product" tabindex="-1">
                  Product
                </a>
              </li>
              <li class="p-navigation__item--dropdown-toggle js-nested-item">
                <button
                  class="p-navigation__link js-nested-toggle"
                  aria-controls="nested-dropdown"
                  aria-expanded="false"
                  tabindex="-1"
                >
                  Nested
                </button>
                <ul
                  id="nested-dropdown"
                  class="p-navigation__dropdown js-nested-dropdown"
                  aria-hidden="true"
                >
                  <li>
                    <a class="js-nested-link" href="/nested" tabindex="-1">
                      Nested link
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        <ul class="p-navigation__items js-secondary-items">
          <li>
            <a href="/secondary" tabindex="-1">Secondary</a>
          </li>
        </ul>
      </div>
    </nav>
  `;

  return {
    productsToggle: document.querySelector(
      ".js-products-toggle",
    ) as HTMLElement,
    productsItem: document.querySelector(".js-products-item") as HTMLElement,
    productsDropdown: document.querySelector(
      ".js-products-dropdown",
    ) as HTMLElement,
    productLink: document.querySelector(".js-product-link") as HTMLElement,
    nestedToggle: document.querySelector(".js-nested-toggle") as HTMLElement,
    nestedItem: document.querySelector(".js-nested-item") as HTMLElement,
    nestedDropdown: document.querySelector(
      ".js-nested-dropdown",
    ) as HTMLElement,
    nestedLink: document.querySelector(".js-nested-link") as HTMLElement,
    primaryItems: document.querySelector(".js-primary-items") as HTMLElement,
    secondaryItems: document.querySelector(
      ".js-secondary-items",
    ) as HTMLElement,
    navigation: document.querySelector(".p-navigation") as HTMLElement,
  };
};

describe("dropdownUtils", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  describe("setActiveDropdown", () => {
    test("sets active state on a dropdown toggle and top-level list", () => {
      const { productsToggle, productsItem, primaryItems, secondaryItems } =
        createNavigationFixture();

      setActiveDropdown(productsToggle);

      expect(productsItem).toHaveClass("is-active");
      expect(productsItem).toHaveClass("is-selected");
      expect(productsToggle).toHaveAttribute("aria-expanded", "true");
      expect(productsToggle).toHaveClass("is-selected");
      expect(primaryItems).toHaveClass("is-active");
      expect(secondaryItems).toHaveClass("u-hide");

      setActiveDropdown(productsToggle, false);

      expect(productsItem).not.toHaveClass("is-active");
      expect(productsItem).not.toHaveClass("is-selected");
      expect(productsToggle).toHaveAttribute("aria-expanded", "false");
      expect(productsToggle).not.toHaveClass("is-selected");
      expect(primaryItems).not.toHaveClass("is-active");
      expect(secondaryItems).not.toHaveClass("u-hide");
    });

    test("sets active state on the parent dropdown for nested toggles", () => {
      const { nestedToggle, nestedItem, productsDropdown } =
        createNavigationFixture();

      setActiveDropdown(nestedToggle);

      expect(nestedItem).toHaveClass("is-active");
      expect(productsDropdown).toHaveClass("is-active");

      setActiveDropdown(nestedToggle, false);

      expect(nestedItem).not.toHaveClass("is-active");
      expect(productsDropdown).not.toHaveClass("is-active");
    });
  });

  test("setListFocusable makes direct list item controls focusable", () => {
    const { productsDropdown, productLink, nestedToggle } =
      createNavigationFixture();

    setListFocusable(productsDropdown);

    expect(productLink).toHaveAttribute("tabindex", "0");
    expect(nestedToggle).toHaveAttribute("tabindex", "0");
  });

  test("setFocusable handles list and wrapper targets", () => {
    const { productsDropdown, productLink, nestedLink, navigation } =
      createNavigationFixture();

    setFocusable(productsDropdown);
    expect(productLink).toHaveAttribute("tabindex", "0");

    setFocusable(navigation);
    expect(nestedLink).toHaveAttribute("tabindex", "0");
  });

  test("expandDropdown opens the target dropdown and enables focus", () => {
    const { productsToggle, productsDropdown, productsItem, productLink } =
      createNavigationFixture();

    expandDropdown(productsToggle, productsDropdown);

    expect(productsDropdown).toHaveAttribute("aria-hidden", "false");
    expect(productsItem).toHaveClass("is-active");
    expect(productLink).toHaveAttribute("tabindex", "0");
  });

  test("collapseDropdown closes the target dropdown and deactivates toggle", () => {
    const { productsToggle, productsDropdown, productsItem } =
      createNavigationFixture();

    expandDropdown(productsToggle, productsDropdown);
    collapseDropdown(productsToggle, productsDropdown);

    expect(productsDropdown).toHaveAttribute("aria-hidden", "true");
    expect(productsItem).not.toHaveClass("is-active");
    expect(productsToggle).toHaveAttribute("aria-expanded", "false");
  });

  test("setupAnimationStart toggles animation class for each toggle parent", () => {
    vi.useFakeTimers();
    const { productsToggle, nestedToggle, productsItem, nestedItem } =
      createNavigationFixture();

    setupAnimationStart([productsToggle, nestedToggle], 333);

    expect(productsItem).toHaveClass("js-animation-playing");
    expect(nestedItem).toHaveClass("js-animation-playing");

    vi.advanceTimersByTime(333);

    expect(productsItem).not.toHaveClass("js-animation-playing");
    expect(nestedItem).not.toHaveClass("js-animation-playing");
  });
});
