import { Component, ReactNode } from "react";
import { connect } from "react-redux";

import { CLOSE_MODAL_ACTION_NAME, closeModal } from "../slices/modal";
import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { AppDispatch } from "../store";

type ModalAction = {
  appearance: "positive" | "neutral" | "negative";
  onClickAction:
    | {
        reduxAction: () => void;
      }
    | {
        type: typeof CLOSE_MODAL_ACTION_NAME;
      }
  label: string;
};

interface ModalActionButtonProps {
  onClickAction: ModalAction["onClickAction"];
  appearance: ModalAction["appearance"];
  children: ReactNode;
  dispatch: AppDispatch;
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
      reduxAction();
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

const mapActionButtonDispatchToProps = (dispatch: AppDispatch) => ({
  dispatch,
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
        <div className="u-align--right">
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
    </div>
  );
};

const mapStateToProps = (state: ReleasesReduxState) => state.modal || {};

const mapModalDispatchToProps = (dispatch: AppDispatch) => ({
  closeModal: () => dispatch(closeModal()),
});

export default connect(mapStateToProps, mapModalDispatchToProps)(Modal);
