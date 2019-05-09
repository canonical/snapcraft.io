import "whatwg-fetch";
import { getColour } from "../libs/colours";

const IMAGE_SELECTOR = ".p-featured-snap__icon img";
const IMAGE_PARENT_SELECTOR = ".p-featured-snap";

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

    getColour(holder, IMAGE_SELECTOR, IMAGE_PARENT_SELECTOR);
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
  if (featured) {
    getColour(featured, IMAGE_SELECTOR, IMAGE_PARENT_SELECTOR);
  }

  const holders = document.querySelectorAll(".js-store-category");

  for (let i = 0; i < holders.length; i++) {
    getCategory(holders[i]);
  }
}

export { storeCategories };
