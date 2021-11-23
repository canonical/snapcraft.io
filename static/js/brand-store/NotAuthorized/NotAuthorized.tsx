import React from "react";

function NotAuthorized() {
  return (
    <div className="u-fixed-width">
      <h1>Not authorized</h1>
      <p>
        You don&rsquo;t have permission to view this page. Contact the store
        owner if you think you are getting this in error.
      </p>
    </div>
  );
}

export default NotAuthorized;
