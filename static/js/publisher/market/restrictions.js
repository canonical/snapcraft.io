const MEDIA_RESTRICTIONS = {
  accept: ["image/png", "image/gif", "image/jpeg"],
  width: {
    min: 480,
    max: 3840
  },
  height: {
    min: 480,
    max: 2160
  },
  aspectRatio: {
    min: [1, 2],
    max: [2, 1]
  },
  // MB
  size: {
    min: 0,
    max: 2
  },
  animation: {
    fps: {
      min: 1,
      max: 30
    },
    length: {
      min: 0,
      max: 40
    }
  }
};

export { MEDIA_RESTRICTIONS };
