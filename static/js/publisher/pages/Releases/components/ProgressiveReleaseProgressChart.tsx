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
  let current = currentPercentage || 0;
  let target = targetPercentage || 100;

  // Because of reasons if this is a previous revisions the numbers need switching
  if (isPreviousRevision) {
    current = targetPercentage || 0;
    target = currentPercentage || 100;
  }

  return (
    <div
      className={
        isPreviousRevision ? "previous-progressive-progress-chart" : ""
      }
    >
      <div className="progressive-progress-bar u-hide--small">
        <div
          className="progressive-progress-bar__inner"
          style={{ width: `${current}%` }}
        ></div>
        <div
          className="progressive-progress-bar__marker"
          style={{
            left: `${Math.round(target)}%`,
          }}
        ></div>
      </div>
      <div className="u-space-between" style={{ maxWidth: "320px" }}>
        <span>
          {Math.round(current)}
          %
          <br />
          <span className="progressive-chart-key--current p-muted-heading u-hide--small">
            Current
          </span>
        </span>
        <span>&nbsp;→&nbsp;</span>
        <span className="u-align--right">
          {Math.round(target)}%
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
