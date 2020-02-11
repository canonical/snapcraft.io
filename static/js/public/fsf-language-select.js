import debounce from "../libs/debounce";

function initFSFLanguageSelect(rootEl) {
  const flowLinks = [].slice.call(rootEl.querySelectorAll(".p-flow-link"));
  const flowDetails = [].slice.call(
    rootEl.querySelectorAll("[data-flow-details]")
  );

  const closeDetails = () => {
    flowDetails.forEach(e => e.classList.add("u-hide"));
    flowLinks.forEach(l => l.classList.remove("is-open"));
    if (window.history.pushState) {
      window.history.pushState(null, null, "#");
    } else {
      window.location.hash = "";
    }
  };

  // reset expandable yaml files to being truncated
  const resetExpandableYaml = () => {
    const showMoreContainer = [].slice.call(
      document.querySelectorAll("[data-js='js-show-more']")
    );

    if (showMoreContainer && showMoreContainer.length > 0) {
      showMoreContainer.forEach(el => {
        const fadeEL = el.querySelector(".p-show-more__fade");

        if (fadeEL) {
          fadeEL.classList.remove("u-hide");
          el.classList.add("is-collapsed");
        }
      });
    }
  };

  const openDetails = link => {
    if (link && link.dataset.flowLink) {
      // find where the next row of links starts to insert details panel before
      var top = link.offsetTop;

      var nextRow = null;
      for (
        var i = flowLinks.indexOf(link);
        i < flowLinks.length && !nextRow;
        i++
      ) {
        if (flowLinks[i].offsetTop > top) {
          nextRow = flowLinks[i];
        }
      }
      const isOpen = link.classList.contains("is-open");

      resetExpandableYaml();

      closeDetails();

      if (!isOpen) {
        // find the end of the row of icons to place details panel properly
        var details = rootEl.querySelector(
          `[data-flow-details='${link.dataset.flowLink}']`
        );

        if (nextRow) {
          const nextRowCol = nextRow.parentNode;
          nextRowCol.parentNode.insertBefore(details, nextRowCol);
        } else {
          rootEl.appendChild(details);
        }
        details.classList.remove("u-hide");
        link.classList.add("is-open");
        window.location.hash = link.dataset.flowLink;
      } else {
        link.classList.remove("is-open");
        window.location.hash = "";
      }

      const viewportOffset = link.getBoundingClientRect().top;

      window.scrollTo({
        top: viewportOffset + window.scrollY,
        behaviour: "smooth"
      });
    }
  };

  rootEl.addEventListener("click", event => {
    var link = event.target.closest(".p-flow-link");

    if (link) {
      openDetails(link);
      event.preventDefault();
    }
  });

  // if there is a hash in URL that corresponds to one of the languages
  // open given language section (for example /first-snap#python)
  const hash = window.location.hash.slice(1);
  const link = rootEl.querySelector(`[data-flow-link='${hash}']`);
  if (link) {
    openDetails(link);
  }

  const onResize = debounce(closeDetails, 500);
  window.addEventListener("resize", onResize);
}

export { initFSFLanguageSelect };
