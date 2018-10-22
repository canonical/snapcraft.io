const SCREENSHOTS = {
  freeMode: true,
  watchOverflow: true,
  slidesPerView: "auto",
  spaceBetween: 16,
  navigation: {
    nextEl: `.swiper-button__next`,
    prevEl: `.swiper-button__prev`
  }
};

const CATEGORY = {
  watchOverflow: true,
  slidesPerView: 5,
  breakpoints: {
    768: {
      slidesPerView: 4
    },
    620: {
      slidesPerView: 2
    },
    320: {
      slidesPerView: 1
    }
  }
};

export { SCREENSHOTS as SCREENSHOTS_CONFIG, CATEGORY as CATEGORY_CONFIG };
