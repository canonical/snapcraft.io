import React, { useState } from "react";

import PageHeader from "../../../shared/PageHeader";

function App() {
  const [data, setData] = useState(window?.data);

  return (
    <div>
      <PageHeader
        snapName={data.snap_name}
        activeTab="collaboration"
        publisherName={data?.publisher_name}
      />
    </div>
  );
}

export default App;
