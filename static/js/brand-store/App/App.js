import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { fetchStores } from "../slices/brandStoreSlice";
import { brandStoresListSelector } from "../selectors";

import Navigation from "../Navigation";
import Snaps from "../Snaps";
import Members from "../Members";
import Settings from "../Settings";
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
        <Switch>
          <Route exact path="/admin">
            {!isLoading ? (
              !brandStoresList || brandStoresList.length < 1 ? (
                <StoreNotFound />
              ) : brandStoresList[0].id === "ubuntu" ? (
                // Don't redirect to the global store by default
                <Redirect to={`/admin/${brandStoresList[1].id}/snaps`} />
              ) : (
                <Redirect to={`/admin/${brandStoresList[0].id}/snaps`} />
              )
            ) : null}
          </Route>
          <Route exact path="/admin/:id/snaps">
            <Snaps />
          </Route>
          <Route exact path="/admin/:id/members">
            <Members />
          </Route>
          <Route exact path="/admin/:id/settings">
            <Settings />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
