import { useState } from "react";

import Logo from "./Logo";
import PrimaryNav from "../PrimaryNav";
import {
  AppNavigation,
  AppNavigationBar,
  Panel,
} from "@canonical/react-components";
import useLocalStorage from "../../hooks/useLocalStorage";

function Navigation({}: { sectionName?: string | null }): React.JSX.Element {
  const [collapseNavigation, setCollapseNavigation] = useLocalStorage<boolean>(
    "collapse-nav",
    false,
  );
  const [pinSideNavigation, setPinSideNavigation] = useLocalStorage<boolean>(
    "pin-nav",
    false,
  );

  return (
    <>
      <AppNavigationBar>
        <Panel
          dark
          logo={<Logo />}
          toggle={{
            label: "Menu",
            onClick: () => {
              setCollapseNavigation(!collapseNavigation);
            },
          }}
        ></Panel>
      </AppNavigationBar>

      <AppNavigation collapsed={collapseNavigation} pinned={pinSideNavigation}>
        <Panel
          dark
          header={
            <div className="p-panel__header is-sticky">
              <Logo />
              <div className="p-panel__controls">
                {pinSideNavigation && (
                  <button
                    className="p-button--base is-dark has-icon u-no-margin u-hide--small u-hide--large"
                    onClick={() => {
                      setPinSideNavigation(false);
                    }}
                  >
                    <i className="is-light p-icon--close"></i>
                  </button>
                )}

                {!pinSideNavigation && (
                  <button
                    className="p-button--base is-dark has-icon u-no-margin u-hide--small u-hide--large"
                    onClick={() => {
                      setPinSideNavigation(true);
                    }}
                  >
                    <i className="is-light p-icon--pin"></i>
                  </button>
                )}
              </div>
            </div>
          }
        >
          <PrimaryNav
            collapseNavigation={collapseNavigation}
            setCollapseNavigation={() => {
              setCollapseNavigation(!collapseNavigation);
            }}
          />
        </Panel>
      </AppNavigation>
    </>
  );
}

export default Navigation;
