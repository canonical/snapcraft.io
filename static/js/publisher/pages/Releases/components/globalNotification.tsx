import { connect } from "react-redux";

import { hideNotification } from "../slices/notification";

import Notification from "./notification";
import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { AppDispatch } from "../store";

interface StateProps {
  children?: string;
  appearance?: ReleasesReduxState["notification"]["appearance"];
  status?: ReleasesReduxState["notification"]["status"];
  canDismiss?: boolean;
}

interface DispatchProps {
  hideNotification: () => void;
}

const mapStateToProps = ({ notification }: ReleasesReduxState): StateProps => {
  const { content: children, appearance, status, canDismiss } = notification;

  return {
    children,
    appearance,
    status,
    canDismiss,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  hideNotification: () => dispatch(hideNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
