import React, { Component } from "react";

import ContextualMenu from "./contextualMenu";

interface TargetChannel {
  channel: string;
  display?: string;
  isDisabled: boolean;
  reason?: string;
}

interface ChannelMenuProps {
  channel: string;
  targetChannels: TargetChannel[];
  tooltip?: string;
  promoteToChannel: (channel: string) => void;
  closeChannel?: (channel: string) => void;
  gaEvent: (channel: string, action: string) => void;
}

export default class ChannelMenu extends Component<ChannelMenuProps> {
  menu: ContextualMenu | null = null;
  setMenuRef: (menu: ContextualMenu | null) => void;

  constructor(props: ChannelMenuProps) {
    super(props);
    this.setMenuRef = (menu: ContextualMenu | null) => (this.menu = menu);
  }

  promoteToChannelClick(targetChannel: string, event: React.MouseEvent) {
    this.props.gaEvent(targetChannel, "promote");

    this.props.promoteToChannel(targetChannel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItem(targetChannel: TargetChannel) {
    const { channel, display, isDisabled, reason } = targetChannel;
    const className = [
      "p-contextual-menu__link is-indented",
      isDisabled ? "is-disabled" : "",
    ].join(" ");

    return (
      <span
        key={`promote-to-${channel}`}
        className="p-tooltip p-tooltip--right"
      >
        <span
          className={className}
          onClick={
            isDisabled ? undefined : this.promoteToChannelClick.bind(this, channel)
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

  closeChannelClick(channel: string, event: React.MouseEvent) {
    this.props.gaEvent(channel, "close");

    this.props.closeChannel?.(channel);

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
      (targetChannel) => targetChannel.isDisabled,
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
          className="p-button is-small"
          isDisabled={isDisabled}
          label={canBePromoted ? "Promote/close" : "Close"}
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
