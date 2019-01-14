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
    const { channel, isDisabled, reason } = targetChannel;
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
          {channel}
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

  render() {
    const isDisabled = this.props.targetChannels.every(
      targetChannel => targetChannel.isDisabled
    );

    const tooltip = isDisabled
      ? this.props.targetChannels[0].reason
      : undefined;

    const className = `p-releases-channel__promote ${
      tooltip ? "p-tooltip p-tooltip--btm-center" : ""
    }`;

    return (
      <span className={className}>
        <ContextualMenu
          className="p-icon-button"
          appearance="neutral"
          isDisabled={isDisabled}
          label="Promote"
          ref={this.setMenuRef}
        >
          {this.renderItems()}
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

PromoteMenu.propTypes = {
  targetChannels: PropTypes.array.isRequired,
  promoteToChannel: PropTypes.func.isRequired
};
