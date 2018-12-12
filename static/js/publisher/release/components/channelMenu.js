import React, { Component } from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class ChannelMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  closeChannelClick(channel, event) {
    this.props.closeChannel(channel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderCloseItems() {
    const { channel } = this.props;

    return (
      <span className="p-contextual-menu__group">
        <a
          className="p-contextual-menu__link"
          href="#"
          onClick={this.closeChannelClick.bind(this, channel)}
        >
          Close {channel}
        </a>
      </span>
    );
  }

  promoteToChannelClick(targetChannel, event) {
    this.props.promoteToChannel(targetChannel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItem(targetChannel) {
    const { channel, isDisabled } = targetChannel;
    const className = [
      "p-contextual-menu__link is-indented",
      isDisabled ? "is-disabled" : ""
    ].join(" ");

    return (
      <a
        className={className}
        href="#"
        key={`promote-to-${channel}`}
        onClick={
          isDisabled ? null : this.promoteToChannelClick.bind(this, channel)
        }
      >
        {channel}
      </a>
    );
  }

  renderPromoteItems() {
    return (
      <span className="p-contextual-menu__group">
        <span className="p-contextual-menu__item">Promote to:</span>
        {this.props.targetChannels.map(this.renderItem.bind(this))}
      </span>
    );
  }

  render() {
    return (
      <ContextualMenu appearance="base" ref={this.setMenuRef}>
        {this.renderPromoteItems()}
        {this.props.canBeClosed && this.renderCloseItems()}
      </ContextualMenu>
    );
  }
}

ChannelMenu.propTypes = {
  channel: PropTypes.string.isRequired,
  targetChannels: PropTypes.array.isRequired,
  canBeClosed: PropTypes.bool,
  closeChannel: PropTypes.func.isRequired,
  promoteToChannel: PropTypes.func.isRequired
};
