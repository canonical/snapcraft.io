import { SetStateAction, useState, Dispatch, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { format } from "date-fns";
import {
  MainTable,
  Button,
  Tooltip,
  TablePagination,
} from "@canonical/react-components";

import DeactivateSigningKeyModal from "./DeactivateSigningKeyModal";

import { useSortTableData } from "../../hooks";

import { sortByDateDescending } from "../../utils";

import {
  filteredSigningKeysListState,
  signingKeysListState,
} from "../../state/signingKeysState";
import { brandIdState } from "../../state/brandStoreState";

import type { SigningKey } from "../../types/shared";

type Props = {
  setShowDisableSuccessNotification: Dispatch<SetStateAction<boolean>>;
  enableTableActions: boolean;
};

function SigningKeysTable({
  setShowDisableSuccessNotification,
  enableTableActions,
}: Props): React.JSX.Element {
  useParams();
  const brandId = useAtomValue(brandIdState);
  const signingKeysList = useAtomValue<Array<SigningKey>>(
    filteredSigningKeysListState,
  );
  const setSigningKeysList = useSetAtom(signingKeysListState);
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
      `/api/store/${brandId}/signing-keys/${signingKey["sha3-384"]}`,
      {
        method: "DELETE",
        body: formData,
      },
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

    setTimeout(() => {
      setModalOpen(false);
      setIsDeleting(false);
    }, 500);

    setTimeout(() => {
      setShowDisableSuccessNotification(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      setSigningKeysList([]);
    };
  }, []);

  const headers = [
    {
      content: `Name (${signingKeysList.length})`,
      sortKey: "name",
      style: {
        width: "320px",
      },
    },
    {
      content: "Policies",
      sortKey: "policy",
      className: "u-align--right",
      style: {
        width: "80px",
      },
    },
    {
      content: "Models",
      sortKey: "models",
      className: "u-align--right",
      style: {
        width: "80px",
      },
    },
    {
      content: "Created date",
      sortKey: "created-at",
      className: "u-align--right",
      style: {
        width: "120px",
      },
    },
    {
      content: "Fingerprint",
      sortKey: "fingerprint",
    },
    {
      content: "",
      className: "u-align--right",
      style: {
        width: "150px",
      },
    },
  ];

  const rows = signingKeysList.map((signingKey: SigningKey) => {
    return {
      columns: [
        {
          content: signingKey["name"],
          className: "u-truncate",
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
            signingKey["created-at"] && signingKey["created-at"] !== null
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
              disabled={isDeleting || !enableTableActions}
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
  });

  const { rows: sortedRows, updateSort } = useSortTableData({ rows });

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

      <TablePagination
        data={sortedRows}
        pageLimits={[25, 50, 100, 200]}
        position="below"
      >
        <MainTable
          data-testid="signing-keys-table"
          sortable
          onUpdateSort={updateSort}
          emptyStateMsg="No signing keys match this filter"
          headers={headers}
        />
      </TablePagination>
    </>
  );
}

export default SigningKeysTable;
