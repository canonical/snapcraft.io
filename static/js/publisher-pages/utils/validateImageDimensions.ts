function validateImageDimensions(
  imageWidth: number,
  imageHeight: number,
  dimensions: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  }
) {
  return (
    imageWidth >= dimensions.minWidth &&
    imageWidth <= dimensions.maxWidth &&
    imageHeight >= dimensions.minHeight &&
    imageHeight <= dimensions.maxHeight
  );
}

export default validateImageDimensions;
