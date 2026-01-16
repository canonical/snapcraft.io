import React, { Fragment } from "react";
import type { Channel } from "../../../types/releaseTypes";

interface CloseChannelsRowProps {
  channels: Channel["name"][];
}

const CloseChannelsRow = ({ channels }: CloseChannelsRowProps) => {
  let group = Array.from(channels);
  let last: string | undefined;
  if (channels.length > 1) {
    last = group.pop();
  }
  return (
    <div className="p-release-details-row is-closing">
      <span>Close</span>
      <span>
        {group
          .map((channel) => <b key={channel}>{channel}</b>)
          .reduce<(JSX.Element | string)[]>((acc, el) => {
            return acc === null ? [el] : [...acc, ", ", el];
          }, null as unknown as (JSX.Element | string)[])}
        {last ? (
          <Fragment>
            {" "}
            & <b>{last}</b>
          </Fragment>
        ) : (
          ""
        )}
      </span>
    </div>
  );
};

export default CloseChannelsRow;
