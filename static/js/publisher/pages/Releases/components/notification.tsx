import React, { Component } from "react";
import { ReleasesReduxState } from "../../../types/releaseTypes";

const notificationStyle = (element = "", modifier = ""): string => {
  element = element ? "__" + element : "";
  modifier = modifier ? "--" + modifier : "";

  const className = `p-notification${element}${modifier}`;

  return className;
};

interface NotificationProps {
  children?: React.ReactNode;
  appearance?: ReleasesReduxState["notification"]["appearance"];
  status?: ReleasesReduxState["notification"]["status"];
  canDismiss?: boolean;
  hideNotification?: () => void;
}

class Notification extends Component<NotificationProps> {
  render() {
    const { status, appearance, canDismiss, hideNotification, children } =
      this.props;
    const className = notificationStyle("", appearance);

    return (
      <div className={`p-notification ${className}`}>
        <div className="p-notification__content">
          <p className={notificationStyle("message")}>
            {status && this.getStatus(status)} {children}
          </p>
          {canDismiss && (
            <button
              className="p-notification__close"
              aria-label="Close notification"
              onClick={hideNotification}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  getStatus(status: string): React.JSX.Element {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return <span className={notificationStyle("status")}>{statusString}:</span>;
  }
}

export default Notification;
