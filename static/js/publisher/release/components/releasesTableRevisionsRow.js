import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { ReleasesTableRevisionCell } from "./releasesTableCell";

import ReleasesTableRow from "./releasesTableRow";

const ReleasesTableRevisionsRow = props => {
  const { currentTrack, risk, revisions } = props;

  return (
    <ReleasesTableRow risk={risk} revisions={revisions}>
      {({ arch, hasSameVersion }) => {
        return (
          <ReleasesTableRevisionCell
            key={`${currentTrack}/${risk}/${arch}`}
            revision={revisions ? revisions[arch] : null}
            showVersion={!hasSameVersion}
          />
        );
      }}
    </ReleasesTableRow>
  );
};

ReleasesTableRevisionsRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  revisions: PropTypes.object,

  // state
  currentTrack: PropTypes.string.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack
  };
};

export default connect(mapStateToProps)(ReleasesTableRevisionsRow);
