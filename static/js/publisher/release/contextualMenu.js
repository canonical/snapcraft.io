import React, { Component } from "react";
import PropTypes from "prop-types";

export default class ContextualMenu extends Component {
  constructor() {
    super();
    this.closeAllDropdowns = this.closeAllDropdowns.bind(this);
  }

  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener("click", this.closeAllDropdowns);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.closeAllDropdowns);
  }

  itemClickHandler(event) {
    this.closeAllDropdowns();
    event.preventDefault(); // prevent link from changing URL
    event.stopPropagation(); // prevent event from propagating to parent button and opening dropdown again
  }

  dropdownButtonClick(event) {
    this.closeAllDropdowns();
    const dropdownEl = event.target
      .closest(".p-promote-button")
      .querySelector(".p-contextual-menu__dropdown");

    if (dropdownEl) {
      dropdownEl.setAttribute("aria-hidden", false);
    }

    event.stopPropagation();
  }

  closeAllDropdowns() {
    [].slice
      .call(document.querySelectorAll(".p-contextual-menu__dropdown"))
      .forEach(dropdown => {
        dropdown.setAttribute("aria-hidden", true);
      });
  }

  renderIcon() {
    return <i className="p-icon--contextual-menu" />;
  }

  renderItems() {
    return null;
  }

  render() {
    const { position } = this.props;
    const menuClass = "p-contextual-menu" + (position ? `--${position}` : "");
    const appearance = this.props.appearance || "neutral";
    const className = this.props.className || "";

    return (
      <span
        className={`p-promote-button p-button--${appearance} p-icon-button ${menuClass} ${className}`}
        onClick={this.dropdownButtonClick.bind(this)}
      >
        {this.renderIcon()}
        <span className="p-contextual-menu__dropdown" aria-hidden="true">
          {this.renderItems()}
        </span>
      </span>
    );
  }
}

ContextualMenu.propTypes = {
  className: PropTypes.string,
  position: PropTypes.oneOf(["left", "center"]), // right is by default
  appearance: PropTypes.oneOf(["base", "neutral"]),
  channel: PropTypes.string.isRequired,
  closeChannel: PropTypes.func.isRequired
};
