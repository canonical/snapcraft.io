import React from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class ChannelMenu extends ContextualMenu {
  closeChannelClick(channel, event) {
    this.props.closeChannel(channel);
    this.itemClickHandler(event);
  }

  renderItems() {
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
}

ChannelMenu.propTypes = {
  channel: PropTypes.string.isRequired,
  closeChannel: PropTypes.func.isRequired
};
