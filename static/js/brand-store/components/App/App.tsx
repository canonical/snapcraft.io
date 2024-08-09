import { useEffect, ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { useSetRecoilState } from "recoil";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { fetchStores } from "../../slices/brandStoreSlice";
import { brandStoresListSelector } from "../../selectors";
import { brandStoresState } from "../../atoms";

import AccountDetails from "../AccountDetails";
import Snaps from "../Snaps";
import Members from "../Members";
import Settings from "../Settings";
import Models from "../Models";
import Model from "../Model";
import Policies from "../Model/Policies";
import SigningKeys from "../SigningKeys";
import StoreNotFound from "../StoreNotFound";

import type { StoresList, StoresSlice } from "../../types/shared";

function App(): ReactNode {
  const isLoading = useSelector(
    (state: StoresSlice) => state.brandStores.loading,
  );
  const brandStoresList: StoresList = useSelector(brandStoresListSelector);
  const dispatch = useDispatch();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  const setRecoilBrandStores = useSetRecoilState(brandStoresState);

  useEffect(() => {
    dispatch(fetchStores() as any);
  }, []);

  useEffect(() => {
    if (brandStoresList) {
      setRecoilBrandStores(brandStoresList);
    }
  }, [brandStoresList]);

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/admin"
            element={
              !isLoading ? (
                !brandStoresList || brandStoresList.length < 1 ? (
                  <StoreNotFound />
                ) : brandStoresList[0].id === "ubuntu" ? (
                  // Don't redirect to the global store by default
                  <Navigate
                    to={`/admin/${brandStoresList[1].id}/snaps${window.location.search}`}
                  />
                ) : (
                  <Navigate
                    to={`/admin/${brandStoresList[0].id}/snaps${window.location.search}`}
                  />
                )
              ) : null
            }
          />
          <Route path="/admin/account" element={<AccountDetails />} />
          <Route path="/admin/:id/snaps" element={<Snaps />} />
          <Route path="/admin/:id/members" element={<Members />} />
          <Route path="/admin/:id/settings" element={<Settings />} />
          <Route path="/admin/:id/models" element={<Models />} />
          <Route path="/admin/:id/models/create" element={<Models />} />
          <Route path="/admin/:id/models/:model_id" element={<Model />} />
          <Route
            path="/admin/:id/models/:model_id/policies"
            element={<Policies />}
          />
          <Route
            path="/admin/:id/models/:model_id/policies/create"
            element={<Policies />}
          />
          <Route path="/admin/:id/signing-keys" element={<SigningKeys />} />
          <Route
            path="/admin/:id/signing-keys/create"
            element={<SigningKeys />}
          />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
