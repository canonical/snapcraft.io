import React from "react";
import type { Revision } from "../../../types/releaseTypes";

import { isInDevmode } from "../helpers";

interface RevisionLabelProps {
  revision: Revision;
  showTooltip?: boolean;
  isProgressive?: boolean;
  previousRevision?: number;
}

export default function RevisionLabel({
  revision,
  showTooltip,
  isProgressive,
  previousRevision,
}: RevisionLabelProps) {
  let revisionLabel: string | number = revision.revision;

  if (isProgressive) {
    revisionLabel = `${
      previousRevision ? previousRevision : "?"
    } → ${revisionLabel}`;
  }

  if (isInDevmode(revision)) {
    return (
      <span
        className="p-tooltip p-tooltip--btm-center"
        aria-describedby={`revision-devmode-${revision.revision}`}
      >
        {revisionLabel}*
        {showTooltip && (
          <span
            className="p-tooltip__message u-align--center"
            role="tooltip"
            id={`revision-devmode-${revision.revision}`}
          >
            Revisions with{" "}
            {revision.confinement === "devmode"
              ? "devmode confinement"
              : "devel grade"}{" "}
            cannot
            <br />
            be released to stable or candidate channels.
          </span>
        )}
      </span>
    );
  }

  return revisionLabel;
}
