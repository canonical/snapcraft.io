import { applyTheme, Icon, loadTheme } from "@canonical/react-components";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import Navigation from "../components/Navigation";
import { useBrandStores } from "../hooks";
import useSideNavigationData from "../hooks/useSideNavigationData";
import StoreNotFound from "../pages/StoreNotFound";
import { brandStoresState } from "../state/brandStoreState";
import { Store } from "../types/shared";

// TODO: get rid of this file and create a common layout for all the pages in the app

function BrandStoreLoader() {
  return (
    <div className="l-application">
      <Navigation />

      <main className="l-main">
        <div className="p-panel--loading">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <Icon name="spinner" className="u-animation--spin" />
              &nbsp;Loading...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BrandStoreLayout() {
  useSideNavigationData();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: brandStoresList, isLoading } = useBrandStores();
  const { id: storeId } = useParams();

  const isAdminPage = location.pathname === "/admin";
  const hasStoreId = storeId !== undefined;
  const userHasStores = brandStoresList?.length > 0;
  const userHasCurrentStore = !!brandStoresList?.find(
    (store: Store) => store.id === storeId,
  );

  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
  }, []);

  const setBrandStores = useSetAtom(brandStoresState);

  useEffect(() => {
    if (brandStoresList) {
      setBrandStores(brandStoresList);
    }
  }, [brandStoresList]);

  useEffect(() => {
    // if location is /admin, redirect user to their first store
    if (isAdminPage && userHasStores && brandStoresList) {
      const [store0, store1 /*, ..._*/] = brandStoresList;
      const redirectStoreId =
        store0.id === "ubuntu" && store1 ? store1.id : store0.id;
      // don't redirect to the global store by default
      navigate(`${redirectStoreId}/snaps${window.location.search}`);
    }
  }, [isAdminPage, userHasStores, brandStoresList, navigate, location.search]);

  return !isLoading ? (
    !hasStoreId || (userHasStores && userHasCurrentStore) ? (
      <Outlet />
    ) : (
      <StoreNotFound />
    )
  ) : (
    <BrandStoreLoader />
  );
}

export default BrandStoreLayout;
