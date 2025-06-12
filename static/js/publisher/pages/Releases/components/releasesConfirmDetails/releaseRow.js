import PropTypes from "prop-types";

const ReleaseRow = ({ type, revisionInfo, channel }) => (
  <p>
    <span className="p-tooltip--btm-center">
      {type} <strong>{revisionInfo.revision}</strong> to{" "}
      <span className="p-tooltip__message">
        Version: <b>{revisionInfo.version}</b>
      </span>{" "}
      <strong>{channel}</strong> on{" "}
      <strong>{revisionInfo.architectures.join(", ")}</strong>
    </span>
  </p>
);

ReleaseRow.propTypes = {
  type: PropTypes.string,
  revisionInfo: PropTypes.object,
  channel: PropTypes.node,
};

export default ReleaseRow;
