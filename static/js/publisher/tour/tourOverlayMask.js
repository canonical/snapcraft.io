import React from "react";
import PropTypes from "prop-types";

const getClipPathFromMask = ({ top, bottom, left, right }) => {
  let mask = [
    `${left}px ${top}px`,
    `${left}px ${bottom}px`,
    `${right}px ${bottom}px`,
    `${right}px ${top}px`,
    `${left}px ${top}px`
  ].join(",");

  return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${mask})`;
};

export default function TourOverlayMask({ mask }) {
  let maskStyle = {};

  if (mask) {
    const clipPath = getClipPathFromMask(mask);
    maskStyle = {
      clipPath,
      WebkitClipPath: clipPath
    };
  }

  return <div className="p-tour-overlay__mask" style={maskStyle} />;
}

TourOverlayMask.propTypes = {
  mask: PropTypes.shape({
    top: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number
  })
};
