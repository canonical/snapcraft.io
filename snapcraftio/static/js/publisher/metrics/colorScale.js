import { COLOR_SCALE } from "./config";

export default function(steps) {
  const start = COLOR_SCALE.start;
  const end = COLOR_SCALE.end;

  const redSteps = (start[0] - end[0]) / steps;
  const greenSteps = (start[1] - end[1]) / steps;
  const blueSteps = (start[2] - end[2]) / steps;

  let colours = [end.slice(0)];

  let i = steps - 1;

  while(i > 0) {
    colours.unshift([
      Math.round(colours[0][0] + redSteps),
      Math.round(colours[0][1] + greenSteps),
      Math.round(colours[0][2] + blueSteps)
    ]);
    i--;
  }

  return colours;
}