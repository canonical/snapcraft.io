import React from "react";
import PropTypes from "prop-types";

import { isInDevmode } from "../helpers";

export default function DevmodeRevision({ revision, showTooltip }) {
  if (isInDevmode(revision)) {
    return (
      <span
        className="p-tooltip p-tooltip--btm-center"
        aria-describedby={`revision-devmode-${revision.revision}`}
      >
        {revision.revision}*
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

  return revision.revision;
}

DevmodeRevision.propTypes = {
  revision: PropTypes.object.isRequired,
  showTooltip: PropTypes.bool
};
