import React, { Component } from "react";
import { connect } from "react-redux";

const Modal = ({
  title,
  content,
  actions,
  closeModal
}) => {
  if (!title && !content) {
    return null;
  }
  
  return (
    <div className="p-modal">
      <div className="p-modal__dialog" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
        <header className="p-modal__header">
          <h2 className="p-modal__title" id="modal-title">{title}</h2>
          <button className="p-modal__close" aria-label="Close modal" onClick={closeModal}>Close</button>
        </header>
        <p id="modal-description">{content}</p>
        {actions.map(action => action)}
      </div>
    </div>
  );
};

const mapStateToProps = ({ modal }) => modal.payload || {};

export default connect(mapStateToProps)(Modal);
