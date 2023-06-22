import React from "react";
import { Link, useParams } from "react-router-dom";

import ModelNav from "./ModelNav";

function Policies() {
  const { id } = useParams();

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <Link to={`/admin/${id}/models`}>&lsaquo;&nbsp;Models</Link>
          </div>
          <div className="u-fixed-width">
            <ModelNav sectionName="policies" />
          </div>
          <div className="u-fixed-width">
            <p>This is where the policies table will be</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Policies;
