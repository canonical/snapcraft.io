import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { format } from "date-fns";
import { MainTable, Button, Tooltip } from "@canonical/react-components";
import DeactivateSigningKeyModal from "./DeactivateSigningKeyModal";

import { sortByDateDescending } from "../../utils";

import { filteredSigningKeysListState } from "../../selectors";
import { signingKeysListState } from "../../atoms";

import type { SigningKey } from "../../types/shared";

type Props = {
  setShowDisableSuccessNotification: Function;
};

function SigningKeysTable({ setShowDisableSuccessNotification }: Props) {
  const { id } = useParams();
  const signingKeysList = useRecoilValue<Array<SigningKey>>(
    filteredSigningKeysListState
  );
  const setSigningKeysList = useSetRecoilState(signingKeysListState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSigningKey, setSelectedSigningKey] = useState<SigningKey>();

  const handleDisableClick = (signingKey: SigningKey) => {
    setSelectedSigningKey(signingKey);
    setModalOpen(true);
  };

  const handleDisable = async (signingKey: SigningKey) => {
    if (!signingKey || !signingKey["sha3-384"]) {
      throw new Error(`Invalid signing key: ${signingKey}`);
    }

    setIsDeleting(true);

    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);

    const response = await fetch(
      `/admin/store/${id}/signing-keys/${signingKey["sha3-384"]}`,
      {
        method: "DELETE",
        body: formData,
      }
    );

    if (!response.ok) {
      setIsDeleting(false);
      setModalOpen(false);
      throw new Error("Unable to disable signing key");
    }

    setShowDisableSuccessNotification(true);

    setSigningKeysList((oldSigningKeysList: Array<SigningKey>) => {
      if (!selectedSigningKey) {
        return oldSigningKeysList.sort(sortByDateDescending);
      }

      return oldSigningKeysList
        .filter((key) => key.fingerprint !== selectedSigningKey.fingerprint)
        .sort(sortByDateDescending);
    });

    setModalOpen(false);
    setIsDeleting(false);

    setTimeout(() => {
      setShowDisableSuccessNotification(false);
    }, 5000);
  };

  return (
    <>
      {selectedSigningKey && modalOpen && (
        <DeactivateSigningKeyModal
          setModalOpen={setModalOpen}
          handleDisable={handleDisable}
          isDeleting={isDeleting}
          signingKey={selectedSigningKey}
        />
      )}

      <MainTable
        data-testid="signing-keys-table"
        sortable
        paginate={20}
        emptyStateMsg="No signing keys match this filter"
        headers={[
          {
            content: `Name (${signingKeysList.length})`,
            sortKey: "name",
          },
          {
            content: "Policies",
            sortKey: "policy",
            className: "u-align--right",
          },
          {
            content: "Models",
            sortKey: "models",
            className: "u-align--right",
          },
          {
            content: "Created date",
            sortKey: "created-at",
            className: "u-align--right",
          },
          {
            content: "fingerprint",
            sortKey: "fingerprint",
            className: "u-align--right",
          },
          {
            content: "",
            className: "u-align--right",
          },
        ]}
        rows={signingKeysList.map((signingKey: SigningKey) => {
          return {
            columns: [
              {
                content: signingKey["name"],
              },
              {
                content: signingKey.policies ? signingKey.policies.length : 0,
                className: "u-align--right",
              },
              {
                content: (
                  <Tooltip
                    position="btm-right"
                    message={
                      <ul className="p-list u-no-margin--bottom">
                        {signingKey.models &&
                          signingKey.models.map((model) => (
                            <li key={model}>{model}</li>
                          ))}
                      </ul>
                    }
                  >
                    {signingKey.models ? signingKey.models.length : "0"}
                  </Tooltip>
                ),
                className: "u-align--right",
              },
              {
                content:
                  signingKey["created-at"] !== null
                    ? format(new Date(signingKey["created-at"]), "dd/MM/yyyy")
                    : "-",
                className: "u-align--right",
              },
              {
                content: signingKey["fingerprint"],
                className: "u-align--right",
              },
              {
                content: (
                  <Button
                    dense
                    onClick={() => {
                      handleDisableClick(signingKey);
                    }}
                    disabled={isDeleting}
                  >
                    Deactivate
                  </Button>
                ),
                className: "u-align--right",
              },
            ],
            sortData: {
              name: signingKey.name,
              policies: signingKey?.policies?.length,
              models: signingKey?.models?.length,
              "created-at": signingKey["created-at"],
              fingerprint: signingKey.fingerprint,
            },
          };
        })}
      />
    </>
  );
}

export default SigningKeysTable;
