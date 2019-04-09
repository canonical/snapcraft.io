import React from "react";

import PropTypes from "prop-types";

import { validateRestrictions } from "../../libs/fileValidation";

class FileInput extends React.Component {
  constructor(props) {
    super(props);

    this.fileClickHandler = this.fileClickHandler.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.keyboardEventHandler = this.keyboardEventHandler.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dropHandler = this.dropHandler.bind(this);
    this.dragExitHandler = this.dragExitHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);

    this.cancelDragging = this.cancelDragging.bind(this);

    this.state = {
      isDragging: false,
      canDrop: false,
      overLimit: false
    };
  }

  componentDidMount() {
    const { restrictions, inputName, inputId } = this.props;

    // Handle input creation outside of the react lifecycle to avoid
    // re-rendering and side-effects. We need the input to maintain a consistent
    // DOM state throughout the component lifecycle.
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.name = inputName;
    this.input.id = inputId;
    if (restrictions && restrictions.accept) {
      this.input.accept = restrictions.accept;
    }
    this.input.hidden = true;
    this.input.addEventListener("change", this.fileChangedHandler);

    this.holder.appendChild(this.input);

    document.addEventListener("dragover", this.dragOverHandler);
    document.addEventListener("drop", this.dropHandler);

    if ("ondragexit" in document) {
      // Firefox fires dragexit and we can use the event.relatedTarget to see what the
      // new element taking focus is. When leaving the window, this is set to null
      document.addEventListener("dragexit", this.dragExitHandler);
    } else {
      // Chrome does not implement dragexit, but it does fire an event as soon as the
      // mouse leaves the window, setting the mouse position to 0, 0
      document.addEventListener("dragleave", this.dragLeaveHandler);
    }
  }

  componentWillUnmount() {
    document.removeEventListener("dragover", this.dragOverHandler);
    document.removeEventListener("drop", this.dropHandler);
    if ("ondragexit" in document) {
      document.removeEventListener("dragexit", this.dragExitHandler);
    } else {
      document.removeEventListener("dragleave", this.dragLeaveHandler);
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

  dragOverHandler(e) {
    e.preventDefault();
    const dataTransfer = e.dataTransfer || e.target.dataTransfer;

    if (dataTransfer.types && dataTransfer.types.indexOf("Files") !== -1) {
      if (dataTransfer.items.length > 1) {
        this.setState({
          isDragging: true,
          overLimit: true
        });
      } else {
        this.setState({
          isDragging: true,
          canDrop: false,
          overLimit: false
        });

        if (e.target === this.holder) {
          this.setState({
            canDrop: true
          });
        }
      }
    }
  }

  cancelDragging() {
    this.setState({
      isDragging: false,
      canDrop: false,
      overLimit: false
    });
  }

  dragExitHandler(e) {
    const relatedTarget = e.relatedTarget || e.target.relatedTarget;
    if (relatedTarget === null) {
      this.cancelDragging();
    }
  }

  dragLeaveHandler(e) {
    if (e.clientX + e.clientY === 0) {
      this.cancelDragging();
    }
  }

  dropHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    const dataTransfer = e.dataTransfer || e.target.dataTransfer;

    if (dataTransfer.items.length === 1) {
      this.setState({
        isDragging: false,
        canDrop: false
      });

      if (e.target === this.holder) {
        // I can't find a way to test this
        this.input.files = dataTransfer.files;
        this.fileChangedHandler();
      }
    } else {
      this.cancelDragging();
    }
  }

  render() {
    const { className, children, isSmall, noFocus } = this.props;
    const { isDragging, canDrop, overLimit } = this.state;
    const localClassName = [className, "p-file-input"];

    if (isDragging) {
      localClassName.push("is-dragging");
    }

    if (canDrop) {
      localClassName.push("can-drop");
    }

    if (overLimit) {
      localClassName.push("over-limit");
    }

    if (isSmall) {
      localClassName.push("p-file-input--is-small");
    }

    return (
      <div
        ref={el => (this.holder = el)}
        className={localClassName.join(" ")}
        onClick={this.fileClickHandler}
        onKeyDown={this.keyboardEventHandler}
        tabIndex={noFocus ? null : 0}
      >
        {children}
      </div>
    );
  }
}

FileInput.defaultProps = {
  className: "",
  inputName: "file-upload",
  inputId: "file-upload",
  fileChangedCallback: () => {},
  restrictions: {
    accept: []
  },
  active: true,
  isSmall: false,
  noFocus: false
};

FileInput.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  inputName: PropTypes.string,
  inputId: PropTypes.string,
  fileChangedCallback: PropTypes.func,
  restrictions: PropTypes.shape({
    accept: PropTypes.arrayOf(PropTypes.string)
  }),
  active: PropTypes.bool,
  isSmall: PropTypes.bool,
  noFocus: PropTypes.bool
};

export { FileInput as default };
