class HeroTabPanels {
  constructor(mainContainerSelector, categoryList) {
    this.timer = null;
    this.mainContainer = document.querySelector(mainContainerSelector);
    this.categoryList = categoryList;
    this.categories = [];

    if (this.mainContainer) {
      this.panelContainer = this.mainContainer.querySelector(
        "[data-js='panels-container']"
      );
      this.tabs = this.mainContainer.querySelectorAll(
        "[data-js='carousel-tab']"
      );

      if (this.panelContainer) {
        this.initPanels();
      }

      this.initEvents();
    } else {
      throw new Error(`${mainContainerSelector} does not exist`);
    }
  }

  updatePanel(categoryName, snaps) {
    const panel = this.panelContainer.querySelector(
      `[aria-labelledby='${categoryName}-snaps']`
    );
    panel.innerHTML = "";
    snaps.forEach((snap) => {
      const columnDiv = document.createElement("div");
      columnDiv.setAttribute("class", "col-4 u-equal-height");
      columnDiv.innerHTML = `
        <a class="p-media-object p-media-object--snap p-card" href="/${
          snap.package_name
        }" title="${snap.title}${snap.summary ? " – " : ""}${snap.summary}">
          <img src="${snap.icon_url}" alt="${
        snap.title
      }" width="48" height="48" class="p-media-object__image">
          <div class="p-media-object__details">
            <h4 class="p-media-object__title p-heading--5 u-no-margin--bottom">
              ${snap.title}
            </h4>
            <div class="p-media-object__content">
              <p>
                <span class="u-off-screen">Publisher: </span>${snap.publisher}
                <span class="p-verified" title="Verified account">
                  <img src="https://assets.ubuntu.com/v1/75654c90-rosette.svg">
                </span>
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
    clearInterval(this.timer);

    const nextCategoryName = target.getAttribute("aria-controls").split("-")[1];
    const viewAllLinkList = this.mainContainer.querySelectorAll(
      "[data-js='view-all']"
    );
    // Show the appropriate 'View all' link
    viewAllLinkList.forEach((el) => {
      if (el.getAttribute("id") === `view-all-${nextCategoryName}`) {
        el.classList.remove("u-hide");
      } else {
        el.classList.add("u-hide");
      }
    });

    // Remove all current selected tabs
    this.tabs.forEach((tab) => {
      this.draw(0, tab.querySelector(".before"));
      tab.setAttribute("aria-selected", false);
    });

    // Set this tab as selected
    target.setAttribute("aria-selected", true);

    // Hide all tab panels
    Array.from(this.panelContainer.children).forEach((panel) =>
      panel.classList.remove("u-animate--reveal")
    );

    // Show the selected panel
    this.mainContainer
      .querySelector(`#${target.getAttribute("aria-controls")}`)
      .classList.add("u-animate--reveal");

    this.playTab(target);
  }

  draw(timePassed, tab) {
    tab.style.width = timePassed + "%";
  }

  triggerNextTab(tab) {
    let nextTab = tab.nextElementSibling;
    if (!nextTab) {
      nextTab = this.mainContainer.querySelectorAll(
        "[data-js='carousel-tab']"
      )[0];
    }
    this.currentTab = nextTab.getAttribute("id");
    this.changeTabs(nextTab);
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

  playTab(tab) {
    const start = Date.now();
    const duration = 20000;
    const tabIndicator = tab.querySelector(".before");
    const that = this;

    if (tabIndicator) {
      that.timer = setInterval(function () {
        const timePassed = Date.now() - start;
        if (timePassed >= duration) {
          clearInterval(that.timer);
          that.triggerNextTab(tab);
          return;
        }
        that.draw(timePassed / (duration / 100), tabIndicator);
      }, 20);
    }
  }

  initPanels() {
    // Set current tab
    this.currentTab = `${this.categoryList[0].name}-snaps`;
    // Select the inital active tab
    const initalActiveTab = this.mainContainer.querySelector(
      `[data-js='carousel-tab'][aria-selected="true"]`
    );
    this.playTab(initalActiveTab);

    // Fetch the category data
    this.categoryList.forEach((category) => {
      fetch(`/store/featured-snaps/${category.toLowerCase()}`)
        .then((res) => res.json())
        .then((results) => {
          this.categories.push({
            name: category.toLowerCase(),
            snaps: results,
          });
          this.updatePanel(category.toLowerCase(), results);
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  }

  initEvents() {
    const that = this;
    // Add a click event handler to each tab
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", function (e) {
        const target = e.target.closest("[data-js='carousel-tab']");
        that.recordEvent(that.currentTab, target.getAttribute("id"));
        that.changeTabs(target);
      });
    });
  }
}

function init(mainContainerSelector, categoryList) {
  new HeroTabPanels(mainContainerSelector, categoryList);
}

export { init };
