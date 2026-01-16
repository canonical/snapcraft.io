import React from "react";
import { connect } from "react-redux";

import { getArchitectures } from "../../selectors";
import { isSameVersion } from "../../helpers";
import ReleasesTableRevisionCell from "./revisionCell";
import ReleasesTableRow from "./row";
import {
  ReleasesReduxState,
  CPUArchitecture,
  ArchitectureRevisionsMap,
} from "../../../../types/releaseTypes";

interface OwnProps {
  risk: string;
  revisions: ArchitectureRevisionsMap;
  buildRequestId?: string;
}

interface StateProps {
  currentTrack: string;
  archs: CPUArchitecture[];
}

type ReleasesTableRevisionsRowProps = OwnProps & StateProps;

// releases table row based on list of revisions (unrelated to channel map)
const ReleasesTableRevisionsRow = (props: ReleasesTableRevisionsRowProps) => {
  const { currentTrack, risk, revisions, archs, buildRequestId } = props;
  const showVersion = !isSameVersion(revisions);

  return (
    <>
      <p
        className="p-heading--5  u-hide--medium u-hide--large"
        style={{ marginBottom: "0.5rem" }}
      >
        {buildRequestId}
      </p>
      <div className="p-releases-table__row--container">
        <ReleasesTableRow risk={risk} revisions={revisions} canDrag={true}>
          {archs.map((arch) => {
            return (
              <ReleasesTableRevisionCell
                key={`${currentTrack}/${risk}/${arch}`}
                revision={revisions ? revisions[arch] : null}
                showVersion={showVersion}
                arch={arch}
              />
            );
          })}
        </ReleasesTableRow>
      </div>
    </>
  );
};

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    currentTrack: state.currentTrack,
    archs: getArchitectures(state),
  };
};

export default connect(mapStateToProps)(ReleasesTableRevisionsRow);
