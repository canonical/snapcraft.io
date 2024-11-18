import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { promoteRevision } from "../../actions/pendingReleases";
import { getPendingChannelMap } from "../../selectors";
import { canBeReleased, isInDevmode } from "../../helpers";

function ReleaseMenuItem(props) {
  const risk = `latest/${props.risk}`;
  const devModeRisk = props.risk === "stable" || props.risk === "candidate";
  const hasDevmodeRevisions =
    Object.values(props.item.revisions).some(isInDevmode) && devModeRisk;

  return (
    <span
      key={props.risk}
      className={`p-contextual-menu__link ${
        props.current === risk || hasDevmodeRevisions ? "is-disabled" : ""
      }`}
      onClick={() => {
        props.item.revisions.forEach((r) => {
          return canBeReleased(r) && props.promoteRevision(r, risk);
        });
      }}
    >
      {risk}
    </span>
  );
}

ReleaseMenuItem.propTypes = {
  item: PropTypes.object,
  currentTrack: PropTypes.string.isRequired,
  risk: PropTypes.string,
  pendingChannelMap: PropTypes.object,
  promoteRevision: PropTypes.func,
  current: PropTypes.string,
};

const mapStateToProps = (state) => {
  return {
    currentTrack: state.currentTrack,
    pendingChannelMap: getPendingChannelMap(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    promoteRevision: (revision, targetChannel) =>
      dispatch(promoteRevision(revision, targetChannel)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleaseMenuItem);
