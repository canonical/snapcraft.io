import React from "react";
import { PropTypes } from "prop-types";

const mediaClasses = [
  "p-listing-images__image",
  "p-fluid-grid__item--small",
  "js-media-item-holder"
];

import { SortableElement } from "react-sortable-hoc";

class MediaItem extends React.Component {
  constructor(props) {
    super(props);

    this.keyboardEvent = this.keyboardEvent.bind(this);
  }

  keyboardEvent(e) {
    if (e.key === "Delete" || e.key === "Backspace") {
      this.props.markForDeletion(this.props.url);
    }
  }

  render() {
    const classes = mediaClasses.slice(0);
    if (this.props.overflow) {
      classes.push("p-listing-images__image--no-show");
    }
    return (
      <div
        className={classes.join(" ")}
        tabIndex="0"
        onKeyDown={this.keyboardEvent}
        ref={item => (this.mediaItem = item)}
      >
        <span
          role="button"
          className="p-listing-images__delete-image p-market-remove"
          onClick={this.props.markForDeletion.bind(this, this.props.url)}
        >
          <i className="p-icon--delete" />
        </span>
        <img src={this.props.url} />
      </div>
    );
  }
}

MediaItem.propTypes = {
  url: PropTypes.string,
  status: PropTypes.string,
  overflow: PropTypes.bool,
  markForDeletion: PropTypes.func
};

MediaItem.displayName = "MediaItem";

const SortableMediaItem = SortableElement(MediaItem);
export { SortableMediaItem as default, mediaClasses };
