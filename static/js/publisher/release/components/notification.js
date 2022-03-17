import React, { Component } from "react";
import PropTypes from "prop-types";

const notificationStyle = (element = "", modifier = "") => {
  element = element ? "__" + element : "";
  modifier = modifier ? "--" + modifier : "";

  const className = `p-notification${element}${modifier}`;

  return className;
};

class Notification extends Component {
  render() {
    const {
      status,
      appearance,
      canDismiss,
      hideNotification,
      children,
    } = this.props;
    const className = notificationStyle("", appearance);

    return (
      <div className={className}>
        <div className={notificationStyle("content")}>
          {status && this.getStatus(this.props.status)}
          <div className="p-notification__message">{children}</div>
        </div>
        {canDismiss && (
          <button
            className="p-icon--close"
            aria-label="Close notification"
            onClick={hideNotification}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  getStatus(status) {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return <h5 className="p-notification__title">{statusString}</h5>;
  }
}

Notification.propTypes = {
  children: PropTypes.node,
  appearance: PropTypes.oneOf([
    "positive",
    "caution",
    "negative",
    "information",
  ]),
  status: PropTypes.string,
  canDismiss: PropTypes.bool,
  hideNotification: PropTypes.func,
};

export default Notification;
