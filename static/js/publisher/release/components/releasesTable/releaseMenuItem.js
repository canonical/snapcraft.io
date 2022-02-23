import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { promoteRevision } from "../../actions/pendingReleases";
import { getPendingChannelMap } from "../../selectors";
import { canBeReleased } from "../../helpers";

function ReleaseMenuItem(props) {
  return (
    <span
      key={props.risk}
      className="p-contextual-menu__link"
      onClick={() => {
        props.item.revisions.forEach((r) => {
          return (
            canBeReleased(r) && props.promoteRevision(r, `latest/${props.risk}`)
          );
        });
      }}
    >
      latest/{props.risk}
    </span>
  );
}

ReleaseMenuItem.propTypes = {
  item: PropTypes.object,
  currentTrack: PropTypes.string.isRequired,
  risk: PropTypes.string,
  pendingChannelMap: PropTypes.object,
  promoteRevision: PropTypes.func,
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
