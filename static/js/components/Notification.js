import React from "react";
import PropTypes from "prop-types";

const Notification = props => {
  const notificationClass = ["p-notification"];
  if (props.type) {
    notificationClass.push(props.type);
  }
  return (
    <div className={notificationClass.join("--")}>
      <p className="p-notification__response">{props.message}</p>
    </div>
  );
};

Notification.defaultProps = {
  type: undefined
};

Notification.propTypes = {
  type: PropTypes.string,
  message: PropTypes.string.isRequired
};

export { Notification as default };
