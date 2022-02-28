import React from "react";

function ReviewerAndPublisher() {
  return (
    <div className="u-fixed-width">
      <h1>Reviewer and publisher</h1>
      <p>
        As a reviewer you can{" "}
        <a href={`${window.API_URL}stores/reviews/`}>
          manage your snaps on the dashboard
        </a>
        .
      </p>
      <p>
        As a publisher you can{" "}
        <a href="/snaps">register a snap name on the Snap store</a>.
      </p>
    </div>
  );
}

export default ReviewerAndPublisher;
