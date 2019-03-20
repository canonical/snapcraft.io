import React from "react";

import PropTypes from "prop-types";

import { validateRestrictions } from "../../libs/fileValidation";

class FileUpload extends React.Component {
  constructor(props) {
    super(props);

    this.fileChangeHandler = this.fileChangeHandler.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.keyboardEventHandler = this.keyboardEventHandler.bind(this);
  }

  fileChangeHandler() {
    this.input.dispatchEvent(new Event("click", { bubbles: false }));
  }

  fileChangedHandler(input) {
    const { fileChangedCallback, restrictions } = this.props;
    const files = Array.from(input.files).map(file =>
      validateRestrictions(file, restrictions)
    );

    Promise.all(files).then(values => {
      fileChangedCallback(values);
    });
  }

  keyboardEventHandler(e) {
    if (e.key === "Enter") {
      this.fileChangeHandler();
    }
  }

  renderFile() {
    const { restrictions, inputName } = this.props;

    return (
      <input
        type="file"
        accept={restrictions && restrictions.accept}
        name={inputName}
        hidden={true}
        onChange={this.fileChangeHandler}
        ref={el => (this.input = el)}
      />
    );
  }

  render() {
    const { className, children } = this.props;
    return (
      <div
        ref={el => (this.holder = el)}
        className={className}
        onClick={this.fileChangeHandler}
        onKeyDown={this.keyboardEventHandler}
        tabIndex={0}
      >
        {children}
        {this.renderFile()}
      </div>
    );
  }
}

FileUpload.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  inputName: PropTypes.string,
  fileChangedCallback: PropTypes.func,
  restrictions: PropTypes.shape({
    accept: PropTypes.arrayOf(PropTypes.string)
  }),
  active: PropTypes.bool
};

export { FileUpload as default };
