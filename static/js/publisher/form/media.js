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

    this.toggleRestrictions = this.toggleRestrictions.bind(this);

    this.state = {
      mediaData: props.mediaData,
      restrictionsVisible: false
    };
  }

  markForDeletion(key) {
    const newMediaData = this.state.mediaData.map(item => {
      if (item.url === key) {
        item.status = "delete";
      }
      return item;
    });

    this.setState(
      {
        mediaData: newMediaData
      },
      () => {
        this.props.updateState(this.state.mediaData);
      }
    );
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

    this.setState(
      {
        mediaData: newMediaData
      },
      () => {
        this.props.updateState(this.state.mediaData);
      }
    );
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
            tabIndex="0"
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

  toggleRestrictions() {
    this.setState({
      restrictionsVisible: !this.state.restrictionsVisible
    });
  }

  renderRescrictions() {
    const overlayClasses = ["p-overlay"];
    if (!this.state.restrictionsVisible) {
      overlayClasses.push("u-hide");
    }
    return (
      <Fragment>
        <p className="p-form-help-text">
          <a role="button" onClick={this.toggleRestrictions}>
            See image restrictions
          </a>
        </p>
        <div className={overlayClasses.join(" ")}>
          <div className="p-overlay__content">
            <div className="p-card">
              <h4>Image restrictions</h4>
              <p>
                Accepted image formats include: <b>GIF, JPEG & PNG files.</b>
                <br />
                Min resolution: <b>480 x 480 pixels</b>
                <br />
                Max resolution: <b>3840 x 2160 pixels</b>
                <br />
                Aspect ratio: <b>Between 1:2 and 2:1</b>
                <br />
                File size limit: <b>2MB</b>
                <br />
                Animation min fps: <b>1</b>
                <br />
                Animation max fps: <b>30</b>
                <br />
                Animation max length: <b>40 seconds</b>
                <br />
              </p>
            </div>
            <span
              className="p-overlay__close"
              role="button"
              onClick={this.toggleRestrictions}
            >
              <i className="p-icon--close" />
            </span>
          </div>
        </div>
      </Fragment>
    );
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
              key={`${i}-${item.url}`}
              url={item.url}
              type={item.type}
              status={item.status}
              markForDeletion={this.markForDeletion}
              overflow={i > 4}
            />
          ))}
          {this.renderBlankMedia(blankMedia)}
        </div>
        {this.renderRescrictions()}
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
