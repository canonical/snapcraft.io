import React, { Fragment } from "react";
import PropTypes from "prop-types";

import AccordionHelp from "./AccordionHelp";
import FileInput from "./fileInput";
import RenderErrors from "../shared/RenderErrors";

class Icon extends React.Component {
  constructor(props) {
    super(props);

    this.iconChanged = this.iconChanged.bind(this);
    this.removeIconHandler = this.removeIconHandler.bind(this);

    this.state = {
      icon: props.icon,
      errors: {},
    };
  }

  removeIconHandler(e) {
    const { updateIcon } = this.props;
    e.preventDefault();
    this.setState({
      icon: {},
    });

    updateIcon(null);
  }

  iconChanged(files) {
    const { updateIcon } = this.props;
    const iconFile = files[0];

    if (iconFile.errors) {
      this.setState({
        errors: {
          [iconFile.name]: iconFile.errors,
        },
      });
    } else {
      const iconURL = URL.createObjectURL(iconFile);

      this.setState({
        errors: {},
        icon: {
          url: iconURL,
        },
      });

      updateIcon({
        url: iconURL,
        file: iconFile,
        name: iconFile.name,
        status: "new",
        type: "icon",
      });
    }
  }

  renderErrors() {
    const { errors } = this.state;
    if (Object.keys(errors).length > 0) {
      return <RenderErrors errors={errors} />;
    }
    return false;
  }

  renderRescrictions() {
    return (
      <AccordionHelp name="icon restrictions">
        <ul>
          <li>
            <small>
              Accepted image formats include: <b>PNG, JPEG & SVG files</b>
            </small>
          </li>
          <li>
            <small>
              Min resolution: <b>40 x 40 pixels</b>
            </small>
          </li>
          <li>
            <small>
              Max resolution: <b>512 x 512 pixels</b>
            </small>
          </li>
          <li>
            <small>
              Aspect ratio: <b>1:1</b>
            </small>
          </li>
          <li>
            <small>
              File size limit: <b>256kB</b>
            </small>
          </li>
        </ul>
      </AccordionHelp>
    );
  }

  render() {
    const { title, restrictions } = this.props;
    const { icon } = this.state;

    const iconUrl = icon ? icon.url : null;

    return (
      <Fragment>
        {this.renderErrors()}
        <div className="u-flex u-vertically-center">
          <div className="p-editable-icon" data-tour="listing-icon">
            <FileInput
              restrictions={restrictions}
              className="p-editable-icon__icon"
              inputName="icon"
              inputId="snap-icon"
              fileChangedCallback={this.iconChanged}
              isSmall={true}
            >
              {iconUrl && <img src={iconUrl} alt={`${title} snap`} />}
              <span className="p-editable-icon__change">Edit</span>
            </FileInput>
          </div>
          {iconUrl && (
            <div className="p-editable-icon__actions">
              <a
                href="#"
                role="button"
                tabIndex="0"
                className="p-editable-icon__delete"
                onClick={this.removeIconHandler}
              >
                <i className="p-icon--delete" />
              </a>
            </div>
          )}
        </div>
        {this.renderRescrictions()}
      </Fragment>
    );
  }
}

Icon.defaultProps = {
  icon: {},
  title: "Snap icon",
  restrictions: {},
};

Icon.propTypes = {
  icon: PropTypes.object,
  title: PropTypes.string,
  updateIcon: PropTypes.func.isRequired,
  restrictions: PropTypes.object,
};

export { Icon as default };
