export function patchAllCanonicalMobileMarkup() {
  const allCanonicalMobile = document.getElementById("all-canonical-mobile");
  const topMobileSections = allCanonicalMobile?.querySelectorAll(
    ".global-nav__dropdown-toggle",
  );

  topMobileSections?.forEach((section: Element) => {
    const sectionLink = section.querySelector("button.p-navigation__link");
    const sectionHref = sectionLink?.getAttribute("href");

    const sectionLinksList = section.querySelector("ul");
    sectionLinksList?.setAttribute("aria-hidden", "true");

    // add the back button as the first item of the section
    if (sectionHref && sectionLinksList) {
      sectionLinksList.prepend(createBackButtonItem(sectionHref));
    }
  });
}

function createFromHTML(html: string) {
  const div = window.document.createElement("div");
  div.innerHTML = html;
  return div.childNodes[0];
}

function createBackButtonItem(href: string) {
  // remove the # from the href
  const ariaControls = href.slice(1);
  return createFromHTML(`<li class="p-navigation__item--dropdown-close">
      <a href=${href} aria-controls=${ariaControls} class="p-navigation__link js-back-button">
        Back
      </a>
    </li>`);
}
