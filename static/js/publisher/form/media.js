import React, { Fragment } from "react";
import ReactDOM from "react-dom";

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
      prevState.mediaData.filter(item => item.status !== "delete").length >
      this.props.mediaLimit
    ) {
      // Do the query lookup only when we need it - otherwise every state
      // update will trigger a DOM lookup
      const warning = document.querySelector(".js-media-limit-warning");
      if (warning) {
        warning.classList.remove("u-hide");
      }
    } else {
      const warning = document.querySelector(".js-media-limit-warning");
      if (warning) {
        warning.classList.add("u-hide");
      }
    }

    if (
      this.state.focused === "new" &&
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

    const form = ReactDOM.findDOMNode(this).closest("form"); // eslint-disable-line react/no-find-dom-node
    form.appendChild(input);
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

function initMedia(mediaHolder, images, updateState) {
  const mediaHolderEl = document.querySelector(mediaHolder);
  if (!mediaHolderEl) {
    throw new Error("No media holder El");
  }

  ReactDOM.render(
    <Media mediaData={images} updateState={updateState} />,
    mediaHolderEl
  );
}

export { Media as default, MediaItem, initMedia };
