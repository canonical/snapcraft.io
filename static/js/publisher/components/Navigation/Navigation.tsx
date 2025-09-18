import {
  AppNavigation,
  AppNavigationBar,
  Button,
  Icon,
  Panel,
  Tooltip,
} from "@canonical/react-components";

import useLocalStorage from "../../hooks/useLocalStorage";
import PrimaryNav from "../PrimaryNav";
import Logo from "./Logo";

function Navigation(): React.JSX.Element {
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
          // dark
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
          logo={<Logo />}
          controls={
            <>
              <Button
                hasIcon
                appearance="base"
                className="u-no-margin u-hide--small u-hide--large"
                onClick={() => {
                  setPinSideNavigation(!pinSideNavigation);
                }}
              >
                <Icon light name={pinSideNavigation ? "close" : "pin"} />
              </Button>

              {!collapseNavigation && (
                <Tooltip message="Collapse main navigation" position="right">
                  <Button
                    hasIcon
                    appearance="base"
                    className="u-hide--small u-hide--medium u-no-margin l-navigation-collapse-toggle"
                    aria-label="Collapse main navigation"
                    onClick={() => {
                      setCollapseNavigation(true);
                    }}
                  >
                    <Icon name="toggle-side-nav" />
                  </Button>
                </Tooltip>
              )}
            </>
          }
        >
          {collapseNavigation && (
            <Tooltip message="Expand main navigation" position="right">
              <Button
                hasIcon
                appearance="base"
                className="sidenav-toggle u-hide--small u-hide--medium u-no-margin l-navigation-collapse-toggle"
                aria-label="Expand main navigation"
                onClick={() => {
                  setCollapseNavigation(false);
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
