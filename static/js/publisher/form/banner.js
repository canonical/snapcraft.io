import React, { Fragment } from "react";
import PropTypes from "prop-types";

import FileInput from "../form/fileInput";
import AccordionHelp from "./AccordionHelp";

class Banner extends React.Component {
  constructor(props) {
    super(props);

    this.bannerImageChangeHandler = this.bannerImageChangeHandler.bind(this);
    this.handleRemoveImageClick = this.handleRemoveImageClick.bind(this);

    this.keyboardEvent = this.keyboardEvent.bind(this);
    this.toggleFocus = this.toggleFocus.bind(this);

    this.state = {
      bannerImage: this.props.bannerImage,
      focused: false,
      errors: {}
    };
  }

  bannerImageChangeHandler(files) {
    const { updateImageState } = this.props;
    const file = files[0];

    if (file.errors) {
      this.setState({
        errors: {
          [file.name]: file.errors
        }
      });
    } else {
      const url = URL.createObjectURL(file);

      this.setState({
        errors: {},
        bannerImage: {
          url: url
        }
      });

      updateImageState({
        url: url,
        file,
        name: file.name,
        status: "new",
        type: "banner"
      });
    }
  }

  handleRemoveImageClick(e) {
    e.stopPropagation();
    const { updateImageState } = this.props;

    this.setState({
      bannerImage: {}
    });

    updateImageState(null);
  }

  keyboardEvent(e) {
    if (e.key === "Delete" || e.key === "Backspace") {
      this.handleRemoveImageClick(e);
    }
  }

  toggleFocus() {
    const { focused } = this.state;
    this.setState({
      focused: !focused
    });
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
                &nbsp;
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

  renderBackground() {
    const { bannerImage } = this.state;
    const { restrictions } = this.props;
    const background = bannerImage.url;

    let style;
    let backgroundClasses = ["p-market-banner__image", "u-vertically-center"];
    if (background) {
      style = {
        backgroundImage: `url(${background})`
      };
    } else {
      backgroundClasses.push("is-empty");
    }

    return (
      <Fragment>
        <FileInput
          inputName="banner-image"
          active={true}
          fileChangedCallback={this.bannerImageChangeHandler}
          noFocus={true}
          restrictions={restrictions}
        >
          <div
            className={backgroundClasses.join(" ")}
            style={style}
            tabIndex="0"
            onKeyDown={this.keyboardEvent}
            onFocus={this.toggleFocus}
            onBlur={this.toggleFocus}
          >
            {!background && (
              <div className="u-align-text--center">
                <i className="p-icon--plus" />
                <br />
                Add background
              </div>
            )}
          </div>
        </FileInput>
        {background && (
          <Fragment>
            <span
              className="p-market-banner__remove"
              role="button"
              onClick={this.handleRemoveImageClick}
            >
              <i className="p-icon--delete" />
            </span>
            <div className="p-market-banner__change">Edit background</div>
          </Fragment>
        )}
      </Fragment>
    );
  }

  renderHelp() {
    return (
      <Fragment>
        <p className="p-form-help-text">
          Adding a featured banner will increase your chances of being featured
          on snapcraft.io and in GNOME software but does not immediately make
          you eligible to be featured.
        </p>
        <AccordionHelp name="banner restrictions">
          <p>
            <small>
              Accepted image formats include: <b>JPEG & PNG files</b>
              <br />
              Min resolution: <b>720 x 240 pixels</b>
              <br />
              Max resolution: <b>3840 x 1440 pixels</b>
              <br />
              Recommended (legacy) size: <b>1218 x 240 pixels</b>
              <br />
              Aspect ratio: <b>1:3</b>
              <br />
              File size limit: <b>2MB</b>
            </small>
          </p>
        </AccordionHelp>
      </Fragment>
    );
  }

  render() {
    const { focused } = this.state;
    const classNames = ["p-market-banner__image-holder"];
    if (focused) {
      classNames.push("is-focused");
    }
    return (
      <Fragment>
        {this.renderErrors()}
        <div className={classNames.join(" ")}>{this.renderBackground()}</div>
        {this.renderHelp()}
      </Fragment>
    );
  }
}

Banner.defaultProps = {
  bannerImage: {},
  restrictions: {},
  updateImageState: () => {}
};

Banner.propTypes = {
  bannerImage: PropTypes.shape({
    url: PropTypes.string
  }),
  restrictions: PropTypes.object,
  updateImageState: PropTypes.func
};

export { Banner as default };
