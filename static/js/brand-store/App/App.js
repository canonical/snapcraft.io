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
import Invites from "../Invites";
import Settings from "../Settings";
import NoStores from "../NoStores";

function App() {
  const isLoading = useSelector((state) => state.brandStores.loading);
  const brandStoresList = useSelector(brandStoresListSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  return (
    <Router>
      <div className="l-application" role="presentation">
        <Navigation />
        <Switch>
          <Route exact path="/admin">
            {!isLoading ? (
              brandStoresList.length < 1 ? (
                <NoStores />
              ) : (
                <Redirect to={`/admin/${brandStoresList[0].id}/snaps`} />
              )
            ) : (
              <h1>Loading...</h1>
            )}
          </Route>
          <Route exact path="/admin/:id/snaps">
            <Snaps />
          </Route>
          <Route exact path="/admin/:id/members">
            <Members />
          </Route>
          <Route exact path="/admin/:id/members/invites">
            <Invites />
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
