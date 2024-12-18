type ReleaseProgress = {
  currentPercentage: number;
  targetPercentage: number;
  isPreviousRevision: boolean;
};

function ProgressiveReleaseProgressChart({
  currentPercentage,
  targetPercentage,
  isPreviousRevision,
}: ReleaseProgress) {
  return (
    <div
      className={
        isPreviousRevision ? "previous-progressive-progress-chart" : ""
      }
    >
      <div className="progressive-progress-bar u-hide--small">
        <div
          className="progressive-progress-bar__inner"
          style={{ width: `${currentPercentage ? currentPercentage : 0}%` }}
        ></div>
        <div
          className="progressive-progress-bar__marker"
          style={{
            left: `${Math.round(targetPercentage ? targetPercentage : 0)}%`,
          }}
        ></div>
      </div>
      <div className="u-space-between" style={{ maxWidth: "320px" }}>
        <span>
          {Math.round(currentPercentage ? currentPercentage : 0)}
          %
          <br />
          <span className="progressive-chart-key--current p-muted-heading u-hide--small">
            Current
          </span>
        </span>
        <span>&nbsp;→&nbsp;</span>
        <span className="u-align--right">
          {Math.round(targetPercentage ? targetPercentage : 0)}%
          <br />
          <span className="progressive-chart-key--target p-muted-heading u-hide--small">
            Target
          </span>
        </span>
      </div>
    </div>
  );
}

export default ProgressiveReleaseProgressChart;
