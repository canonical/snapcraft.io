function baseRestrictions(file, restrictions) {
  return new Promise((resolve, reject) => {
    const errors = [];
    if (restrictions.accept) {
      if (restrictions.accept.indexOf(file.type) === -1) {
        errors.push("File type is incorrect");
      }
    }

    if (restrictions.size) {
      if (restrictions.size.max && file.size > restrictions.size.max) {
        errors.push(`File size is over ${restrictions.size.max}MB`);
      }
      if (restrictions.size.min && file.size < restrictions.size.min) {
        errors.push(`File size is below ${restrictions.size.min}MB`);
      }
    }

    if (errors.length > 0) {
      reject(errors);
    } else {
      resolve(file);
    }
  });
}

function imageRestrictions(file, restrictions) {
  return new Promise((resolve, reject) => {
    if (!restrictions.accept || restrictions.accept[0].indexOf("image") < 0) {
      resolve(file);
      return;
    }

    const errors = [];
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const aspectRatio = width / height;
      if (restrictions.width) {
        if (restrictions.width.max && width > restrictions.width.max) {
          errors.push(`Image width above ${restrictions.width.max} pixels`);
        }
        if (restrictions.width.min && width < restrictions.width.min) {
          errors.push(`Image width below ${restrictions.width.min} pixels`);
        }
      }
      if (restrictions.height) {
        if (restrictions.height.max && height > restrictions.height.max) {
          errors.push(`Image height above ${restrictions.height.max} pixels`);
        }
        if (restrictions.height.min && height < restrictions.height.min) {
          errors.push(`Image height below ${restrictions.height.min} pixels`);
        }
      }
      if (restrictions.aspectRatio) {
        const aspectRatioMax = restrictions.aspectRatio.max;
        const aspectRatioMin = restrictions.aspectRatio.min;
        if (
          aspectRatioMax &&
          aspectRatio > aspectRatioMax[0] / aspectRatioMax[1]
        ) {
          errors.push(
            `Image aspect ratio is above ${aspectRatioMax[0]}:${
              aspectRatioMax[1]
            }`
          );
        }
        if (
          aspectRatioMin &&
          aspectRatio < aspectRatioMin[0] / aspectRatioMin[1]
        ) {
          errors.push(
            `Image aspect ratio is below ${aspectRatioMin[0]}:${
              aspectRatioMin[1]
            }`
          );
        }
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(file);
      }
    });

    image.src = url;
  });
}

function validateRestrictions(file, restrictions) {
  return new Promise(resolve => {
    baseRestrictions(file, restrictions)
      .then(file => imageRestrictions(file, restrictions))
      .then(resolve)
      .catch(errors => {
        file.errors = errors;
        resolve(file);
      });
  });
}

export { validateRestrictions };
