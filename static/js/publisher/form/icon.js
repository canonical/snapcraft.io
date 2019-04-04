import React, { Fragment } from "react";
import PropTypes from "prop-types";

import FileInput from "./fileInput";

class Icon extends React.Component {
  constructor(props) {
    super(props);

    this.iconChanged = this.iconChanged.bind(this);
    this.removeIconHandler = this.removeIconHandler.bind(this);

    this.state = {
      icon: props.icon,
      errors: {}
    };
  }

  removeIconHandler() {
    const { updateIcon } = this.props;
    this.setState({
      icon: {}
    });

    updateIcon(null);
  }

  iconChanged(files) {
    const { updateIcon } = this.props;
    const iconFile = files[0];

    if (iconFile.errors) {
      this.setState({
        errors: {
          [iconFile.name]: iconFile.errors
        }
      });
    } else {
      const iconURL = URL.createObjectURL(iconFile);

      this.setState({
        errors: {},
        icon: {
          url: iconURL
        }
      });

      updateIcon({
        url: iconURL,
        file: iconFile,
        name: iconFile.name,
        status: "new",
        type: "icon"
      });
    }
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

  render() {
    const { title, restrictions } = this.props;
    const { icon } = this.state;

    const iconUrl = icon ? icon.url : null;

    return (
      <Fragment>
        {this.renderErrors()}
        <div className="u-vertically-center">
          <div className="p-editable-icon">
            <FileInput
              restrictions={restrictions}
              className="p-editable-icon__icon"
              inputName="icon"
              fileChangedCallback={this.iconChanged}
              isSmall={true}
            >
              {iconUrl && <img src={iconUrl} alt={`${title} snap`} />}
              <span className="p-editable-icon__change">Edit</span>
            </FileInput>
          </div>
          {iconUrl && (
            <div className="p-editable-icon__actions">
              <span
                className="p-editable-icon__delete"
                onClick={this.removeIconHandler}
              >
                <i className="p-icon--delete" />
              </span>
            </div>
          )}
        </div>
      </Fragment>
    );
  }
}

Icon.defaultProps = {
  icon: {},
  title: "Snap icon",
  restrictions: {}
};

Icon.propTypes = {
  icon: PropTypes.object,
  title: PropTypes.string,
  updateIcon: PropTypes.func.isRequired,
  restrictions: PropTypes.object
};

export { Icon as default };
