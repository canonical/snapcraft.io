const SCREENSHOTS: {
  freeMode: boolean;
  watchOverflow: boolean;
  slidesPerView: number | "auto" | undefined;
  roundLengths: boolean;
  spaceBetween: number;
  resizeObserver: boolean;
  breakpoints: Record<string, { spaceBetween: number }>;
  navigation: {
    nextEl: string;
    prevEl: string;
  };
} = {
  freeMode: true,
  watchOverflow: true,
  slidesPerView: "auto",
  roundLengths: true,
  spaceBetween: 32,
  resizeObserver: true,
  breakpoints: {
    "620": {
      spaceBetween: 16,
    },
  },
  navigation: {
    nextEl: `.swiper-button__next`,
    prevEl: `.swiper-button__prev`,
  },
};

export { SCREENSHOTS as SCREENSHOTS_CONFIG };
