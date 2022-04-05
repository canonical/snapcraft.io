import React from "react";

function Publisher() {
  return (
    <div className="u-fixed-width">
      <h1>Publisher</h1>
      <p>
        As a publisher you can{" "}
        <a href="/snaps">register a snap name on the Snap store</a> and{" "}
        <a href={`${window.API_URL}stores/snaps/`}>
          manage your snaps on the dashboard
        </a>
        .
      </p>
    </div>
  );
}

export default Publisher;
