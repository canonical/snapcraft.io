type PackageData = {
  apps: Array<string>;
  architecture: Array<string>;
  developer_id: string;
  developer_name: string;
  developer_validation: string;
  icon_url: string;
  media: Array<{
    height: number;
    type: string;
    url: string;
    width: number;
  }>;
  origin: string;
  package_name: string;
  sections: Array<{ featured: boolean; name: string }>;
  summary: string;
  title: string;
};

async function buildCards(category: string): Promise<void> {
  const featuredSnapCards = document.querySelectorAll(
    "[data-js='featured-snap-card']"
  ) as NodeListOf<HTMLElement>;

  if (window.sessionStorage.getItem(category)) {
    const localData = JSON.parse(
      window.sessionStorage.getItem(category) as string
    );

    featuredSnapCards.forEach((featuredSnapCard, index) => {
      buildCard(featuredSnapCard, localData[index]);
    });
  } else {
    const response = await fetch(`/store/featured-snaps/${category}`);
    const data: Array<PackageData> = await response.json();

    featuredSnapCards.forEach((featuredSnapCard, index) => {
      buildCard(featuredSnapCard, data[index]);
    });

    window.sessionStorage.setItem(category, JSON.stringify(data));
  }
}

function buildCard(featuredSnapCard: Element, data: PackageData) {
  const placeholder = featuredSnapCard.querySelector(
    "[data-js='featured-snap-card-placeholder']"
  ) as HTMLElement;

  const content = featuredSnapCard.querySelector(
    "[data-js='featured-snap-card-content']"
  ) as HTMLElement;

  content.innerHTML = "";

  if ("content" in document.createElement("template")) {
    const template = document.querySelector(
      "#featured-snap-card"
    ) as HTMLTemplateElement;

    const clone = template.content.cloneNode(true) as HTMLElement;

    const snapIcon = clone.querySelector(
      "[data-js='snap-icon']"
    ) as HTMLImageElement;

    const snapIconLink = clone.querySelector(
      "[data-js='snap-icon-link']"
    ) as HTMLLinkElement;

    const snapTitleLink = clone.querySelector(
      "[data-js='snap-title-link']"
    ) as HTMLLinkElement;

    const snapPublisher = clone.querySelector(
      "[data-js='snap-publisher']"
    ) as HTMLElement;

    const snapDescription = clone.querySelector(
      "[data-js='snap-description']"
    ) as HTMLElement;

    snapIcon.src = data.icon_url;
    snapIconLink.href = `/${data.package_name}`;
    snapTitleLink.href = `/${data.package_name}`;
    snapTitleLink.innerText = data.title;
    snapPublisher.innerText = data.developer_name;
    snapDescription.innerText = data.summary;

    const verifiedWrapper = document.createElement("span");
    verifiedWrapper.classList.add("p-verified");

    if (data.developer_validation === "verified") {
      const verifiedBadge = document.createElement("img");
      verifiedBadge.src = "https://assets.ubuntu.com/v1/ba8a4b7b-Verified.svg";
      verifiedBadge.alt = "Verified account";
      verifiedBadge.setAttribute("width", "14");
      verifiedBadge.setAttribute("height", "14");
      verifiedBadge.classList.add("p-star");
      verifiedWrapper.appendChild(verifiedBadge);
      snapPublisher.appendChild(verifiedWrapper);
    }

    if (data.developer_validation === "starred") {
      const starredBadge = document.createElement("img");
      starredBadge.src =
        "https://assets.ubuntu.com/v1/d810dee9-Orange+Star.svg";
      starredBadge.alt = "Star developer";
      starredBadge.setAttribute("width", "14");
      starredBadge.setAttribute("height", "14");
      starredBadge.classList.add("p-star");
      verifiedWrapper.appendChild(starredBadge);
      snapPublisher.appendChild(verifiedWrapper);
    }

    content.appendChild(clone);
  }

  placeholder.classList.add("u-hide");
  content.classList.remove("u-hide");
}

async function init(featuredCategories: Array<string>): Promise<void> {
  const featuredCategorySwitches = document.querySelectorAll(
    "[data-js='featured-category-switch']"
  );

  const viewCategoryLink = document.querySelector(
    "[data-js='view-category-link']"
  ) as HTMLLinkElement;

  featuredCategorySwitches.forEach((featuredCategorySwitch) => {
    featuredCategorySwitch.addEventListener("click", async (e: Event) => {
      e.preventDefault();

      const target = e.target as HTMLLinkElement;
      const category = target.dataset.category?.toLowerCase();
      const previousTargetLink = document.querySelector(
        "[data-js='featured-category-switch'][aria-current='page']"
      );
      const previousTargetTab = document.querySelector(
        "[data-js='featured-category-switch'][aria-selected='true']"
      );

      if (previousTargetLink) {
        previousTargetLink.removeAttribute("aria-current");
      }

      if (previousTargetTab) {
        previousTargetTab.removeAttribute("aria-selected");
      }

      target.setAttribute("aria-current", "page");
      target.setAttribute("aria-selected", "true");

      if (!category) {
        return;
      }

      await buildCards(category);

      viewCategoryLink?.setAttribute("href", `/search?category=${category}`);
      viewCategoryLink.innerText = `View all ${category} snaps`;
    });
  });

  await buildCards(featuredCategories[0].toLowerCase());
}

export { init };
