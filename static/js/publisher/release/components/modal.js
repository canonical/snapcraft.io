import React, { Component } from "react";
import { connect } from "react-redux";
import { PropTypes } from "prop-types";

class ModalActionButton extends Component {
  constructor(props) {
    super(props);

    this.onClickHandler = this.onClickHandler.bind(this);
    this.state = {
      loading: false
    };
  }

  onClickHandler(e) {
    const { onClick } = this.props;

    onClick(e);

    this.setState({
      loading: true
    });
  }

  render() {
    const { className, children } = this.props;
    const { loading } = this.state;

    return (
      <button
        className={`${className} is--dark`}
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
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

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
          <ModalActionButton
            key={`action-${i}`}
            className={action.className}
            onClick={action.onClick}
          >
            {action.label}
          </ModalActionButton>
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

const mapStateToProps = ({ modal }) => modal.payload || {};

export default connect(mapStateToProps)(Modal);
