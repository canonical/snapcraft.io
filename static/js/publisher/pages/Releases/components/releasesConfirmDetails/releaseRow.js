import PropTypes from "prop-types";

const ReleaseRow = ({ type, revisionInfo, channel }) => (
  <p>
    <span className="p-release-details-row__type">{type}</span>
    <span className="p-release-details-row__info">
      <span className="p-tooltip--btm-center">
        <b>{revisionInfo.revision}</b> to{" "}
        <span className="p-tooltip__message">
          Version: <b>{revisionInfo.version}</b>
        </span>{" "}
        <b>{channel}</b> on <b>{revisionInfo.architectures.join(", ")}</b>
      </span>
    </span>
  </p>
);

ReleaseRow.propTypes = {
  type: PropTypes.string,
  revisionInfo: PropTypes.object,
  channel: PropTypes.node,
};

export default ReleaseRow;
