import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class ReleasesConfirm extends Component {
  onRevertClick() {
    this.props.clearPendingReleases();
  }

  onApplyClick() {
    this.props.releaseRevisions();
  }

  render() {
    const { pendingReleases, pendingCloses, isLoading } = this.props;
    const releasesCount = Object.keys(pendingReleases).length;
    const closesCount = pendingCloses.length;

    return (
      (releasesCount > 0 || closesCount > 0) && (
        <div className="p-releases-confirm">
          <span className="p-tooltip">
            <i className="p-icon--question" />{" "}
            {releasesCount > 0 && (
              <span>
                {releasesCount} revision
                {releasesCount > 1 ? "s" : ""} to release.
              </span>
            )}{" "}
            {closesCount > 0 && (
              <span>
                {closesCount} channel
                {closesCount > 1 ? "s" : ""} to close.
              </span>
            )}
            <span
              className="p-tooltip__message"
              role="tooltip"
              id="default-tooltip"
            >
              {Object.keys(pendingReleases).map(revId => {
                const release = pendingReleases[revId];

                return (
                  <span key={revId}>
                    {release.revision.version} ({release.revision.revision}){" "}
                    {release.revision.architectures.join(", ")} to{" "}
                    {release.channels.join(", ")}
                    {"\n"}
                  </span>
                );
              })}
              {closesCount > 0 && (
                <span>Close channels: {pendingCloses.join(", ")}</span>
              )}
            </span>
          </span>{" "}
          <div className="p-releases-confirm__buttons">
            <button
              className="p-button--positive is-inline u-no-margin--bottom"
              disabled={isLoading}
              onClick={this.onApplyClick.bind(this)}
            >
              {isLoading ? "Loading..." : "Apply"}
            </button>
            <button
              className="p-button--neutral u-no-margin--bottom"
              onClick={this.onRevertClick.bind(this)}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    );
  }
}

ReleasesConfirm.propTypes = {
  pendingReleases: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,

  releaseRevisions: PropTypes.func.isRequired,
  clearPendingReleases: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    pendingReleases: state.pendingReleases
  };
};

export default connect(mapStateToProps)(ReleasesConfirm);
