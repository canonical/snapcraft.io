import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { fetchStores } from "../slices/brandStoreSlice";
import { brandStoresListSelector } from "../selectors";

import Navigation from "../Navigation";
import Snaps from "../Snaps";
import Members from "../Members";
import Settings from "../Settings";
import Models from "../Models";
import Model from "../Model";
import Policies from "../Model/Policies";
import SigningKeys from "../SigningKeys";
import StoreNotFound from "../StoreNotFound";

function App() {
  const isLoading = useSelector((state) => state.brandStores.loading);
  const brandStoresList = useSelector(brandStoresListSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchStores());
  }, []);

  return (
    <Router>
      <div className="l-application" role="presentation">
        <Navigation />
        <Routes>
          <Route
            exact
            path="/admin"
            element={
              !isLoading ? (
                !brandStoresList || brandStoresList.length < 1 ? (
                  <StoreNotFound />
                ) : brandStoresList[0].id === "ubuntu" ? (
                  // Don't redirect to the global store by default
                  <Navigate to={`/admin/${brandStoresList[1].id}/snaps`} />
                ) : (
                  <Navigate to={`/admin/${brandStoresList[0].id}/snaps`} />
                )
              ) : null
            }
          />
          <Route exact path="/admin/:id/snaps" element={<Snaps />} />
          <Route exact path="/admin/:id/members" element={<Members />} />
          <Route exact path="/admin/:id/settings" element={<Settings />} />
          <Route exact path="/admin/:id/models" element={<Models />} />
          <Route exact path="/admin/:id/models/:model_id" element={<Model />} />
          <Route
            exact
            path="/admin/:id/models/:model_id/policies"
            element={<Policies />}
          />
          <Route
            exact
            path="/admin/:id/signing-keys"
            element={<SigningKeys />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
