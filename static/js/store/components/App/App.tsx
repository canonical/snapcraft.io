import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

function Test() {
  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}

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
          <Route path="/beta-store" element={<Test />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
