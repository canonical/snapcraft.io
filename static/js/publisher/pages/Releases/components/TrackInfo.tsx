import { withTooltip, Icon } from "@canonical/react-ds-global";

type TrackInfoProps = {
  versionPattern: string | null;
  automaticPhasingPercentage: number | string | null;
};

export default function TrackInfo({
  versionPattern,
  automaticPhasingPercentage,
}: TrackInfoProps) {
  if (!versionPattern && !automaticPhasingPercentage) return null;

  const progressiveReleases = automaticPhasingPercentage
    ? `Releases will be done progressively on the track and ${automaticPhasingPercentage}% will be incremented automatically.`
    : "";

  const TrackInfoTooltip = withTooltip(
    Icon,
    `The version pattern and the automatic phasing percentage are additional
properties available as options when creating a new track.
${progressiveReleases}`,
  );

  return (
    <p>
      {versionPattern && `Version pattern: ${versionPattern}`}
      {versionPattern && automaticPhasingPercentage && " / "}
      {automaticPhasingPercentage &&
        `Auto. phasing %: ${automaticPhasingPercentage}`}{" "}
      <TrackInfoTooltip icon="information" />
    </p>
  );
}
