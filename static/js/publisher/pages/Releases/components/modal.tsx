import React, { Component, ReactNode } from "react";
import { connect } from "react-redux";

import { closeModal } from "../actions/modal";
import { setDefaultTrack, clearDefaultTrack } from "../actions/defaultTrack";
import type { ReleasesReduxState, DispatchFn } from "../../../types/releaseTypes";

type ModalAction = {
  appearance: "positive" | "neutral" | "negative";
  onClickAction:
    | {
        reduxAction: string;
      }
    | { type: string };
  label: string;
};

interface ModalActionButtonProps {
  onClickAction: ModalAction["onClickAction"];
  appearance: ModalAction["appearance"];
  children: ReactNode;
  dispatch: DispatchFn;
  setDefaultTrack?: () => void;
  clearDefaultTrack?: () => void;
  [key: string]: unknown; // For dynamic redux action props
}

interface ModalActionButtonState {
  loading: boolean;
}

class ModalActionButton extends Component<ModalActionButtonProps, ModalActionButtonState> {
  constructor(props: ModalActionButtonProps) {
    super(props);

    this.onClickHandler = this.onClickHandler.bind(this);

    this.state = {
      loading: false,
    };
  }

  onClickHandler() {
    const { onClickAction, dispatch } = this.props;

    if ("reduxAction" in onClickAction) {
      const { reduxAction } = onClickAction;
      const reduxActionFn = this.props[reduxAction];
      if (reduxActionFn && typeof reduxActionFn === "function") {
        // If an action is passed, perform the specific action
        (reduxActionFn as () => void)();
      }
    } else {
      // Otherwise dispatch the action object
      dispatch(onClickAction);
    }

    this.setState({
      loading: true,
    });
  }

  render() {
    const { appearance, children } = this.props;
    const { loading } = this.state;

    const className = [
      `p-button--${appearance}`,
      "u-no-margin--bottom",
      "u-float-right",
      ["positive", "negative"].indexOf(appearance) > -1 ? "is--dark" : "",
    ];

    return (
      <button
        className={className.join(" ")}
        onClick={this.onClickHandler}
        disabled={loading}
      >
        {loading && "Loading..."}
        {!loading && children}
      </button>
    );
  }
}

const mapActionButtonDispatchToProps = (dispatch: DispatchFn) => ({
  dispatch,
  setDefaultTrack: () => dispatch(setDefaultTrack()),
  clearDefaultTrack: () => dispatch(clearDefaultTrack()),
});

const ModalActionButtonWrapped = connect(
  null,
  mapActionButtonDispatchToProps,
)(ModalActionButton);

interface ModalProps {
  title?: string;
  content?: ReactNode;
  actions?: ModalAction[];
  closeModal: () => void;
}

const Modal = ({ title, content, actions = [], closeModal }: ModalProps) => {
  if (!title && !content) {
    return null;
  }

  return (
    <div className="p-modal">
      <div
        className="p-modal__dialog"
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <header className="p-modal__header">
          <h2 className="p-modal__title" id="modal-title">
            {title}
          </h2>
          <button
            className="p-modal__close"
            aria-label="Close modal"
            onClick={closeModal}
          >
            Close
          </button>
        </header>
        <p id="modal-description">{content}</p>
        {actions.map((action, i) => (
          <ModalActionButtonWrapped
            key={`action-${i}`}
            appearance={action.appearance}
            onClickAction={action.onClickAction}
          >
            {action.label}
          </ModalActionButtonWrapped>
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = (state: ReleasesReduxState) => state.modal || {};

const mapModalDispatchToProps = (dispatch: DispatchFn) => ({
  closeModal: () => dispatch(closeModal()),
});

export default connect(mapStateToProps, mapModalDispatchToProps)(Modal);
