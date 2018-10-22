import React, { Component } from "react";
import PropTypes from "prop-types";

const notificationStyle = (element = "", modifier = "") => {
  element = element ? "__" + element : "";
  modifier = modifier ? "--" + modifier : "";

  const className = `p-notification${element}${modifier}`;

  return className;
};

export default class Notification extends Component {
  render() {
    const { status, appearance, onRemoveClick } = this.props;

    const className = notificationStyle("", appearance);

    return (
      <div className={className}>
        <p className={notificationStyle("response")}>
          {status && this.getStatus(this.props.status)}
          {this.props.children}
        </p>
        {onRemoveClick && (
          <button
            className="p-icon--close"
            aria-label="Close notification"
            onClick={onRemoveClick}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  getStatus(status) {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return <span className={notificationStyle("status")}>{statusString}:</span>;
  }
}

Notification.propTypes = {
  children: PropTypes.node,
  appearance: PropTypes.oneOf([
    "positive",
    "caution",
    "negative",
    "information"
  ]),
  status: PropTypes.string,
  onRemoveClick: PropTypes.func
};
