import React, { Fragment } from "react";

import { PropTypes } from "prop-types";

import AccordionHelp from "./AccordionHelp";
import SortableMediaList from "./mediaList";

class Media extends React.Component {
  constructor(props) {
    super(props);

    this.markForDeletion = this.markForDeletion.bind(this);
    this.mediaChanged = this.mediaChanged.bind(this);

    this.state = {
      mediaData: props.mediaData,
      errors: {}
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { mediaData } = this.state;
    const { mediaLimit } = this.props;

    if (prevState.mediaData !== mediaData && mediaData.length <= mediaLimit) {
      this.props.updateState(mediaData);
    }
  }

  markForDeletion(key) {
    this.setState({
      mediaData: this.state.mediaData.filter(item => item.url !== key)
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
    if (this.state.mediaData.length > this.props.mediaLimit) {
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

  renderRescrictions() {
    return (
      <AccordionHelp name="image restrictions">
        <div className="col-8">
          <ul className="u-no-margin--bottom">
            <li>
              <small>
                Accepted image formats include: <b>GIF, JPEG & PNG files</b>
              </small>
            </li>
            <li>
              <small>
                Min resolution: <b>480 x 480 pixels</b>
              </small>
            </li>
            <li>
              <small>
                Max resolution: <b>3840 x 2160 pixels</b>
              </small>
            </li>
            <li>
              <small>
                Aspect ratio: <b>Between 1:2 and 2:1</b>
              </small>
            </li>
            <li>
              <small>
                File size limit: <b>2MB</b>
              </small>
            </li>
            <li>
              <small>
                Animation min fps: <b>1</b>
              </small>
            </li>
            <li>
              <small>
                Animation max fps: <b>30</b>
              </small>
            </li>
            <li>
              <small>
                Animation max length: <b>40 seconds</b>
              </small>
            </li>
          </ul>
        </div>
      </AccordionHelp>
    );
  }

  onSortEnd(params) {
    const { oldIndex, newIndex } = params;
    const newMediaData = [...this.state.mediaData];
    const moved = newMediaData.splice(oldIndex, 1);
    newMediaData.splice(newIndex, 0, moved[0]);

    this.setState({
      mediaData: newMediaData
    });
  }

  render() {
    const mediaList = this.state.mediaData;

    return (
      <Fragment>
        {this.renderOverLimit()}
        {this.renderErrors()}
        <SortableMediaList
          distance={10}
          onSortEnd={this.onSortEnd.bind(this)}
          axis="xy"
          mediaData={mediaList}
          mediaLimit={this.props.mediaLimit}
          restrictions={this.props.restrictions}
          markForDeletion={this.markForDeletion}
          mediaChanged={this.mediaChanged}
        />
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
