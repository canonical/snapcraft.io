import "@testing-library/jest-dom";
import { patchAllCanonicalMobileMarkup } from "../globalNav";

describe("patchAllCanonicalMobileMarkup", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("adds hidden state and back buttons to mobile global nav sections", () => {
    document.body.innerHTML = `
      <div id="all-canonical-mobile">
        <div class="global-nav__dropdown-toggle js-section-one">
          <button class="p-navigation__link" href="#section-one">
            Section one
          </button>
          <ul>
            <li><a href="/one">One</a></li>
          </ul>
        </div>
        <div class="global-nav__dropdown-toggle js-section-two">
          <button class="p-navigation__link" href="#section-two">
            Section two
          </button>
          <ul>
            <li><a href="/two">Two</a></li>
          </ul>
        </div>
      </div>
    `;

    patchAllCanonicalMobileMarkup();

    const sectionOneList = document.querySelector(
      ".js-section-one ul",
    ) as HTMLUListElement;
    const sectionTwoList = document.querySelector(
      ".js-section-two ul",
    ) as HTMLUListElement;
    const sectionOneBackButton =
      sectionOneList.firstElementChild as HTMLElement;
    const sectionOneBackLink = sectionOneBackButton.querySelector("a");
    const sectionTwoBackLink = sectionTwoList.querySelector(
      ":scope > .p-navigation__item--dropdown-close a",
    );

    expect(sectionOneList).toHaveAttribute("aria-hidden", "true");
    expect(sectionTwoList).toHaveAttribute("aria-hidden", "true");
    expect(sectionOneBackButton).toHaveClass(
      "p-navigation__item--dropdown-close",
    );
    expect(sectionOneBackLink).toHaveTextContent("Back");
    expect(sectionOneBackLink).toHaveAttribute("href", "#section-one");
    expect(sectionOneBackLink).toHaveAttribute("aria-controls", "section-one");
    expect(sectionOneBackLink).toHaveClass("p-navigation__link");
    expect(sectionOneBackLink).toHaveClass("js-back-button");
    expect(sectionTwoBackLink).toHaveAttribute("href", "#section-two");
    expect(sectionTwoBackLink).toHaveAttribute("aria-controls", "section-two");
  });

  test("skips missing or incomplete mobile global nav markup", () => {
    patchAllCanonicalMobileMarkup();
    expect(document.body).toBeEmptyDOMElement();

    document.body.innerHTML = `
      <div id="all-canonical-mobile">
        <div class="global-nav__dropdown-toggle js-no-list">
          <button class="p-navigation__link" href="#no-list">No list</button>
        </div>
        <div class="global-nav__dropdown-toggle js-no-href">
          <button class="p-navigation__link">No href</button>
          <ul>
            <li><a href="/item">Item</a></li>
          </ul>
        </div>
      </div>
    `;

    patchAllCanonicalMobileMarkup();

    const noHrefList = document.querySelector(
      ".js-no-href ul",
    ) as HTMLUListElement;

    expect(noHrefList).toHaveAttribute("aria-hidden", "true");
    expect(
      document.querySelector(".p-navigation__item--dropdown-close"),
    ).not.toBeInTheDocument();
  });
});
