import React from "react";
import { useParams } from "react-router-dom";

function Snaps() {
  const { id } = useParams();

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__header">
          <h1>Snaps {id}</h1>
        </div>
        <div className="p-panel__content">Page content</div>
      </div>
    </main>
  );
}

export default Snaps;
