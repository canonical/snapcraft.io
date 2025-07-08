import { useEffect } from "react";
import { useSetAtom as useSetJotaiState } from "jotai";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { brandStoresState } from "../state/brandStoreState";

import { useBrandStores } from "../hooks";

import AccountDetails from "../pages/AccountDetails";
import Snaps from "../pages/Snaps";
import Members from "../pages/Members";
import BrandStoreSettings from "../pages/BrandStoreSettings";
import Models from "../pages/Models";
import Model from "../pages/Model";
import Policies from "../pages/Model/Policies";
import SigningKeys from "../pages/SigningKeys";
import StoreNotFound from "../pages/StoreNotFound";

function BrandStoreRoot() {
  const { data: brandStoresList, isLoading } = useBrandStores();

  const setRecoilBrandStores = useSetJotaiState(brandStoresState);

  useEffect(() => {
    if (brandStoresList) {
      setRecoilBrandStores(brandStoresList);
    }
  }, [brandStoresList]);

  return (
    <Router>
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
        <Route path="/admin/:id/settings" element={<BrandStoreSettings />} />
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
    </Router>
  );
}

export default BrandStoreRoot;
