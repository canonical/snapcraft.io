import React, { Fragment } from "react";

import { PropTypes } from "prop-types";

import MediaItem, { mediaClasses } from "./mediaItem";
import FileInput from "./fileInput";

class Media extends React.Component {
  constructor(props) {
    super(props);

    this.markForDeletion = this.markForDeletion.bind(this);
    this.mediaChanged = this.mediaChanged.bind(this);

    this.toggleRestrictions = this.toggleRestrictions.bind(this);

    this.state = {
      mediaData: props.mediaData,
      restrictionsVisible: false,
      errors: {}
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.mediaData !== this.state.mediaData) {
      this.props.updateState(this.state.mediaData);
    }
  }

  markForDeletion(key) {
    const newMediaData = this.state.mediaData.map(item => {
      if (item.url === key) {
        item.status = "delete";
      }
      return item;
    });

    this.setState({
      mediaData: newMediaData
    });
  }

  mediaChanged(files) {
    const newMediaData = [...this.state.mediaData];
    const errors = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.errors) {
        errors[file.name] = file.errors;
      } else {
        newMediaData.push({
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: "screenshot",
          status: "new"
        });
      }
    }

    this.setState({
      mediaData: newMediaData,
      errors: errors
    });
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

  renderErrors() {
    const { errors } = this.state;
    if (Object.keys(errors).length > 0) {
      return (
        <div className="p-notification--negative">
          <p className="p-notification__response">
            {Object.keys(errors).map(fileName => (
              <Fragment key={`errors-${fileName}`}>
                {fileName}
                <br />
                {errors[fileName].map((error, index) => (
                  <Fragment key={`errors-${fileName}-${index}`}>
                    {error}
                    <br />
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </p>
        </div>
      );
    }
    return false;
  }

  toggleRestrictions() {
    this.setState({
      restrictionsVisible: !this.state.restrictionsVisible
    });
  }

  renderRescrictions() {
    const overlayClasses = ["row"];
    let verb = "Hide";
    if (!this.state.restrictionsVisible) {
      overlayClasses.push("u-hide");
      verb = "Show";
    }
    return (
      <Fragment>
        <p className="p-form-help-text">
          <a role="button" onClick={this.toggleRestrictions}>
            {verb} image restrictions
          </a>
        </p>
        <div className={overlayClasses.join(" ")}>
          <div className="col-8">
            <p>
              <small>
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
              </small>
            </p>
          </div>
        </div>
      </Fragment>
    );
  }

  renderInputs() {
    const { mediaLimit, restrictions } = this.props;
    const currentMedia = this.state.mediaData.filter(
      media => media.status !== "delete"
    ).length;
    const inputs = [];

    for (let i = 0; i < mediaLimit; i++) {
      const classes = [...mediaClasses];
      classes.push("is-empty");

      let isActive = false;

      if (i === currentMedia) {
        classes.push("p-listing-images__add-image");
        isActive = true;
      } else if (i < currentMedia) {
        classes.push("u-hide");
      }

      inputs.push(
        <Fragment key={`add-screenshot-${i}`}>
          <FileInput
            restrictions={restrictions}
            className={classes.join(" ")}
            inputName="screenshots"
            fileChangedCallback={this.mediaChanged}
            active={isActive}
            clear={true}
          >
            {isActive && (
              <span role="button" className="u-align-text--center">
                <i className="p-icon--plus" />
                <br />
                Add image
              </span>
            )}
          </FileInput>
        </Fragment>
      );
    }

    return inputs;
  }

  render() {
    const mediaList = this.state.mediaData.filter(
      item => item.status !== "delete"
    );

    return (
      <Fragment>
        {this.renderOverLimit()}
        {this.renderErrors()}
        <div
          className="p-listing-images p-fluid-grid"
          ref={item => (this.holder = item)}
        >
          {mediaList.map((item, i) => {
            return (
              <MediaItem
                key={`${item.url}-${i}`}
                url={item.url}
                type={item.type}
                status={item.status}
                markForDeletion={this.markForDeletion}
                overflow={i > 4}
              />
            );
          })}
          {this.renderInputs()}
        </div>
        {this.renderRescrictions()}
      </Fragment>
    );
  }
}

Media.defaultProps = {
  mediaLimit: 5,
  mediaData: [],
  updateState: () => {},
  restrictions: {}
};

Media.propTypes = {
  mediaLimit: PropTypes.number,
  mediaData: PropTypes.array,
  updateState: PropTypes.func,
  restrictions: PropTypes.object
};

export { Media as default };
