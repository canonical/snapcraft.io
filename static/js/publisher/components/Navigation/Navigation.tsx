import {
  AppNavigation,
  AppNavigationBar,
  Button,
  Icon,
  Panel,
  Tooltip,
} from "@canonical/react-components";

import { useState } from "react";
import useLocalStorage from "../../hooks/useLocalStorage";
import PrimaryNav from "../PrimaryNav";
import Logo from "./Logo";

function Navigation(): React.JSX.Element {
  // persist navigation state between refreshes for desktop and tablet
  const [collapseDesktopNavigation, setCollapseDesktopNavigation] =
    useLocalStorage<boolean>("collapse-desktop-nav", false);
  const [pinTabletNavigation, setPinTabletNavigation] =
    useLocalStorage<boolean>("pin-nav", false);

  // don't persist mobile navigation state between refreshes
  const [collapseMobileNavigation, setCollapseMobileNavigation] =
    useState<boolean>(true);

  return (
    <>
      <AppNavigationBar>
        <Panel
          dark
          logo={<Logo />}
          toggle={{
            label: "Menu",
            onClick: () => {
              setCollapseMobileNavigation(!collapseMobileNavigation);
            },
          }}
        ></Panel>
      </AppNavigationBar>

      <AppNavigation
        className={collapseDesktopNavigation ? "is-collapsed--desktop" : ""}
        collapsed={collapseMobileNavigation}
        pinned={pinTabletNavigation}
      >
        <Panel
          dark
          stickyHeader
          className="u-flex-column"
          contentClassName="u-flex-grow u-flex-column u-no-padding"
          logo={<Logo />}
          controls={
            <>
              <Button
                hasIcon
                appearance="base"
                className="u-no-margin u-hide--small u-hide--large"
                onClick={() => {
                  setPinTabletNavigation(!pinTabletNavigation);
                }}
              >
                <Icon light name={pinTabletNavigation ? "close" : "pin"} />
              </Button>

              {!collapseDesktopNavigation && (
                <Tooltip message="Collapse main navigation" position="right">
                  <Button
                    hasIcon
                    appearance="base"
                    className="u-hide--small u-hide--medium u-no-margin l-navigation__collapse-toggle"
                    aria-label="Collapse main navigation"
                    onClick={() => {
                      setCollapseDesktopNavigation(true);
                    }}
                  >
                    <Icon name="toggle-side-nav" />
                  </Button>
                </Tooltip>
              )}
            </>
          }
        >
          {collapseDesktopNavigation && (
            <Tooltip message="Expand main navigation" position="right">
              <Button
                hasIcon
                appearance="base"
                className="u-hide--small u-hide--medium u-no-margin l-navigation__collapse-toggle"
                aria-label="Expand main navigation"
                onClick={() => {
                  setCollapseDesktopNavigation(false);
                }}
              >
                <Icon name="toggle-side-nav" />
              </Button>
            </Tooltip>
          )}

          <PrimaryNav />
        </Panel>
      </AppNavigation>
    </>
  );
}

export default Navigation;
