import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Packages from "../../pages/Packages";

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
          <Route path="/store" element={<Packages />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
