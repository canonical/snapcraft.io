import { Component, createRef, ReactNode } from "react";
import { connect } from "react-redux";
import { Button, Modal as DSModal } from "@canonical/react-ds-global";

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
      };
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

const appearanceToProps: Record<
  ModalAction["appearance"],
  {
    importance: "primary" | "secondary";
    anticipation?: "constructive" | "destructive";
  }
> = {
  positive: { importance: "primary", anticipation: "constructive" },
  negative: { importance: "primary", anticipation: "destructive" },
  neutral: { importance: "secondary" },
};

class ModalActionButton extends Component<
  ModalActionButtonProps,
  ModalActionButtonState
> {
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

    return (
      <Button
        className="u-no-margin--bottom"
        onClick={this.onClickHandler}
        loading={loading}
        {...appearanceToProps[appearance]}
      >
        {children}
      </Button>
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

class Modal extends Component<ModalProps> {
  dialogRef = createRef<HTMLDialogElement>();

  componentDidMount() {
    this.dialogRef.current?.showModal();
  }

  render() {
    const { title, content, actions = [], closeModal } = this.props;

    if (!title && !content) {
      return null;
    }

    return (
      <DSModal ref={this.dialogRef} onClose={closeModal}>
        <DSModal.Header>{title}</DSModal.Header>
        <DSModal.Content>{content}</DSModal.Content>
        <DSModal.Footer>
          {actions.map((action, i) => (
            <ModalActionButtonWrapped
              key={`action-${i}`}
              appearance={action.appearance}
              onClickAction={action.onClickAction}
            >
              {action.label}
            </ModalActionButtonWrapped>
          ))}
        </DSModal.Footer>
      </DSModal>
    );
  }
}

const mapStateToProps = (state: ReleasesReduxState) => state.modal || {};

const mapModalDispatchToProps = (dispatch: AppDispatch) => ({
  closeModal: () => dispatch(closeModal()),
});

export default connect(mapStateToProps, mapModalDispatchToProps)(Modal);
