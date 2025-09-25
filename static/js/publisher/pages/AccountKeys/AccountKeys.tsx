import {
  Col,
  Row
} from "@canonical/react-components";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import Navigation from "../../components/Navigation";
import { accountKeysState } from "../../state/accountKeysState";
import AccountKeysError from "./AccountKeyError";
import AccountKeysLoading from "./AccountKeyLoading";
import AccountKeysSearch from "./AccountKeySearch";
import AccountKeysTable from "./AccountKeysTable";

function AccountKeys(): React.JSX.Element {
  const { data, isLoading, isError } = useAtomValue(accountKeysState);
  const hasKeys = !isLoading && !isError && !!data?.length;
  const [searchName, setSearchName] = useState<string>("");

  const filteredData = useMemo(() => {
    if (!searchName) return data ?? [];

    return (data ?? []).filter((k) => k.name.includes(searchName));
  }, [data, searchName]);

  return (
    <>
      <div className="l-application" role="presentation">
        <Navigation sectionName={"account"} />

        <main className="l-main">
          <div className="p-panel">
            <div className="p-panel__content">
              <Row>
                <Col size={12}>
                  <h2 className="p-heading--4">Account keys</h2>
                </Col>
              </Row>

              {hasKeys && (
                <div className="u-fixed-width">
                  <Row>
                    <Col size={6}>
                      <AccountKeysSearch
                        value={searchName}
                        onChange={setSearchName}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <AccountKeysTable keys={filteredData} />
                  </Row>
                </div>
              )}

              {isLoading && <AccountKeysLoading />}

              {isError && <AccountKeysError />}

              {!isLoading && !isError && !hasKeys && (
                <div className="u-fixed-width">
                  There are no keys associated to your account
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
