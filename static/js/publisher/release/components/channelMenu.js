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

  render() {
    return (
      <ContextualMenu
        appearance="base"
        ref={this.setMenuRef}
        className="p-icon-button"
      >
        {this.renderItems()}
      </ContextualMenu>
    );
  }
}

ChannelMenu.propTypes = {
  channel: PropTypes.string.isRequired,
  closeChannel: PropTypes.func.isRequired
};
