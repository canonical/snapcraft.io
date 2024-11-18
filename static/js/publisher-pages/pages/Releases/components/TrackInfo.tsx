import { Tooltip } from "@canonical/react-components";

type TrackInfoProps = {
  versionPattern: string | null;
  automaticPhasingPercentage: string | null;
};

export default function TrackInfo({
  versionPattern,
  automaticPhasingPercentage,
}: TrackInfoProps) {

  if (!versionPattern && !automaticPhasingPercentage) return null;

  const progressiveReleases = automaticPhasingPercentage
    ? `Releases will be done progressively on the track and ${automaticPhasingPercentage}% will be incremented automatically.`
    : "";

  return (
    <p>
      {versionPattern && `Version pattern: ${versionPattern}`}
      {versionPattern && automaticPhasingPercentage && " / "}
      {automaticPhasingPercentage &&
        `Auto. phasing %: ${automaticPhasingPercentage}`}{" "}
      <Tooltip
        autoAdjust
        message={`The version pattern and the automatic phasing percentage are additional
properties available as options when creating a new track.
${progressiveReleases}`}
      >
        <i className="p-icon--information" />
      </Tooltip>
    </p>
  );
}
