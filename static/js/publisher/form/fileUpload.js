import React from "react";

import PropTypes from "prop-types";

import { validateRestrictions } from "../../libs/fileValidation";

class FileUpload extends React.Component {
  constructor(props) {
    super(props);

    this.fileClickHandler = this.fileClickHandler.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.keyboardEventHandler = this.keyboardEventHandler.bind(this);
  }

  componentDidUpdate() {
    const { active, clear } = this.props;
    if (active && clear && this.input) {
      this.input.value = "";
    }
  }

  fileClickHandler() {
    const { active } = this.props;
    if (active) {
      this.input.click();
    }
  }

  fileChangedHandler() {
    const { fileChangedCallback, restrictions } = this.props;
    const files = Array.from(this.input.files).map(file =>
      validateRestrictions(file, restrictions)
    );

    Promise.all(files).then(values => {
      fileChangedCallback(values);
    });
  }

  keyboardEventHandler(e) {
    if (e.key === "Enter") {
      this.fileClickHandler();
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
        onChange={this.fileChangedHandler}
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
        onClick={this.fileClickHandler}
        onKeyDown={this.keyboardEventHandler}
        tabIndex={0}
      >
        {children}
        {this.renderFile()}
      </div>
    );
  }
}

FileUpload.defaultProps = {
  className: "",
  inputName: "file-upload",
  fileChangedCallback: () => {},
  restrictions: {
    accept: []
  },
  active: true,
  clear: false
};

FileUpload.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  inputName: PropTypes.string,
  fileChangedCallback: PropTypes.func,
  restrictions: PropTypes.shape({
    accept: PropTypes.arrayOf(PropTypes.string)
  }),
  active: PropTypes.bool,
  clear: PropTypes.bool
};

export { FileUpload as default };
