import { Swiper, Navigation } from "swiper/dist/js/swiper.esm";
import "whatwg-fetch";
import { CATEGORY_CONFIG } from "../config/swiper.config";
import * as Fac from "fast-average-color";

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

    const srcs = holder.querySelectorAll(".p-media-object--snap__img");
    if (srcs.length > 0) {
      for (let i = 0, ii = srcs.length; i < ii; i += 1) {
        const image = srcs[i];
        image.addEventListener("load", () => {
          const fac = new Fac();
          const colour = fac.getColor(image);
          image.parentNode.style.backgroundColor = colour.rgb;
        });
      }
    }

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
