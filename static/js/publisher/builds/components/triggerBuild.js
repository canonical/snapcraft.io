import React, { Fragment } from "react";
import PropTypes from "prop-types";

import Notification from "@canonical/react-components/dist/components/Notification";

class TriggerBuild extends React.Component {
  constructor(props) {
    super(props);
  }

  renderError(errorMessage) {
    return (
      <div className="u-fixed-width">
        <Notification type="negative" status="Error:">
          {errorMessage
            ? errorMessage
            : "There was an error triggering a new build. Please try again."}
        </Notification>
      </div>
    );
  }

  render() {
    const { hasError, errorMessage, isLoading, onClick } = this.props;

    return (
      <Fragment>
        <div className="u-fixed-width u-clearfix">
          <h4 className="u-float-left">Latest builds</h4>
          {isLoading ? (
            <button
              className="p-button--neutral u-float-right has-icon"
              disabled
            >
              <i className="p-icon--spinner u-animation--spin" />
              <span>Requesting</span>
            </button>
          ) : (
            <button
              className="p-button--neutral u-float-right"
              onClick={onClick}
            >
              Trigger new build
            </button>
          )}
        </div>
        {hasError && this.renderError(errorMessage)}
      </Fragment>
    );
  }
}

TriggerBuild.propTypes = {
  hasError: PropTypes.bool,
  errorMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func
};

export { TriggerBuild as default };
