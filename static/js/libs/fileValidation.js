function baseRestrictions(file, restrictions) {
  const MB = 1000000;
  const KB = 1000;
  return new Promise((resolve, reject) => {
    const errors = [];
    if (restrictions.accept) {
      if (restrictions.accept.indexOf(file.type) === -1) {
        errors.push("file type is incorrect");
      }
    }

    if (restrictions.size) {
      if (restrictions.size.max && file.size > restrictions.size.max) {
        const sizeInMB = restrictions.size.max / MB;
        const sizeInKB = restrictions.size.max / KB;
        let errorStr;
        if (sizeInMB >= 1) {
          errorStr = `${sizeInMB.toFixed(2)}MB`;
        } else {
          errorStr = `${sizeInKB.toFixed(0)}KB`;
        }
        errors.push(`file size is over ${errorStr}`);
      }
      if (restrictions.size.min && file.size < restrictions.size.min) {
        const sizeInMB = restrictions.size.min / MB;
        const sizeInKB = restrictions.size.min / KB;
        let errorStr;
        if (sizeInMB >= 1) {
          errorStr = `${sizeInMB.toFixed(2)}MB`;
        } else {
          errorStr = `${sizeInKB.toFixed(0)}KB`;
        }
        errors.push(`file size is below ${errorStr}`);
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

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;

      file.meta = {
        width: width,
        height: height
      };

      if (restrictions.whitelist && restrictions.whitelist.dimensions) {
        if (
          width === restrictions.whitelist.dimensions[0] &&
          height === restrictions.whitelist.dimensions[1]
        ) {
          resolve(file);
          return;
        }
      }

      const aspectRatio = width / height;
      file.meta = aspectRatio;
      let hasDimensionError = false;
      if (restrictions.width) {
        if (
          (restrictions.width.max && width > restrictions.width.max) ||
          (restrictions.width.min && width < restrictions.width.min)
        ) {
          hasDimensionError = true;
        }
      }
      if (restrictions.height) {
        if (
          (restrictions.height.max && height > restrictions.height.max) ||
          (restrictions.height.min && height < restrictions.height.min)
        ) {
          hasDimensionError = true;
        }
      }

      if (hasDimensionError) {
        reject([
          `has dimensions ${width} x ${height} pixels. It needs to be at least ${
            restrictions.width.min
          } x ${restrictions.height.min} and at most ${
            restrictions.width.max
          } x ${restrictions.height.max} pixels.`
        ]);
        return;
      }

      let hasAspectError = false;
      if (restrictions.aspectRatio) {
        const aspectRatioMax = restrictions.aspectRatio.max;
        const aspectRatioMin = restrictions.aspectRatio.min;
        if (
          (aspectRatioMax &&
            aspectRatio > aspectRatioMax[0] / aspectRatioMax[1]) ||
          (aspectRatioMin &&
            aspectRatio < aspectRatioMin[0] / aspectRatioMin[1])
        ) {
          hasAspectError = true;
        }

        if (hasAspectError) {
          const min =
            Math.round((aspectRatioMin[0] / aspectRatioMin[1]) * 100) / 100;
          const max =
            Math.round((aspectRatioMax[0] / aspectRatioMax[1]) * 100) / 100;
          const actual = Math.round(aspectRatio * 100) / 100;

          const message = [
            `has a width (${width} pixels) that is ${actual}x its height (${height} pixels).`
          ];

          if (min === max) {
            message.push(`Its width needs to be ${min}x the height.`);
          } else {
            message.push(
              `Its width needs to be between ${min}x and ${max}x the height.`
            );
          }

          reject([message.join(" ")]);
          return;
        }
      }
      resolve(file);
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
