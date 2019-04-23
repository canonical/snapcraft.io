import "whatwg-fetch";
import * as Fac from "fast-average-color";

function getColour(holder) {
  function extractAndSet(image, parent) {
    const fac = new Fac();
    const colour = fac.getColor(image);
    parent.style.backgroundColor = colour.rgb;
    parent.classList.add(colour.isDark ? "is--dark" : "is--light");
  }

  const srcs = holder.querySelectorAll(".p-generated-featured-snap__icon img");
  if (srcs.length > 0) {
    for (let i = 0, ii = srcs.length; i < ii; i += 1) {
      const parent = srcs[i].closest(".p-generated-featured-snap");
      const image = srcs[i];
      if (image.complete) {
        extractAndSet(image, parent);
      } else {
        image.addEventListener("load", () => {
          extractAndSet(image, parent);
        });
      }
    }
  }
}

/**
 *
 * @param {HTMLElement} holder
 * @returns {Promise<string>}
 */
function getCategory(holder) {
  const category = holder.dataset.category;

  // Write the html and init the carousel
  const writeCategory = function(response) {
    holder.innerHTML = response;

    getColour(holder);
  };

  const url = `/store/categories/${category}`;

  // Use fetch ¯\_(ツ)_/¯
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        return;
      }
      return response.text();
    })
    .then(writeCategory)
    .catch(() => {});
}

/**
 * Find all .js-store-category elements and fetch the category via js
 */
function storeCategories() {
  const featured = document.querySelector("#js-snap-featured");
  getColour(featured);

  const holders = document.querySelectorAll(".js-store-category");

  for (let i = 0; i < holders.length; i++) {
    getCategory(holders[i]);
  }
}

export { storeCategories };
