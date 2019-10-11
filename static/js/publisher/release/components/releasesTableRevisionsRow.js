import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getArchitectures } from "../selectors";
import { isSameVersion } from "../helpers";
import { ReleasesTableRevisionCell } from "./releasesTableCell";
import ReleasesTableRow from "./releasesTableRow";

const ReleasesTableRevisionsRow = props => {
  const { currentTrack, risk, revisions, archs } = props;
  const showVersion = !isSameVersion(revisions);

  return (
    <ReleasesTableRow risk={risk} revisions={revisions}>
      {archs.map(arch => {
        return (
          <ReleasesTableRevisionCell
            key={`${currentTrack}/${risk}/${arch}`}
            revision={revisions ? revisions[arch] : null}
            showVersion={showVersion}
          />
        );
      })}
    </ReleasesTableRow>
  );
};

ReleasesTableRevisionsRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  revisions: PropTypes.object,

  // state
  currentTrack: PropTypes.string.isRequired,
  archs: PropTypes.array.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    archs: getArchitectures(state)
  };
};

export default connect(mapStateToProps)(ReleasesTableRevisionsRow);
