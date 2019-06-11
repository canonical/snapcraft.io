import React from "react";
import PropTypes from "prop-types";

import { isInDevmode } from "../helpers";

export default function DevmodeIcon({ revision, showTooltip }) {
  return (
    isInDevmode(revision) && (
      <span
        className="p-tooltip p-tooltip--btm-center"
        aria-describedby={`revision-devmode-${revision.revision}`}
      >
        <i className="p-icon--information" />

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
    )
  );
}

DevmodeIcon.propTypes = {
  revision: PropTypes.object.isRequired,
  showTooltip: PropTypes.bool
};
