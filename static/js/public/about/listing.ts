// Empty export to mark this file as a module.
export {};

const listingTabLinks = document.querySelectorAll(
  "[data-js='listing-tabs-link']"
);
const listingTabs = document.querySelectorAll("[data-js='listing-tab']");
const previousTabButton = document.querySelector(
  "[data-js='previous-tab-button']"
) as HTMLButtonElement;
const nextTabButton = document.querySelector(
  "[data-js='next-tab-button']"
) as HTMLButtonElement;
const listingTabsSelect = document.querySelector(
  "[data-js='listing-tabs-select']"
) as HTMLSelectElement;

let currentTabIndex = 0;

listingTabLinks.forEach((listingTabLink, index) => {
  listingTabLink.addEventListener("click", (e) => {
    e.preventDefault();

    const listingTabId = listingTabLink.getAttribute("href") as string;
    const listingTab = document.querySelector(listingTabId) as HTMLElement;

    deselectPreviousTab();
    togglePreviousTabButtonState(index);
    toggleNextTabButtonState(index);
    selectCurrentTab(listingTab);

    currentTabIndex = index;
  });
});

listingTabsSelect.addEventListener("change", (e) => {
  const target = e.target as HTMLSelectElement;
  const nextTabId = target.value;
  const listingTab = document.querySelector(nextTabId) as HTMLElement;
  const options = Array.prototype.slice.call(
    listingTabsSelect.options
  ) as Array<HTMLOptionElement>;
  const optionIndex = options.findIndex((option) => {
    return option.value === nextTabId;
  });

  deselectPreviousTab();
  togglePreviousTabButtonState(optionIndex);
  toggleNextTabButtonState(optionIndex);
  selectCurrentTab(listingTab);

  currentTabIndex = optionIndex;
});

const selectCurrentTab = (tab: HTMLElement) => {
  const nextTabId = tab.id;
  const currentListingTabLink = document.querySelector(
    `[data-js='listing-tabs-link'][href='#${nextTabId}']`
  ) as HTMLLinkElement;
  currentListingTabLink.setAttribute("aria-current", "page");
  listingTabsSelect.value = `#${nextTabId}`;
  tab.classList.remove("u-hide");
};

const deselectPreviousTab = () => {
  const previousListingTabLink = document.querySelector(
    "[data-js='listing-tabs-link'][aria-current='page']"
  ) as HTMLLinkElement;
  const previousListingTabId = previousListingTabLink.getAttribute(
    "href"
  ) as string;
  const previousListingTab = document.querySelector(
    previousListingTabId
  ) as HTMLElement;
  previousListingTab.classList.add("u-hide");
  previousListingTabLink.removeAttribute("aria-current");
};

const showNextTabPanel = () => {
  const nextTabIndex = currentTabIndex + 1;

  togglePreviousTabButtonState(nextTabIndex);
  toggleNextTabButtonState(nextTabIndex);
  deselectPreviousTab();
  selectCurrentTab(listingTabs[nextTabIndex] as HTMLElement);

  if (nextTabIndex <= listingTabs.length - 1) {
    currentTabIndex = nextTabIndex;
  }
};

const showPreviousTabPanel = () => {
  const previousTabIndex = currentTabIndex - 1;

  togglePreviousTabButtonState(previousTabIndex);
  toggleNextTabButtonState(previousTabIndex);
  deselectPreviousTab();
  selectCurrentTab(listingTabs[previousTabIndex] as HTMLElement);

  if (previousTabIndex >= 0) {
    currentTabIndex = previousTabIndex;
  }
};

const togglePreviousTabButtonState = (index: number) => {
  if (index === 0) {
    previousTabButton.disabled = true;
  } else {
    previousTabButton.disabled = false;
  }
};

const toggleNextTabButtonState = (index: number) => {
  if (index === listingTabs.length - 1) {
    nextTabButton.disabled = true;
  } else {
    nextTabButton.disabled = false;
  }
};

previousTabButton.addEventListener("click", () => {
  showPreviousTabPanel();
});

nextTabButton.addEventListener("click", () => {
  showNextTabPanel();
});
