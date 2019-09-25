import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getPhasedState, getFilteredReleaseHistory } from "../selectors";

class ProgressiveReleaseInfo extends Component {
  constructor(props) {
    super(props);

    this.percentageInput = React.createRef();

    this.state = {
      percentage: null
    };
  }

  percentageChangeHandler() {
    const val = this.percentageInput.current.value;
    this.setState({
      percentage: val
    });
  }

  render() {
    const { getPhasedState, filters, filteredReleaseHistory } = this.props;
    const { percentage } = this.state;

    const channel = `${filters.track}/${filters.risk}${
      filters.branch ? `/${filters.branch}` : ""
    }`;

    const phasedState = getPhasedState(channel, filters.arch);

    if (!phasedState) {
      return false;
    }

    const revision_to = filteredReleaseHistory[0].revision;
    const revision_from = phasedState.from;
    const release_percentage = phasedState.percentage;
    return (
      <div className="p-strip is-shallow">
        <h4 className="u-float--left" style={{ maxWidth: "100%" }}>
          Progressive Release from revision <b>{revision_from}</b> to{" "}
          <b>{revision_to}</b> is currently at <b>{release_percentage}%</b>
        </h4>
        <div className="row p-form p-form--inline">
          <div className="col-6">
            <div className="p-form__group">
              <label htmlFor="percentage" className="p-form__label">
                Release to:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                id="percentage"
                name="percentage"
                value={percentage || release_percentage}
                className="p-form__control"
                style={{
                  width: "3rem",
                  minWidth: "3rem"
                }}
                onChange={this.percentageChangeHandler.bind(this)}
                ref={this.percentageInput}
              />
            </div>
          </div>
          <div className="col-6">
            <button className="p-button--positive">Save</button>
            {phasedState.paused && <button className="p-button">Resume</button>}
            {!phasedState.paused && <button className="p-button">Pause</button>}
            <button className="p-button">Revert all to {revision_from}</button>
            <button className="p-button">Advance all to {revision_to}</button>
          </div>
        </div>
      </div>
    );
  }
}

ProgressiveReleaseInfo.propTypes = {
  filters: PropTypes.object,
  getPhasedState: PropTypes.func,
  filteredReleaseHistory: PropTypes.array
};

const mapStateToProps = state => {
  return {
    filters: state.history.filters,
    filteredReleaseHistory: getFilteredReleaseHistory(state),
    getPhasedState: (channel, arch) => getPhasedState(state, channel, arch)
  };
};

export default connect(mapStateToProps)(ProgressiveReleaseInfo);
