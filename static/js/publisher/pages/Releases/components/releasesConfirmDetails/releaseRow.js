import PropTypes from "prop-types";

const ReleaseRow = ({ type, revisionInfo }) => (
  <div className="p-release-details-row">
    <span className="p-release-details-row__type">{type}</span>
    <span className="p-release-details-row__info">
      <span className="p-tooltip--btm-center">
        <strong>{revisionInfo.revision}</strong>
        <span className="p-tooltip__message">
          Version: <b>{revisionInfo.version}</b>
        </span>{" "}
        on <strong>{revisionInfo.architectures.join(", ")}</strong>
      </span>
    </span>
  </div>
);

ReleaseRow.propTypes = {
  type: PropTypes.string,
  revisionInfo: PropTypes.object,
};

export default ReleaseRow;
