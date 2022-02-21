import React from "react";

function Reviewer() {
  return (
    <div className="u-fixed-width">
      <h1>Reviewer</h1>
      <p>
        As a reviewer you can{" "}
        <a href={`${window.API_URL}stores/reviews/`}>
          manage your snaps on the dashboard
        </a>
        .
      </p>
    </div>
  );
}

export default Reviewer;
