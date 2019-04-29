import React, { Fragment } from "react";

import { PropTypes } from "prop-types";

import MediaItem, { mediaClasses } from "./mediaItem";
import FileInput from "./fileInput";

import { SortableContainer } from "react-sortable-hoc";

class MediaList extends React.Component {
  renderInputs() {
    const { mediaLimit, restrictions } = this.props;
    const currentMedia = this.props.mediaData.length;
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
            inputId={`screenshot-${i}`}
            fileChangedCallback={this.props.mediaChanged}
            active={isActive}
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
    const mediaList = this.props.mediaData;

    return (
      <div className="p-listing-images p-fluid-grid">
        {mediaList.map((item, i) => {
          return (
            <MediaItem
              key={`${item.url}-${i}`}
              index={i}
              url={item.url}
              type={item.type}
              status={item.status}
              markForDeletion={this.props.markForDeletion}
              overflow={i > 4}
            />
          );
        })}
        {this.renderInputs()}
      </div>
    );
  }
}

MediaList.propTypes = {
  mediaLimit: PropTypes.number,
  mediaData: PropTypes.array,
  restrictions: PropTypes.object,
  mediaChanged: PropTypes.func,
  markForDeletion: PropTypes.func
};

export default SortableContainer(MediaList);
