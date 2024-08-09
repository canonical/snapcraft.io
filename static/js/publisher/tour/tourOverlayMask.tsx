import { ReactNode } from "react";

type Props = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const getClipPathFromMask = ({ top, bottom, left, right }: Props): string => {
  let mask = [
    `${left}px ${top}px`,
    `${left}px ${bottom}px`,
    `${right}px ${bottom}px`,
    `${right}px ${top}px`,
    `${left}px ${top}px`,
  ].join(",");

  return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${mask})`;
};

export default function TourOverlayMask({
  mask,
}: {
  mask: Props | null;
}): ReactNode {
  let maskStyle = {};

  if (mask) {
    const clipPath = getClipPathFromMask(mask);
    maskStyle = {
      clipPath,
      WebkitClipPath: clipPath,
    };
  }

  return <div className="p-tour-overlay__mask" style={maskStyle} />;
}
