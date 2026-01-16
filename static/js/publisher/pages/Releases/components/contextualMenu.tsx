import React, { Component, ReactNode } from "react";

interface ContextualMenuProps {
  isDisabled?: boolean;
  label?: ReactNode | string;
  title?: string;
  children?: ReactNode;
  className?: string;
  isWide?: boolean;
  position?: "left" | "center"; // right is by default
  appearance?: "base" | "neutral";
}

export default class ContextualMenu extends Component<ContextualMenuProps> {
  constructor(props: ContextualMenuProps) {
    super(props);
    this.closeAllDropdowns = this.closeAllDropdowns.bind(this);
  }

  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener("click", this.closeAllDropdowns);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.closeAllDropdowns);
  }

  itemClickHandler(event: React.MouseEvent) {
    this.closeAllDropdowns();
    event.preventDefault(); // prevent link from changing URL
    event.stopPropagation(); // prevent event from propagating to parent button and opening dropdown again
  }

  dropdownButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    const dropdownEl = (event.target as HTMLButtonElement).nextSibling as HTMLElement | null;
    const isClosed = dropdownEl?.getAttribute("aria-hidden") === "true";
    const tooltipMessage = dropdownEl?.parentNode?.previousSibling as HTMLElement | null;

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
    const dropdowns = document.querySelectorAll(".p-contextual-menu__dropdown");
    Array.from(dropdowns).forEach((dropdown) => {
      dropdown.setAttribute("aria-hidden", "true");
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
