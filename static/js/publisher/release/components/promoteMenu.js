import React, { Component } from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class PromoteMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
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

  renderItems() {
    return (
      <span className="p-contextual-menu__group">
        <span className="p-contextual-menu__item">Promote to:</span>
        {this.props.targetChannels.map(this.renderItem.bind(this))}
      </span>
    );
  }

  render() {
    const isDisabled = this.props.targetChannels.every(
      targetChannel => targetChannel.isDisabled
    );

    return (
      <ContextualMenu
        className="p-releases-channel__promote p-icon-button"
        appearance="neutral"
        isDisabled={isDisabled}
        label="⤴"
        title="Promote to other channels"
        ref={this.setMenuRef}
      >
        {this.renderItems()}
      </ContextualMenu>
    );
  }
}

PromoteMenu.propTypes = {
  targetChannels: PropTypes.array.isRequired,
  promoteToChannel: PropTypes.func.isRequired
};
