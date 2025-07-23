import { formatDuration } from "date-fns";

function formatDurationString(duration?: string): string {
  if (!duration) {
    return "-";
  }

  const durationParts = duration.split(":");

  return formatDuration({
    hours: parseInt(durationParts[0]),
    minutes: parseInt(durationParts[1]),
    seconds: Math.floor(parseInt(durationParts[2])),
  });
}

export default formatDurationString;
