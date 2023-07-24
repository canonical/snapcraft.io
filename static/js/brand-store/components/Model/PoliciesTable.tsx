import React from "react";
import { useRecoilValue } from "recoil";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { signingKeysListState } from "../../atoms";
import { filteredPoliciesListState } from "../../selectors";

import type { Policy, SigningKey } from "../../types/shared";

function ModelsTable() {
  const { id } = useParams();
  const policiesList = useRecoilValue<Array<Policy>>(filteredPoliciesListState);
  const signingKeys = useRecoilValue<Array<SigningKey>>(signingKeysListState);

  return (
    <MainTable
      data-testid="policies-table"
      sortable
      paginate={20}
      emptyStateMsg="No policies available"
      headers={[
        {
          content: "Revision",
          sortKey: "revision",
        },
        {
          content: "Signing key",
          sortKey: "name",
          className: "u-align--right",
        },
        {
          content: "Creation date",
          sortKey: "created-at",
          className: "u-align--right",
        },
        {
          content: "Last updated",
          sortKey: "modified-at",
          className: "u-align--right",
        },
      ]}
      rows={policiesList.map((policy: Policy) => {
        return {
          columns: [
            {
              content: policy.revision,
            },
            {
              content: (
                <Link
                  to={`/admin/${id}/signing-keys/${policy["signing-key-sha3-384"]}`}
                >
                  {policy["signing-key-name"]}
                </Link>
              ),
              className: "u-align--right",
            },
            {
              content: format(new Date(policy["created-at"]), "dd/MM/yyyy"),
              className: "u-align--right",
            },
            {
              content: policy["modified-at"]
                ? format(new Date(policy["modified-at"]), "dd/MM/yyyy")
                : "-",
              className: "u-align--right",
            },
          ],
          sortData: {
            revision: policy.revision,
            name: policy["signing-key-name"],
            "created-at": policy["created-at"],
            "modified-at": policy["modified-at"],
          },
        };
      })}
    />
  );
}

export default ModelsTable;
