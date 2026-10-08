import {
  AppNavigation,
  AppNavigationBar,
  Panel,
} from "@canonical/react-components";
import { withTooltip, Icon, Button } from "@canonical/react-ds-global";

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

  const CollapseNavigationWithTooltip = withTooltip(
    Button,
    "Collapse main navigation",
  );
  const ExpandNavigationWithTooltip = withTooltip(
    Button,
    "Expand main navigation",
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
                importance="tertiary"
                className="u-no-margin u-hide--small u-hide--large"
                onClick={() => {
                  setPinTabletNavigation(!pinTabletNavigation);
                }}
              >
                <Icon icon={pinTabletNavigation ? "close" : "pin"} />
              </Button>

              {!collapseDesktopNavigation && (
                <CollapseNavigationWithTooltip
                  importance="tertiary"
                  className="u-hide--small u-hide--medium u-no-margin-bottom"
                  aria-label="Collapse main navigation"
                  onClick={() => {
                    setCollapseDesktopNavigation(true);
                  }}
                >
                  <Icon icon="collapse-side-nav" />
                </CollapseNavigationWithTooltip>
              )}
            </>
          }
        >
          {collapseDesktopNavigation && (
            <ExpandNavigationWithTooltip
              importance="tertiary"
              className="u-hide--small u-hide--medium u-no-margin-bottom"
              aria-label="Expand main navigation"
              onClick={() => {
                setCollapseDesktopNavigation(false);
              }}
            >
              <Icon icon="expand-side-nav" />
            </ExpandNavigationWithTooltip>
          )}

          <PrimaryNav />
        </Panel>
      </AppNavigation>
    </>
  );
}

export default Navigation;
