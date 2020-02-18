import React, { Fragment } from "react";
import PropTypes from "prop-types";

const CloseChannelsRow = ({ channels }) => {
  let group = Array.from(channels);
  let last;
  if (channels.length > 1) {
    last = group.pop();
  }
  return (
    <div className="p-release-details-row is-closing">
      <span>Close</span>
      <span>
        {group
          .map(channel => <b key={channel}>{channel}</b>)
          .reduce((acc, el) => {
            return acc === null ? [el] : [...acc, ", ", el];
          }, null)}
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

CloseChannelsRow.propTypes = {
  channels: PropTypes.array
};

export default CloseChannelsRow;
