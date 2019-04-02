import React from "react";

import PropTypes from "prop-types";

import { validateRestrictions } from "../../libs/fileValidation";

class FileInput extends React.Component {
  constructor(props) {
    super(props);

    this.fileClickHandler = this.fileClickHandler.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.keyboardEventHandler = this.keyboardEventHandler.bind(this);
  }

  componentDidMount() {
    const { restrictions, inputName } = this.props;

    // Handle input creation outside of the react lifecycle so as to avoid
    // rerendering and side-effects. We need the input to maintain a consistent
    // DOM state throughout the component lifecycle.
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.name = inputName;
    if (restrictions && restrictions.accept) {
      this.input.accept = restrictions.accept;
    }
    this.input.hidden = true;
    this.input.addEventListener("change", this.fileChangedHandler);

    this.holder.appendChild(this.input);
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
      </div>
    );
  }
}

FileInput.defaultProps = {
  className: "",
  inputName: "file-upload",
  fileChangedCallback: () => {},
  restrictions: {
    accept: []
  },
  active: true
};

FileInput.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  inputName: PropTypes.string,
  fileChangedCallback: PropTypes.func,
  restrictions: PropTypes.shape({
    accept: PropTypes.arrayOf(PropTypes.string)
  }),
  active: PropTypes.bool
};

export { FileInput as default };
