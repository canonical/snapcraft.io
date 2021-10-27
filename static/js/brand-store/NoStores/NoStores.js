import React from "react";

function NoStores() {
  return (
    <main className="l-main">
      <div className="p-panel--settings">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <h1>No stores</h1>
            <p>
              Currently this section can only show stores if you are a viewer or
              an admin. If you are a publisher or reviewer you will find your
              stores{" "}
              <a href="https://dashboard.snapcraft.io/stores/">
                on the dashboard
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default NoStores;
