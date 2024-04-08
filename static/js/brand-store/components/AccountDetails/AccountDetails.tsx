import React from "react";

import Navigation from "../Navigation";

function AccountDetails() {
  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName={"account"} />
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content"></div>
        </div>
      </main>
    </div>
  );
}

export default AccountDetails;
