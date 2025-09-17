import {
  SideNavigation,
  SideNavigationLink,
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

function PrimaryNav({
  collapseNavigation,
  setCollapseNavigation,
}: {
  collapseNavigation: boolean;
  setCollapseNavigation: (value: boolean) => void;
}): React.JSX.Element {
  const location = useLocation();
  const { storeId, brandId, currentStore, publisher, validationSets } =
    useNavigationData();

  return (
    <>
      <SideNavigation
        dark={true}
        items={[
          {
            items: [
              <div className="nav-list-separator" key="separator">
                <hr />
              </div>,
              <SideNavigationText key="my-snaps">
                <span
                  className="p-side-navigation__item--title p-muted-heading"
                  style={{ color: "#a8a8a8" }}
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
                  <SideNavigationText key="my-stores-key">
                    <i className="p-icon--units is-light p-side-navigation__icon"></i>
                    <span
                      className="p-side-navigation__item--title p-muted-heading"
                      style={{ color: "#a8a8a8" }}
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

      {publisher && (
        <div className="p-side-navigation--icons is-dark">
          <div className="sidenav-bottom">
            <div className="nav-list-separator">
              <hr />
            </div>
            <ul className="p-side-navigation__list">
              <li className="p-side-navigation__item">
                <SideNavigationLink
                  component={NavLink}
                  to="/admin/account"
                  icon="user"
                  label={publisher.fullname}
                />
              </li>

              <li className="p-side-navigation__item">
                <a href="/logout" className="p-side-navigation__link">
                  <i className="p-icon--log-out is-light p-side-navigation__icon"></i>
                  <span className="p-side-navigation__label">Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="sidenav-toggle-wrapper u-hide--small u-hide--medium">
        <button
          className="p-button--base has-icon is-dense sidenav-toggle is-dark u-no-margin l-navigation-collapse-toggle "
          aria-label={`${collapseNavigation ? "Collapse" : "Expand"} main navigation`}
          onClick={() => {
            setCollapseNavigation(!collapseNavigation);
          }}
        >
          <i className="p-icon--sidebar-toggle is-light"></i>
        </button>
      </div>
    </>
  );
}

export default PrimaryNav;
