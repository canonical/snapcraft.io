import { connect } from "react-redux";

import { hideNotification } from "../actions/globalNotification";

import Notification from "./notification";

const mapStateToProps = ({ notification }) => {
  const { content: children, appearance, status, canDismiss } = notification;

  return {
    children,
    appearance,
    status,
    canDismiss
  };
};

const mapDispatchToProps = dispatch => ({
  hideNotification: () => dispatch(hideNotification())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Notification);
