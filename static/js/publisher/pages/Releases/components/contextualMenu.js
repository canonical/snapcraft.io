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
    const dropdownEl = event.target.nextSibling;
    const isClosed = dropdownEl.getAttribute("aria-hidden") === "true";
    const tooltipMessage = dropdownEl.parentNode.previousSibling;

    this.closeAllDropdowns();

    if (tooltipMessage) {
      tooltipMessage.classList.remove("u-hide");
    }

    if (isClosed && dropdownEl) {
      dropdownEl.setAttribute("aria-hidden", false);

      if (tooltipMessage) {
        tooltipMessage.classList.add("u-hide");
      }
    }

    event.stopPropagation();
  }

  closeAllDropdowns() {
    [].slice
      .call(document.querySelectorAll(".p-contextual-menu__dropdown"))
      .forEach((dropdown) => {
        dropdown.setAttribute("aria-hidden", true);
      });
  }

  renderIcon() {
    return this.props.label || <i className="p-icon--contextual-menu" />;
  }

  render() {
    const { isDisabled, position, title, isWide } = this.props;
    const className = [
      "p-contextual-menu__toggle",
      "u-no-margin--bottom",
      isDisabled ? "is-disabled" : "",
      this.props.className || "",
    ].join(" ");

    return (
      <span
        className={`p-contextual-menu${
          position ? `--${position}` : ""
        } p-promote-button u-hide--small`}
      >
        <button
          className={className}
          title={title}
          onClick={isDisabled ? null : this.dropdownButtonClick.bind(this)}
        >
          {this.renderIcon()}
        </button>
        <span
          className={`p-contextual-menu__dropdown ${isWide ? "is-wide" : ""}`}
          aria-hidden="true"
        >
          {this.props.children}
        </span>
      </span>
    );
  }
}

ContextualMenu.propTypes = {
  isDisabled: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  isWide: PropTypes.bool,
  position: PropTypes.oneOf(["left", "center"]), // right is by default
  appearance: PropTypes.oneOf(["base", "neutral"]),
};
