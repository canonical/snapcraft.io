import { Col, Row } from "@canonical/react-components";
import { useMemo, useState } from "react";

import { useAccountKeys } from "../../hooks";
import AccountKeysError from "./AccountKeyError";
import AccountKeysLoading from "./AccountKeyLoading";
import AccountKeysSearch from "./AccountKeySearch";
import AccountKeysTable from "./AccountKeysTable";

function AccountKeys(): React.JSX.Element {
  const { data, isLoading, isError } = useAccountKeys();
  const hasKeys = !isLoading && !isError && !!data?.length;
  const [searchName, setSearchName] = useState<string>("");

  const hasConstraints = useMemo(() => {
    return (data ?? []).some((k) => !!k.constraints?.length);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!searchName) return data ?? [];

    return (data ?? []).filter((k) => k.name.includes(searchName));
  }, [data, searchName]);

  return (
    <>
      <Row>
        <Col size={12}>
          <h2 className="p-heading--4">Account keys</h2>
        </Col>
      </Row>

      {hasKeys && (
        <div className="u-fixed-width">
          <Row>
            <Col size={6}>
              <AccountKeysSearch value={searchName} onChange={setSearchName} />
            </Col>
          </Row>

          <Row style={{ overflow: "auto" }}>
            <AccountKeysTable
              keys={filteredData}
              hasConstraints={hasConstraints}
            />
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
    </>
  );
}

export default AccountKeys;
