import React, { Fragment } from "react";

import { PropTypes } from "prop-types";

import MediaItem, { mediaClasses } from "./mediaItem";

class Media extends React.Component {
  constructor(props) {
    super(props);

    this.markForDeletion = this.markForDeletion.bind(this);
    this.addImage = this.addImage.bind(this);
    this.mediaChange = this.mediaChange.bind(this);
    this.keyboardEvent = this.keyboardEvent.bind(this);
    this.focused = this.focused.bind(this);
    this.blurred = this.blurred.bind(this);

    this.state = {
      mediaData: props.mediaData,
      focused: null
    };
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.updateState(prevState.mediaData);

    if (
      this.state.focused === "new" &&
      this.blankItem &&
      document.activeElement !== this.blankItem
    ) {
      this.blankItem.focus();
    }
  }

  markForDeletion(key) {
    let index = -1;
    let newFocus = this.state.focused;

    const newMediaData = this.state.mediaData.map((item, i) => {
      if (item.url === key) {
        item.status = "delete";
        index = i;
      }
      return item;
    });

    if (this.state.focused && index > -1) {
      const available = newMediaData.filter(item => item.status !== "delete");
      if (available[0]) {
        newFocus = available[0].url;
      } else {
        newFocus = "new";
      }
    }

    this.setState({
      mediaData: newMediaData,
      focused: newFocus
    });
  }

  mediaChange(input) {
    const newMediaData = this.state.mediaData;
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      newMediaData.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: "screenshot",
        status: "new"
      });
    }

    this.setState({
      mediaData: newMediaData
    });
  }

  addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/x-png,image/gif,image/jpeg";
    input.name = "screenshots";
    input.hidden = "hidden";
    input.addEventListener("change", () => {
      this.mediaChange(input);
    });

    this.holder.appendChild(input);
    input.click();
  }

  keyboardEvent(e) {
    if (e.key === "Enter") {
      this.addImage();
    }
  }

  focused(url) {
    this.setState({
      focused: url
    });
  }

  blurred(url) {
    if (this.state.focused === url) {
      this.setState({
        focused: null
      });
    }
  }

  renderOverLimit() {
    if (
      this.state.mediaData.filter(item => item.status !== "delete").length >
      this.props.mediaLimit
    ) {
      return (
        <div className="p-notification--caution">
          <p className="p-notification__response">
            You have over 5 images uploaded. Not all image will be visible to
            users.
          </p>
        </div>
      );
    }
    return false;
  }

  renderBlankMedia(numberOfBlank) {
    const blankMedia = [];
    for (let i = 0; i < numberOfBlank; i++) {
      const classes = mediaClasses.slice(0);
      classes.push("is-empty");

      if (i === 0) {
        classes.push("p-listing-images__add-image");

        blankMedia.push(
          <div
            className={classes.join(" ")}
            key={`blank-${i}`}
            onClick={this.addImage}
            onKeyDown={this.keyboardEvent}
            onFocus={this.focused.bind(this, "new")}
            onBlur={this.blurred.bind(this, "new")}
            tabIndex="0"
            ref={item => (this.blankItem = item)}
          >
            <span role="button" className="u-align-text--center">
              <i className="p-icon--plus" />
              <br />
              Add image
            </span>
          </div>
        );
      } else {
        blankMedia.push(
          <div className={classes.join(" ")} key={`blank-${i}`} />
        );
      }
    }

    return blankMedia;
  }

  renderDeleteState(toDelete) {
    return (
      <span className="p-tooltip p-tooltip--btm-center" key="toDelete">
        {toDelete.length} images to delete.&nbsp;
        <span className="p-tooltip__message">
          {toDelete.map(item => (
            <img
              className="p-listing-images__tooltip-image"
              src={item.url}
              key={`delete-${item.url}`}
            />
          ))}
        </span>
      </span>
    );
  }

  renderUploadState(toUpload) {
    return (
      <span className="p-tooltip p-tooltip--btm-center" key="toUpload">
        {toUpload.length} images to upload.&nbsp;
        <span className="p-tooltip__message">
          {toUpload.map(item => (
            <img
              className="p-listing-images__tooltip-image"
              src={item.url}
              key={`delete-${item.url}`}
            />
          ))}
        </span>
      </span>
    );
  }

  renderStatus() {
    const toDelete = this.state.mediaData.filter(
      item => item.status === "delete"
    );
    const toUpload = this.state.mediaData.filter(item => item.status === "new");

    const content = [];

    if (toDelete.length > 0) {
      content.push(this.renderDeleteState(toDelete));
    }
    if (toUpload.length > 0) {
      content.push(this.renderUploadState(toUpload));
    }
    return <p>{content}</p>;
  }

  render() {
    const mediaList = this.state.mediaData.filter(
      item => item.status !== "delete"
    );

    let blankMedia = 0;

    if (mediaList.length < this.props.mediaLimit) {
      blankMedia = this.props.mediaLimit - mediaList.length;
    }

    return (
      <Fragment>
        {this.renderOverLimit()}
        <div
          className="p-listing-images p-fluid-grid"
          ref={item => (this.holder = item)}
        >
          {mediaList.map((item, i) => (
            <MediaItem
              key={item.url}
              url={item.url}
              type={item.type}
              status={item.status}
              remove={this.markForDeletion}
              overflow={i > 4}
              focused={this.focused}
              blurred={this.blurred}
              focus={this.state.focused}
            />
          ))}
          {this.renderBlankMedia(blankMedia)}
        </div>
        {this.renderStatus()}
      </Fragment>
    );
  }
}

Media.defaultProps = {
  mediaLimit: 5,
  mediaData: [],
  updateState: () => {}
};

Media.propTypes = {
  mediaLimit: PropTypes.number,
  mediaData: PropTypes.array,
  updateState: PropTypes.func
};

export { Media as default };
