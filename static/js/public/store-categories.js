import { Swiper, Navigation } from "swiper/dist/js/swiper.esm";
import "whatwg-fetch";
import { CATEGORY_CONFIG } from "../config/swiper.config";

Swiper.use([Navigation]);

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
    new Swiper(
      holder.querySelector(".swiper-container"),
      Object.assign(
        {
          navigation: {
            nextEl: `.swiper-button__next--${category}`,
            prevEl: `.swiper-button__prev--${category}`
          }
        },
        CATEGORY_CONFIG
      )
    );
  };

  const url = `/store/categories/${category}`;

  // Use fetch ¯\_(ツ)_/¯
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw `Response not ok for ${category} category \`${url}\``;
      }
      return response.text();
    })
    .then(writeCategory)
    .catch(error => {
      throw new Error(error);
    });
}

/**
 * Find all .js-store-category elements and fetch the category via js
 */
function storeCategories() {
  const holders = document.querySelectorAll(".js-store-category");

  for (let i = 0; i < holders.length; i++) {
    getCategory(holders[i]);
  }

  new Swiper(
    document.querySelector("#js-snap-carousel-featured"),
    Object.assign(
      {
        navigation: {
          nextEl: `.swiper-button__next--featured`,
          prevEl: `.swiper-button__prev--featured`
        }
      },
      CATEGORY_CONFIG
    )
  );
}

export { storeCategories };
