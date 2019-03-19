import React from "react";

import PropTypes from "prop-types";

import { validateRestrictions } from "../../libs/fileValidation";

class FileUpload extends React.Component {
  constructor(props) {
    super(props);

    this.addFileHandler = this.addFileHandler.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.keyboardEventHandler = this.keyboardEventHandler.bind(this);
  }

  addFileHandler() {
    const { restrictions, inputName, parent } = this.props;
    const input = document.createElement("input");
    input.type = "file";
    if (restrictions.accept) {
      input.accept = restrictions.accept.join(",");
    }
    input.name = inputName;
    input.hidden = "hidden";
    input.addEventListener("change", () => {
      this.fileChangedHandler(input);
    });

    if (parent && parent.holder) {
      parent.holder.appendChild(input);
    } else {
      this.holder.appendChild(input);
    }

    input.dispatchEvent(new Event("click", { bubbles: false }));
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
      this.addFileHandler();
    }
  }

  render() {
    const { classes, children } = this.props;
    return (
      <div
        ref={el => (this.holder = el)}
        className={classes.join(" ")}
        onClick={this.addFileHandler}
        onKeyDown={this.keyboardEventHandler}
        tabIndex={0}
      >
        {children}
      </div>
    );
  }
}

FileUpload.propTypes = {
  classes: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.shape({}),
  inputName: PropTypes.string,
  parent: PropTypes.shape({}),
  fileChangedCallback: PropTypes.func,
  restrictions: PropTypes.shape({
    accept: PropTypes.arrayOf(PropTypes.string)
  })
};

export { FileUpload as default };
