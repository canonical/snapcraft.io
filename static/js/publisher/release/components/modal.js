import React, { Component } from "react";
import { connect } from "react-redux";
import { PropTypes } from "prop-types";

import { closeModal } from "../actions/modal";

import * as actions from "../actions/";

class ModalActionButton extends Component {
  constructor(props) {
    super(props);

    this.onClickHandler = this.onClickHandler.bind(this);
    this.state = {
      loading: false
    };
  }

  onClickHandler() {
    const { onClickAction, dispatch } = this.props;

    if (onClickAction.reduxAction && this.props[onClickAction.reduxAction]) {
      // If an action is passed, perform the specific action
      this.props[onClickAction.reduxAction]();
    } else {
      // Otherwise dispatch the action object
      dispatch(onClickAction);
    }

    this.setState({
      loading: true
    });
  }

  render() {
    const { appearance, children } = this.props;
    const { loading } = this.state;

    const className = [
      `p-button--${appearance}`,
      "u-no-margin--bottom",
      "u-float--right",
      ["positive", "negative"].indexOf(appearance) > -1 ? "is--dark" : ""
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

ModalActionButton.propTypes = {
  onClickAction: PropTypes.object.isRequired,
  appearance: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapActionButtonDispatchToProps = dispatch => {
  const dispatchObj = {
    dispatch
  };

  Object.keys(actions).forEach(actionKey => {
    if (typeof actions[actionKey] === "function") {
      dispatchObj[actionKey] = () => dispatch(actions[actionKey]());
    }
  });

  return dispatchObj;
};

const ModalActionButtonWrapped = connect(
  null,
  mapActionButtonDispatchToProps
)(ModalActionButton);

const Modal = ({ title, content, actions, closeModal }) => {
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

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.node.isRequired,
  actions: PropTypes.array.isRequired,
  closeModal: PropTypes.func.isRequired
};

const mapStateToProps = ({ modal }) => modal || {};

const mapModalDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal())
});

export default connect(
  mapStateToProps,
  mapModalDispatchToProps
)(Modal);
