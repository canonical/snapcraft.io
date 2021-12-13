class HeroTabPanels {
  constructor(mainContainerSelector, categoryList) {
    this.mainContainer = document.querySelector(mainContainerSelector);
    this.categoryList = categoryList;

    if (this.mainContainer) {
      this.panelContainer = this.mainContainer.querySelector(
        "[data-js='panels-container']"
      );
      this.tabs = [].slice.call(
        this.mainContainer.querySelectorAll("[data-js='carousel-tab']")
      );

      if (this.panelContainer) {
        this.initPanels();
      }

      this.handleTabChange();
    } else {
      throw new Error(`${mainContainerSelector} does not exist`);
    }
  }

  updatePanel(categoryName, snaps) {
    const panel = this.panelContainer.querySelector(
      `[aria-labelledby='${categoryName}-snaps']`
    );
    const verifiedAccountBadge = `
      <span class="p-verified" title="Verified account">
        <img src="https://assets.ubuntu.com/v1/75654c90-rosette.svg" alt="">
      </span>
    `;
    panel.innerHTML = "";
    snaps.forEach((snap) => {
      const columnDiv = document.createElement("div");
      columnDiv.setAttribute("class", "col-4 u-equal-height");
      columnDiv.innerHTML = `
        <a class="p-media-object p-media-object--snap p-card" href="/${
          snap.package_name
        }" title="${snap.title}${snap.summary ? " – " : ""}${snap.summary}">


          <img
            src="https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,w_48,h_48/${
              snap.icon_url
            }"
            srcset="https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,w_120,h_120/${
              snap.icon_url
            } 2x"
            alt="${snap.title}"
            loading="eager"
            class="p-snap-heading__icon"
            data-live="icon"
            width="48"
            height="48">

          <div class="p-media-object__details">
            <h3 class="p-media-object__title p-heading--5 u-no-margin--bottom">
              ${snap.title}
            </h3>
            <div class="p-media-object__content">
              <p>
                <span class="u-off-screen">Publisher: </span>${snap.publisher}
                ${
                  snap.developer_validation &&
                  snap.developer_validation === "verified"
                    ? verifiedAccountBadge
                    : ""
                }
              </p>
              <p>${snap.summary}</p>
            </div>
          </div>
        </a>
      `;
      panel.appendChild(columnDiv);
    });
  }

  changeTabs(target) {
    const nextCategoryName = target.getAttribute("aria-controls").split("-")[1];
    const viewAllLinkList = [].slice.call(
      this.mainContainer.querySelectorAll("[data-js='view-all']")
    );
    // Show the appropriate 'View all' link
    viewAllLinkList.forEach((el) => {
      if (el.id === `view-all-${nextCategoryName}`) {
        el.classList.remove("u-hide");
      } else {
        el.classList.add("u-hide");
      }
    });

    // Remove all current selected tabs
    this.tabs.forEach((tab) => {
      tab.setAttribute("aria-selected", false);
    });

    target.setAttribute("aria-selected", true);

    // Hide all tab panels
    Array.from(this.panelContainer.children).forEach((panel) =>
      panel.classList.remove("u-animate--reveal")
    );

    // Show the selected panel
    this.mainContainer
      .querySelector(`#${target.getAttribute("aria-controls")}`)
      .classList.add("u-animate--reveal");
  }

  recordEvent(fromTab, toTab) {
    const { dataLayer } = window;
    if (dataLayer) {
      dataLayer.push({
        event: "GAEvent",
        eventCategory: "carousel",
        eventAction: `from:${fromTab} to:${toTab}`,
        eventLabel: `${toTab}`,
        eventValue: undefined,
      });
    }
  }

  initPanels() {
    // Fetch the category data
    this.categoryList.forEach((category) => {
      fetch(`/store/featured-snaps/${category.toLowerCase()}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error(`${res.status} Failed Fetch`);
          }
        })
        .then((results) => {
          this.updatePanel(category.toLowerCase(), results);
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  }

  handleTabChange() {
    const currentTab = this.tabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true"
    );
    this.currentTab = currentTab.id;
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const target = e.target.closest("[data-js='carousel-tab']");
        this.recordEvent(this.currentTab, target.id);
        this.changeTabs(target);
        this.currentTab = target.id;
      });
    });
  }
}

function init(mainContainerSelector, categoryList) {
  new HeroTabPanels(mainContainerSelector, categoryList);
}

export { init };
