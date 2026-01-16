import { ReactNode } from "react";
import type { Revision, Channel } from "../../../types/releaseTypes";

interface ReleaseRowProps {
  type?: string;
  revisionInfo: Revision;
  channel: Channel["name"] | ReactNode;
}

const ReleaseRow = ({ type, revisionInfo, channel }: ReleaseRowProps) => (
  <p>
    <span className="p-tooltip--btm-center">
      {type} <strong>{revisionInfo.revision}</strong> to{" "}
      <span className="p-tooltip__message">
        Version: <b>{revisionInfo.version}</b>
      </span>{" "}
      <strong>{channel}</strong> on{" "}
      <strong>{revisionInfo.architectures.join(", ")}</strong>
    </span>
  </p>
);

export default ReleaseRow;
