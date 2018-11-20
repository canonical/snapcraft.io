import React, { Fragment } from "react";
import ReactDOM, { unmountComponentAtNode } from "react-dom";
import PropTypes from "prop-types";
import "whatwg-fetch";

import ReactCrop from "react-image-crop";

import Modal from "./Modal";
import { Card } from "vanilla-framework-react";

class ImageCropper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageUrl: this.props.imageUrl,
      hasImage: false,
      gettingImage: false,
      crop: {
        aspect: 1,
        x: 0,
        y: 0
      }
    };

    this.props.snapIconInput.addEventListener("change", () => {
      const imageUrl = this.props.openImage();
      let cropState = this.state.crop;

      if (this.image) {
        const crop = this.getCrop();
        cropState = {
          crop: {
            aspect: 1,
            x: 0,
            y: 0,
            width: crop[0],
            height: crop[1]
          }
        };
      }
      this.setState({
        imageUrl: imageUrl,
        crop: cropState
      });
    });
  }

  renderPreview() {
    if (this.canvas) {
      this.canvasHolder.removeChild(this.canvas);
    }

    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 256;
    this.canvasHolder.appendChild(this.canvas);
    const ctx = this.canvas.getContext("2d");
    const image = this.image;

    let width = image.naturalWidth;
    let height = image.naturalHeight;
    let x = 0;
    let y = 0;

    if (this.state.crop.width) {
      width = image.naturalWidth * (this.state.crop.width / 100);
    }

    if (this.state.crop.height) {
      height = image.naturalHeight * (this.state.crop.height / 100);
    }

    if (this.state.crop.x) {
      x = image.naturalWidth * (this.state.crop.x / 100);
    }

    if (this.state.crop.y) {
      y = image.naturalHeight * (this.state.crop.y / 100);
    }

    ctx.clearRect(0, 0, 256, 256);

    if (width > height) {
      width = height;
    } else {
      height = width;
    }

    ctx.drawImage(image, x, y, width, height, 0, 0, 256, 256);
  }

  componentDidMount() {
    if (
      this.state.imageUrl &&
      this.state.imageUrl.indexOf("base64") === -1 &&
      this.state.imageUrl.indexOf("blob") === -1 &&
      this.state.gettingImage === false
    ) {
      this.setState({
        gettingImage: true
      });
      const url = `/${this.props.snapName}/image?url=${this.state.imageUrl}`;
      fetch(url)
        .then(response => response.json())
        .then(response => {
          this.setState({
            imageUrl: response.image,
            gettingImage: false
          });
        })
        .catch(error => {
          throw new Error(error);
        });
    }

    if (this.canvasHolder && this.state.hasImage) {
      this.renderPreview();
    }

    if (!this.props.imageUrl) {
      this.props.snapIconInput.click();
    }
  }

  componentDidUpdate() {
    if (this.canvasHolder && this.state.hasImage) {
      this.renderPreview();
    }
  }

  onCrop(crop) {
    this.setState({ crop });
  }

  getCrop() {
    let width = (256 / this.image.width) * 100;
    let height = (256 / this.image.height) * 100;

    return [width, height];
  }

  onImageLoaded(image) {
    this.image = image;

    const crop = this.getCrop();

    this.setState({
      hasImage: true,
      crop: {
        aspect: 1,
        x: 0,
        y: 0,
        width: crop[0],
        height: crop[1]
      }
    });
  }

  openImage(event) {
    event.preventDefault();
    this.props.snapIconInput.click();
  }

  removeImage(event) {
    event.preventDefault();
    this.props.updateImage(null);
    this.setState({
      imageUrl: false,
      hasImage: false,
      gettingImage: false,
      crop: {
        aspect: 1,
        x: 0,
        y: 0
      }
    });
    this.props.close();
  }

  saveCrop(event) {
    event.preventDefault();
    const dataURI = this.canvas.toDataURL();

    const bytestring = atob(dataURI.split(",")[1]);

    const mimeString = dataURI
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    const ab = new ArrayBuffer(bytestring.length);

    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytestring.length; i++) {
      ia[i] = bytestring.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    this.props.updateImage(blob);

    this.props.close();
  }

  renderCropper() {
    return (
      <Fragment>
        <div className="row">
          <div className="col-5">
            <h4>Original</h4>
            <ReactCrop
              src={this.state.imageUrl}
              crop={this.state.crop}
              onChange={this.onCrop.bind(this)}
              onImageLoaded={this.onImageLoaded.bind(this)}
            />
          </div>
          <div className="col-5">
            <h4>Preview</h4>
            <div
              ref={ref => {
                this.canvasHolder = ref;
              }}
            />
          </div>
        </div>
        <hr />
        <button
          className="p-button--neutral u-float--left u-no-margin--bottom"
          onClick={this.openImage.bind(this)}
        >
          Change image
        </button>
        <button
          className="p-button--negative u-float--left u-no-margin--bottom"
          onClick={this.removeImage.bind(this)}
        >
          Remove image
        </button>
        <div className="u-float--right">
          <button
            className="p-button--neutral u-no-margin--bottom"
            onClick={this.props.close}
          >
            Cancel
          </button>
          <button
            className={`p-button--positive u-no-margin--bottom p-button-spinner
            ${this.state.gettingImage ? " has-spinner" : ""}`}
            onClick={this.saveCrop.bind(this)}
          >
            <span className="p-button__spinner vanilla-workaround--dark">
              <i className="p-icon--spinner u-animation--spin" />
            </span>
            <span className="p-button__text">Save</span>
          </button>
        </div>
      </Fragment>
    );
  }

  render() {
    if (this.state.imageUrl) {
      return (
        <Modal visible={true} close={this.props.close}>
          <div className="col-10">
            <Card>{this.renderCropper()}</Card>
          </div>
        </Modal>
      );
    }

    return false;
  }
}

ImageCropper.propTypes = {
  close: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  snapIconInput: PropTypes.any.isRequired,
  openImage: PropTypes.func.isRequired,
  updateImage: PropTypes.func.isRequired,
  snapName: PropTypes.string.isRequired
};

let componentHolder;

function init(
  holder,
  imageUrl,
  snapIconInput,
  openImage,
  updateImage,
  snapName
) {
  componentHolder = holder;
  ReactDOM.render(
    <ImageCropper
      imageUrl={imageUrl}
      close={remove}
      snapIconInput={snapIconInput}
      openImage={openImage}
      updateImage={updateImage}
      snapName={snapName}
    />,
    componentHolder
  );
}

function remove() {
  unmountComponentAtNode(componentHolder);
}

export { ImageCropper as default, init as initImageCropper };
