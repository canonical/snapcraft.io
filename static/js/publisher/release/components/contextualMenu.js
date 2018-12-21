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
    return this.props.label || <i className="p-icon--contextual-menu" />;
  }

  render() {
    const { appearance, isDisabled, position, title } = this.props;
    const menuClass = "p-contextual-menu" + (position ? `--${position}` : "");
    const buttonClass = `p-button${appearance ? `--${appearance}` : ""}`;
    const className = [
      "p-promote-button",
      buttonClass,
      menuClass,
      isDisabled ? "is--disabled" : "",
      this.props.className || ""
    ].join(" ");

    return (
      <span
        className={className}
        title={title}
        onClick={isDisabled ? null : this.dropdownButtonClick.bind(this)}
      >
        {this.renderIcon()}
        <span className="p-contextual-menu__dropdown" aria-hidden="true">
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
  position: PropTypes.oneOf(["left", "center"]), // right is by default
  appearance: PropTypes.oneOf(["base", "neutral"])
};
