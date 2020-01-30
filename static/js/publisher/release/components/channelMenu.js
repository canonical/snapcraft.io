import React, { Component } from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class ChannelMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  promoteToChannelClick(targetChannel, event) {
    this.props.gaEvent(targetChannel, "promote");

    this.props.promoteToChannel(targetChannel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItem(targetChannel) {
    const { channel, display, isDisabled, reason } = targetChannel;
    const className = [
      "p-contextual-menu__link is-indented",
      isDisabled ? "is-disabled" : ""
    ].join(" ");

    return (
      <span
        key={`promote-to-${channel}`}
        className="p-tooltip p-tooltip--btm-center"
      >
        <span
          className={className}
          onClick={
            isDisabled ? null : this.promoteToChannelClick.bind(this, channel)
          }
        >
          {display ? display : channel}
        </span>
        {reason && (
          <span
            className="p-tooltip__message u-align--center"
            role="tooltip"
            id={`promote-to-${channel}-devmode`}
          >
            {reason}
          </span>
        )}
      </span>
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

  closeChannelClick(channel, event) {
    this.props.gaEvent(channel, "close");

    this.props.closeChannel(channel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderClose() {
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
    const canBePromoted = !this.props.targetChannels.every(
      targetChannel => targetChannel.isDisabled
    );

    const isDisabled = !canBePromoted && !this.props.closeChannel;

    // if tooltip is provided, use it
    // otherwise if all items are disabled use the tooltip from disabled channel
    const tooltip =
      this.props.tooltip ||
      (isDisabled ? this.props.targetChannels[0].reason : undefined);

    const className = `${tooltip ? "p-tooltip p-tooltip--btm-center" : ""}`;

    return (
      <span className={className}>
        <ContextualMenu
          className="p-icon-button"
          appearance="base"
          isDisabled={isDisabled}
          label={<i className="p-icon--settings" />}
          ref={this.setMenuRef}
        >
          {canBePromoted && this.renderItems()}
          {this.props.closeChannel && this.renderClose()}
        </ContextualMenu>
        {tooltip && (
          <span className="p-tooltip__message u-align--center" role="tooltip">
            {tooltip}
          </span>
        )}
      </span>
    );
  }
}

ChannelMenu.propTypes = {
  channel: PropTypes.string.isRequired,
  targetChannels: PropTypes.array.isRequired,
  tooltip: PropTypes.string,
  promoteToChannel: PropTypes.func.isRequired,
  closeChannel: PropTypes.func,
  gaEvent: PropTypes.func.isRequired
};
