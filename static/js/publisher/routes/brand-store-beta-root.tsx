import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useBrandStores } from "../hooks";

function BrandStoreBetaRoute() {
  const { data: brandStoresList, isLoading } = useBrandStores();

  return (
    <Router>
      <Routes>
        <Route path="/admin-beta" element={<h1>Hi</h1>} />
      </Routes>
    </Router>
  );
}

export default BrandStoreBetaRoute;
