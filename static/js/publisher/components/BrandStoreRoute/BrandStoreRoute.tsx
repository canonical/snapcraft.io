import { Spinner } from "@canonical/react-components";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import { useBrandStores } from "../../hooks";
import StoreNotFound from "../../pages/StoreNotFound";
import { brandStoresState } from "../../state/brandStoreState";
import { Store } from "../../types/shared";

function BrandStoreRoute() {
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
    <Spinner text="Loading..." />
  );
}

export default BrandStoreRoute;
