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
    return this.props.icon || <i className="p-icon--contextual-menu" />;
  }

  render() {
    const { isDisabled, position } = this.props;
    const menuClass = "p-contextual-menu" + (position ? `--${position}` : "");
    const appearance = this.props.appearance || "neutral";
    const className = [
      "p-promote-button p-icon-button",
      `p-button--${appearance}`,
      menuClass,
      isDisabled ? "is--disabled" : "",
      this.props.className || ""
    ].join(" ");

    return (
      <span
        className={className}
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
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  children: PropTypes.node,
  className: PropTypes.string,
  position: PropTypes.oneOf(["left", "center"]), // right is by default
  appearance: PropTypes.oneOf(["base", "neutral"])
};
