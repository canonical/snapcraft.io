const SCREENSHOTS = {
  watchOverflow: true,
  slidesPerView: 2.2,
  navigation: {
    nextEl: `.swiper-button__next`,
    prevEl: `.swiper-button__prev`
  },
  breakpoints: {
    460: {
      slidesPerView: 1.2
    }
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