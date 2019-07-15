import Fac from "fast-average-color";

function getColour(holder, imageSelector, imageParentSelector) {
  function extractAndSet(image, parent) {
    const fac = new Fac();
    const colour = fac.getColor(image, { defaultColor: [238, 238, 238] });

    // If the average colour is black, the logo is probably black,
    // se we should invert things. Same for white
    if (colour.hex === "#000000") {
      colour.rgb = "rgb(238,238,238)";
      colour.isDark = false;
      colour.isLight = true;
    } else if (colour.hex === "#ffffff") {
      colour.rgb = "rgb(0,0,0)";
      colour.isDark = true;
      colour.isLight = false;
    }
    parent.style.backgroundColor = colour.rgb;
    parent.classList.remove("is-light");
    parent.classList.add(colour.isDark ? "is-dark" : "is-light");
  }

  if (!holder) {
    return;
  }

  const images = holder.querySelectorAll(imageSelector);
  if (images.length > 0) {
    for (let i = 0, ii = images.length; i < ii; i += 1) {
      const parent = images[i].closest(imageParentSelector);
      if (parent) {
        const image = images[i];
        if (image.complete) {
          extractAndSet(image, parent);
        } else {
          image.addEventListener("load", () => {
            extractAndSet(image, parent);
          });
        }
      }
    }
  }
}

export { getColour };
