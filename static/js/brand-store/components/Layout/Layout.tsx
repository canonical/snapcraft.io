import React, { useState } from "react";
import Navigation from "./Navigation";

function Layout() {
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);

  return (
    <div className="l-application" role="presentation">
      <Navigation />
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__header">
            <h1 className="p-panel__title p-heading--4">Panel title</h1>
            <div className="p-panel__controls">
              <button
                className="u-no-margin--bottom"
                onClick={() => {
                  setShowSidePanel(true);
                }}
              >
                Open aside
              </button>
            </div>
          </div>
          <div className="p-panel__content"></div>
        </div>
      </main>

      {showSidePanel && (
        <div
          className="aside-overlay"
          onClick={() => {
            setShowSidePanel(false);
          }}
        ></div>
      )}
      <aside className={`l-aside ${!showSidePanel ? "is-collapsed" : ""}`}>
        <div className="p-panel">
          <div className="p-panel__header">
            <h2 className="p-panel__title p-heading--4">Aside panel</h2>
            <div className="p-panel__controls">
              <button
                className="p-button--base u-no-margin--bottom has-icon"
                onClick={() => {
                  setShowSidePanel(false);
                }}
              >
                <i className="p-icon--close"></i>
              </button>
            </div>
          </div>
          <div className="p-panel__content"></div>
        </div>
      </aside>
    </div>
  );
}

export default Layout;
