import React from "react";
import { connect } from "react-redux";

import { promoteRevision } from "../../actions/pendingReleases";
import { getPendingChannelMap } from "../../selectors";
import { canBeReleased, isInDevmode } from "../../helpers";
import {
  ReleasesReduxState,
  DispatchFn,
  Revision,
  ChannelArchitectureRevisionsMap,
} from "../../../../types/releaseTypes";
import { DraggedItem } from "./types";

interface OwnProps {
  item: DraggedItem;
  risk: string;
  current?: string;
  // These props are passed but not used in component, only in Redux connect
  currentTrack?: string;
  pendingChannelMap?: ChannelArchitectureRevisionsMap;
  promoteRevision?: (revision: Revision, targetChannel: string) => void;
}

interface StateProps {
  currentTrack: string;
  pendingChannelMap: ChannelArchitectureRevisionsMap;
}

interface DispatchProps {
  promoteRevision: (revision: Revision, targetChannel: string) => void;
}

type ReleaseMenuItemProps = OwnProps & StateProps & DispatchProps;

function ReleaseMenuItem(props: ReleaseMenuItemProps) {
  const risk = `${props.currentTrack}/${props.risk}`;
  const devModeRisk = props.risk === "stable" || props.risk === "candidate";
  const hasDevmodeRevisions =
    Object.values(props.item.revisions)
      .filter((v): v is Revision => !!v)
      .some(isInDevmode) && devModeRisk;

  return (
    <span
      key={props.risk}
      className={`p-contextual-menu__link ${
        props.current === risk || hasDevmodeRevisions ? "is-disabled" : ""
      }`}
      onClick={() => {
        props.item.revisions.forEach((r) => {
          return r && canBeReleased(r) && props.promoteRevision(r, risk);
        });
      }}
    >
      {risk}
    </span>
  );
}

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    currentTrack: state.currentTrack,
    pendingChannelMap: getPendingChannelMap(state),
  };
};

const mapDispatchToProps = (dispatch: DispatchFn): DispatchProps => {
  return {
    promoteRevision: (revision: Revision, targetChannel: string) =>
      dispatch(promoteRevision(revision, targetChannel)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleaseMenuItem);
