import React, { useState } from "react";

function App() {
  const [listingData, setListingData] = useState(window.listingData);

  return (
    <section className="p-strip">
      <div className="u-fixed-width">
        <h1>Snap listing page</h1>
      </div>
    </section>
  );
}

export default App;
