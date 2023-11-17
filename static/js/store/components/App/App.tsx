import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Packages from "../Packages";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/beta-store" element={<Packages />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
