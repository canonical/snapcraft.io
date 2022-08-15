function validateAspectRatio(
  width: number,
  height: number,
  ratio: { width: number; height: number }
) {
  const aspectRatio = ratio.width / ratio.height;
  const expectedHeight = width / aspectRatio;

  return expectedHeight === height;
}

export default validateAspectRatio;
