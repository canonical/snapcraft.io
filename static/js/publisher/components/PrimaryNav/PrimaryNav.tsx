import {
  SideNavigation,
  SideNavigationText,
} from "@canonical/react-components";
import { useAtomValue } from "jotai";
import { NavLink, useLocation, useParams } from "react-router-dom";

import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { publisherState } from "../../state/publisherState";
import { validationSetsState } from "../../state/validationSetsState";
import StoreSelector from "../StoreSelector";
import { accountKeysState } from "../../state/accountKeysState";

function PrimaryNav(): React.JSX.Element {
  const location = useLocation();
  const { id: storeId } = useParams();

  const currentStore = useAtomValue(brandStoreState(storeId));
  const publisher = useAtomValue(publisherState);
  const brandId = useAtomValue(brandIdState);
  const validationSets = useAtomValue(validationSetsState);
  const accountKeys = useAtomValue(accountKeysState);

  return (
    <>
      <SideNavigation
        dark
        className="hide-collapsed"
        items={[
          {
            items: [
              <div className="nav-list-separator" key="separator-1-key">
                <hr />
              </div>,
              <SideNavigationText key="my-snaps">
                <span className="p-side-navigation__item--title p-muted-heading">
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
          accountKeys && accountKeys.length > 0
            ? {
                items: [
                  {
                    label: "My keys",
                    component: NavLink,
                    to: "/admin/account-keys",
                    icon: "private-key",
                    "aria-current": location.pathname.includes(
                      "/admin/account-keys",
                    ),
                  },
                ],
              }
            : null,
          publisher?.has_stores
            ? {
                items: [
                  <SideNavigationText dark icon="units" key="my-stores-key">
                    <span className="p-side-navigation__item--title p-muted-heading">
                      My stores
                    </span>
                  </SideNavigationText>,
                  <StoreSelector key="store-selector-key" />,
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
        className="u-align--bottom"
        items={[
          publisher
            ? {
                items: [
                  <div className="nav-list-separator" key="separator-2-key">
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
                    component: NavLink,
                    to: "/logout",
                    reloadDocument: true,
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
