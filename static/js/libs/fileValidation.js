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

function imageWhitelistHandler(file, image, whitelist) {
  const errors = whitelist.filter(whitelistItem => {
    if (whitelistItem.fileName) {
      let fileName = file.name.split(".");
      fileName = fileName.slice(0, fileName.length - 1).join(".");
      if (fileName !== whitelistItem.fileName) {
        return false;
      }
    }
    if (whitelistItem.accept) {
      if (!whitelistItem.accept.includes(file.type)) {
        return false;
      }
    }
    if (whitelistItem.dimensions) {
      if (
        image.naturalWidth !== whitelistItem.dimensions[0] ||
        image.naturalHeight !== whitelistItem.dimensions[1]
      ) {
        return false;
      }
    }
    return true;
  });

  return errors.length > 0;
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

      if (
        restrictions.whitelist &&
        imageWhitelistHandler(file, image, restrictions.whitelist)
      ) {
        resolve(file);
        return;
      }

      const aspectRatio = width / height;
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

        const allowedRatios = [];

        if (aspectRatioMax) {
          allowedRatios.push(aspectRatioMax[0] / aspectRatioMax[1]);
        }
        if (aspectRatioMin) {
          allowedRatios.push(aspectRatioMin[0] / aspectRatioMin[1]);
        }

        allowedRatios.sort();

        if (
          (allowedRatios.length === 1 && aspectRatio !== allowedRatios[0]) ||
          (aspectRatio > allowedRatios[1] || aspectRatio < allowedRatios[0])
        ) {
          hasAspectError = true;
        }

        if (hasAspectError) {
          const min = aspectRatioMin[1] / aspectRatioMin[0];
          const max = aspectRatioMax[1] / aspectRatioMax[0];

          const message = [
            `(${width} x ${height} pixels) does not have the correct aspect ratio:`
          ];

          // If the min and max are the same we only accept 1 aspect ratio
          if (min === max) {
            message.push(
              `it needs to be ${aspectRatioMin[0]}:${aspectRatioMin[1]}`
            );

            const suggestedSize = [height / max];

            if (restrictions.width) {
              if (suggestedSize[0] > restrictions.width.max) {
                suggestedSize[0] = restrictions.width.max;
              }
            }

            suggestedSize.push(suggestedSize[0] * max);

            message.push(
              `(e.g., ${Math.round(suggestedSize[0])} x ${Math.round(
                suggestedSize[1]
              )} pixels)`
            );

            // Otherwise it's a range
          } else {
            message.push(
              `it needs to be between ${aspectRatioMin[0]}:${
                aspectRatioMin[1]
              } and ${aspectRatioMax[0]}:${aspectRatioMax[1]}`
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
