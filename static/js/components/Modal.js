import React from "react";
import PropTypes from "prop-types";

class Modal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="vbox-overlay" style={{ display: "block", opacity: 1 }}>
        <div className="vbox-container">
          <div className="vbox-content">{this.props.children}</div>
        </div>
        <div className="vbox-close" onClick={this.props.close.bind(this)}>
          X
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  children: PropTypes.any.isRequired,
  close: PropTypes.func.isRequired
};

export default Modal;
