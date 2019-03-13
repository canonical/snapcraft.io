import React, { Fragment } from "react";
import PropTypes from "prop-types";

class Banner extends React.Component {
  constructor(props) {
    super(props);

    this.bannerImageChangeHandler = this.bannerImageChangeHandler.bind(this);
    this.bannerIconChangeHandler = this.bannerIconChangeHandler.bind(this);
    this.handleChangeImageClick = this.handleChangeImageClick.bind(this);
    this.handleChangeIconClick = this.handleChangeIconClick.bind(this);
    this.handleRemoveImageClick = this.handleRemoveImageClick.bind(this);
    this.handleRemoveIconClick = this.handleRemoveIconClick.bind(this);

    this.state = {
      bannerImage: this.props.bannerImage,
      bannerIcon: this.props.bannerIcon
    };
  }

  componentDidUpdate() {
    const images = [];
    if (this.state.bannerImage.url) {
      images.push(this.state.bannerImage);
    }
    if (this.state.bannerIcon.url) {
      images.push(this.state.bannerIcon);
    }

    this.props.updateImageState(images);
  }

  bannerImageChangeHandler() {
    const file = this.bannerImageInput.files[0];
    if (file.name !== "banner.jpg" && file.name !== "banner.png") {
      this.setState({
        error: (
          <Fragment>
            Background filename must be <code>banner.jpg</code> or{" "}
            <code>banner.png</code>
          </Fragment>
        )
      });
      this.bannerImageInput.value = "";
      return;
    }
    const url = URL.createObjectURL(file);

    this.setState({
      error: undefined,
      bannerImage: {
        file,
        url: url,
        name: file.name,
        type: "screenshot",
        status: "new",
        isBanner: true
      }
    });
  }

  bannerIconChangeHandler() {
    const file = this.bannerIconInput.files[0];
    if (file.name !== "banner-icon.jpg" && file.name !== "banner-icon.png") {
      this.setState({
        error: (
          <Fragment>
            Icon filename must be <code>banner-icon.jpg</code> or{" "}
            <code>banner-icon.png</code>
          </Fragment>
        )
      });
      this.bannerIconInput.value = "";
      return;
    }
    const url = URL.createObjectURL(file);

    this.setState({
      error: undefined,
      bannerIcon: {
        file,
        url: url,
        name: file.name,
        type: "screenshot",
        status: "new",
        isBanner: true
      }
    });
  }

  handleRemoveImageClick(e) {
    e.stopPropagation();
    this.setState({
      bannerImage: {}
    });
    this.bannerImageInput.value = "";
  }

  handleRemoveIconClick(e) {
    e.stopPropagation();
    this.setState({
      bannerIcon: {}
    });
    this.bannerIconInput.value = "";
  }

  handleChangeImageClick() {
    this.bannerImageInput.click();
  }

  handleChangeIconClick() {
    this.bannerIconInput.click();
  }

  renderError() {
    return (
      <div className="p-notification p-notification--negative">
        <p className="p-notification__response">{this.state.error}</p>
      </div>
    );
  }

  renderBackground() {
    const background = this.state.bannerImage.url;

    let style;
    let backgroundClasses = ["p-market-banner__image", "u-vertically-center"];
    if (background) {
      style = {
        backgroundImage: `url(${this.state.bannerImage.url})`
      };
    } else {
      backgroundClasses.push("is-empty");
    }

    return (
      <div
        className={backgroundClasses.join(" ")}
        style={style}
        onClick={this.handleChangeImageClick}
      >
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
        {!background && (
          <div className="u-align-text--center">
            <i className="p-icon--plus" />
            <br />
            Add background
          </div>
        )}
      </div>
    );
  }

  renderIcon() {
    const icon = this.state.bannerIcon.url;

    let iconClasses = ["p-market-banner__icon", "u-vertically-center"];
    if (!icon) {
      iconClasses.push("is-empty");
    }

    return (
      <div
        className={iconClasses.join(" ")}
        onClick={this.handleChangeIconClick}
      >
        {icon && (
          <Fragment>
            <span
              className="p-market-banner__remove"
              role="button"
              onClick={this.handleRemoveIconClick}
            >
              <i className="p-icon--delete" />
            </span>
            <img alt="banner icon" src={icon} />
            <div className="p-market-banner__change">Edit icon</div>
          </Fragment>
        )}
        {!icon && (
          <div className="u-align-text--center">
            <i className="p-icon--plus" />
            <br />
            Add icon
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <Fragment>
        {this.state.error && this.renderError()}
        <div className="p-market-banner__images">
          {this.renderBackground()}
          {this.renderIcon()}
        </div>
        <input
          name="banner-image"
          type="file"
          hidden="hidden"
          onChange={this.bannerImageChangeHandler}
          ref={item => (this.bannerImageInput = item)}
        />
        <input
          name="banner-icon"
          type="file"
          hidden="hidden"
          onChange={this.bannerIconChangeHandler}
          ref={item => (this.bannerIconInput = item)}
        />
        <p className="p-form-help-text">
          Adding a featured banner will increase your chances of being featured
          on snapcraft.io and in GNOME software but does not immediately make
          you eligible to be featured.
        </p>
        <ul className="p-form-help-text">
          <li>
            Both background and icon must have the file extension{" "}
            <code>.jpg</code> or <code>.png</code>.
          </li>
          <li>
            The background filename must be <code>banner</code>.
          </li>
          <li>
            The icon filename must be <code>banner-icon</code>.
          </li>
        </ul>
      </Fragment>
    );
  }
}

Banner.defaultProps = {
  bannerImage: {},
  bannerIcon: {},
  updateImageState: () => {}
};

Banner.propTypes = {
  bannerImage: PropTypes.shape({
    url: PropTypes.string
  }),
  bannerIcon: PropTypes.shape({
    url: PropTypes.string
  }),
  updateImageState: PropTypes.func
};

export { Banner as default };
