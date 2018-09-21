import Carousel from "./carousel";
import 'whatwg-fetch';

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
    new Swiper (`.swiper-container.swiper--${category}`, {
      loop: false,
      slidesPerView: 'auto',
      slidesPerGroup: 3,
      navigation: {
        nextEl: `.swiper-button-next--${category}`,
        prevEl: `.swiper-button-prev--${category}`,
      }
    });
  };

  const url = `/store/categories/${category}`;

  // Use fetch ¯\_(ツ)_/¯
  return fetch(url).then(response => {
    if (!response.ok) {
      throw `Response not ok for ${category} category \`${url}\``;
    }
    return response.text();
  }).then(writeCategory).catch(error => {
    throw new Error(error);
  });

}

/**
 * Find all .js-store-category elements and fetch the category via js
 */
function storeCategories() {
  const holders = document.querySelectorAll('.js-store-category');

  for (let i = 0; i < holders.length; i++) {
    getCategory(holders[i]);
  }
}

export { storeCategories };
