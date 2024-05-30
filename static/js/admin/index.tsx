import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { FeaturedSnaps } from "./pages/index";

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);

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
          <Route path="/admin-dashboard" element={<FeaturedSnaps />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

root.render(<App />);
