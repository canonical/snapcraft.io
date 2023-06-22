import React from "react";
import { Link, useParams } from "react-router-dom";

import SectionNav from "../SectionNav";

function Models() {
  const { id } = useParams();

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="models" />
          </div>
          <div className="u-fixed-width">
            <p>This is where the models table will be</p>
            <p>
              <Link to={`/admin/${id}/models/model-name`}>
                Example model page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Models;
