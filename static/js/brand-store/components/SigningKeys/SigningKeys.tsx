import React from "react";

import SectionNav from "../SectionNav";

function SigningKeys() {
  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="signing-keys" />
          </div>
          <div className="u-fixed-width">
            <p>This is where the signing keys table will be</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SigningKeys;
