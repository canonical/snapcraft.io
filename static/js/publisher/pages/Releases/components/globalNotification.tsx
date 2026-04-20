import { connect } from "react-redux";

import { hideNotification } from "../actions/globalNotification";

import Notification from "./notification";
import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { DispatchFn } from "../store";

interface StateProps {
  children?: string;
  appearance?: ReleasesReduxState["notification"]["appearance"];
  status?: ReleasesReduxState["notification"]["status"];
  canDismiss?: boolean;
}

interface DispatchProps {
  hideNotification: typeof hideNotification;
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

const mapDispatchToProps = (dispatch: DispatchFn): DispatchProps => ({
  hideNotification: () => dispatch(hideNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
