import { Col, Icon, Row } from "@canonical/react-components";
import Navigation from "../../components/Navigation";
import AccountKeysTable from "./AccountKeysTable";
import { useRecoilValue } from "recoil";
import { accountKeysState } from "../../state/accountKeysState";

function AccountKeys(): React.JSX.Element {
  const accountKeys = useRecoilValue(accountKeysState);

  return (
    <>
      <div className="l-application" role="presentation">
        <Navigation sectionName={"account"} />

        <main className="l-main">
          <div className="p-panel">
            <div className="p-panel__content">
              {!accountKeys && (
                <div className="u-fixed-width">
                  <Icon name="spinner" className="u-animation--spin" />
                  &nbsp;Loading...
                </div>
              )}

              {/* TODO: how to detect error? */}
              {/* {false && (
                <div className="u-fixed-width">
                  <Notification severity="negative" title="Error:">
                    Something went wrong. Please try again later.
                  </Notification>
                </div>
              )} */}

              {!!accountKeys && (
                <div className="u-fixed-width">
                  <Row>
                    <Col size={12}>
                      <h2 className="p-heading--4">Account keys</h2>
                    </Col>
                  </Row>

                  <Row>
                    <Col size={12}>
                      <AccountKeysTable keys={accountKeys} />
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default AccountKeys;
