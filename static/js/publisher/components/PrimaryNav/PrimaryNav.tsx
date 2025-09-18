import {
  SideNavigation,
  SideNavigationText,
} from "@canonical/react-components";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";

import StoreSelector from "../StoreSelector";

import {
  useBrand,
  useBrandStores,
  usePublisher,
  useValidationSets,
} from "../../hooks";

import { brandIdState, brandStoresState } from "../../state/brandStoreState";
import { publisherState } from "../../state/publisherState";

// load all data that's needed for side navigation
function useNavigationData() {
  const { id: storeId } = useParams();
  const { data: publisherData } = usePublisher();
  const { data: validationSetsData } = useValidationSets();
  const { data: brandStoresData } = useBrandStores();
  const { data: brandData } = useBrand(storeId);

  const [brandStores, setBrandStores] = useAtom(brandStoresState);
  const [publisher, setPublisher] = useAtom(publisherState);
  const [brandId, setBrandId] = useAtom(brandIdState);

  const currentStore = brandStores?.find((store) => store.id === storeId);

  useEffect(() => {
    if (brandData) {
      setBrandId(brandData?.["account-id"]);
    } else {
      setBrandId("");
    }
  }, [brandData]);

  useEffect(() => {
    if (brandStoresData) {
      setBrandStores(brandStoresData);
    }
  }, [brandStoresData]);

  useEffect(() => {
    if (publisherData) {
      setPublisher(publisherData.publisher);
    }
  }, [publisherData]);

  return {
    storeId,
    brandId,
    currentStore,
    brandStores,
    publisher,
    validationSets: validationSetsData,
  };
}

function PrimaryNav(): React.JSX.Element {
  const location = useLocation();
  const { storeId, brandId, currentStore, publisher, validationSets } =
    useNavigationData();

  return (
    <>
      <SideNavigation
        dark
        className="hide-collapsed"
        items={[
          {
            items: [
              <div className="nav-list-separator" key="separator">
                <hr />
              </div>,
              <SideNavigationText key="my-snaps">
                <span
                  className="p-side-navigation__item--title p-muted-heading"
                >
                  My snaps
                </span>
              </SideNavigationText>,
              {
                label: "Overview",
                component: NavLink,
                to: "/snaps",
                icon: "pods",
                "aria-current": location.pathname === "/snaps",
              },
            ],
          },
          validationSets && validationSets.length > 0
            ? {
                items: [
                  {
                    label: "My validation sets",
                    component: NavLink,
                    to: "/validation-sets",
                    icon: "topic",
                    "aria-current":
                      location.pathname.includes("/validation-sets"),
                  },
                ],
              }
            : null,
          publisher?.has_stores
            ? {
                items: [
                  <SideNavigationText dark icon="units" key="my-stores-key">
                    <span
                      className="p-side-navigation__item--title p-muted-heading"
                    >
                      My stores
                    </span>
                  </SideNavigationText>,
                  <StoreSelector />,
                ],
              }
            : null,
          currentStore
            ? {
                items: [
                  {
                    label: "Store snaps",
                    component: NavLink,
                    to: `/admin/${storeId}/snaps`,
                    icon: "pods",
                    "aria-current":
                      location.pathname === `/admin/${storeId}/snaps`,
                  },
                  brandId
                    ? {
                        label: "Models",
                        component: NavLink,
                        to: `/admin/${storeId}/models`,
                        icon: "models",
                        "aria-current":
                          location.pathname === `/admin/${storeId}/models`,
                      }
                    : null,
                  brandId
                    ? {
                        label: "Signing keys",
                        component: NavLink,
                        to: `/admin/${storeId}/signing-keys`,
                        icon: "security",
                        "aria-current":
                          location.pathname ===
                          `/admin/${storeId}/signing-keys`,
                      }
                    : null,
                  currentStore?.roles?.includes("admin")
                    ? {
                        label: "Members",
                        component: NavLink,
                        to: `/admin/${storeId}/members`,
                        icon: "user-group",
                        "aria-current":
                          location.pathname === `/admin/${storeId}/members`,
                      }
                    : null,
                  currentStore?.roles?.includes("admin")
                    ? {
                        label: "Settings",
                        component: NavLink,
                        to: `/admin/${storeId}/settings`,
                        icon: "settings",
                        "aria-current":
                          location.pathname === `/admin/${storeId}/settings`,
                      }
                    : null,
                ],
              }
            : null,
        ]}
      />

      <SideNavigation
        dark
        className="pin-bottom"
        items={[
          publisher
            ? {
                items: [
                  <div className="nav-list-separator">
                    <hr />
                  </div>,
                  {
                    label: publisher.fullname,
                    component: NavLink,
                    to: "/admin/account",
                    icon: "user",
                    "aria-current": location.pathname === "/admin/account",
                  },
                  {
                    label: "Logout",
                    href: "/logout",
                    to: "/logout", // useless but otherwise TS complains
                    icon: "log-out",
                  },
                ],
              }
            : null,
        ]}
      />
    </>
  );
}

export default PrimaryNav;
