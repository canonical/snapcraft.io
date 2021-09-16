import React from "react";

import SectionNav from "../SectionNav";

function Members() {
  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="members" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Members;
