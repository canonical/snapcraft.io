import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { MainTable, Button, Modal, Icon } from "@canonical/react-components";

import { usePolicies } from "../../hooks";
import { filteredPoliciesListState } from "../../selectors";

import type { Policy } from "../../types/shared";

type Props = {
  setShowDeletePolicyNotification: Function;
  setShowDeletePolicyErrorNotification: Function;
};

function ModelsTable({
  setShowDeletePolicyNotification,
  setShowDeletePolicyErrorNotification,
}: Props) {
  const { id, model_id } = useParams();
  const [policiesList, setPoliciesList] = useRecoilState(
    filteredPoliciesListState
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedPolicy, setSelectedPolicy] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { refetch }: any = usePolicies(id, model_id);

  const deletePolicy = async (policyRevision: number | undefined) => {
    if (policyRevision === undefined) {
      return;
    }

    setIsLoading(true);

    setPoliciesList(
      policiesList.filter((policy) => policy.revision !== policyRevision)
    );

    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);

    const response = await fetch(
      `/admin/store/${id}/models/${model_id}/policies/${policyRevision}`,
      {
        method: "DELETE",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setShowDeletePolicyErrorNotification(true);
      setTimeout(() => {
        setShowDeletePolicyErrorNotification(false);
      }, 5000);

      throw new Error("Unable to delete policy");
    }

    if (!data.success) {
      setShowDeletePolicyErrorNotification(true);
      setTimeout(() => {
        setShowDeletePolicyErrorNotification(false);
      }, 5000);

      throw new Error(data.message);
    }

    setTimeout(() => {
      setIsLoading(false);
      setShowModal(false);
    }, 500);

    setShowDeletePolicyNotification(true);
    setSelectedPolicy(undefined);
    refetch();

    setTimeout(() => {
      setShowDeletePolicyNotification(false);
    }, 5000);
  };

  return (
    <>
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
          {
            content: "",
          },
        ]}
        rows={policiesList.map((policy: Policy) => {
          return {
            columns: [
              {
                content: policy.revision,
              },
              {
                content: policy["signing-key-name"],
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
              {
                content: (
                  <Button
                    className="u-no-margin--bottom"
                    onClick={() => {
                      setSelectedPolicy(policy.revision);
                      setShowModal(true);
                    }}
                  >
                    Delete
                  </Button>
                ),
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
      {showModal && (
        <Modal
          close={() => {
            setShowModal(false);
          }}
          title="Delete policy"
          buttonRow={
            <>
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  setSelectedPolicy(undefined);
                  setShowModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="u-no-margin--bottom u-no-margin--right"
                appearance="positive"
                onClick={() => {
                  deletePolicy(selectedPolicy);
                }}
              >
                Delete policy
              </Button>
            </>
          }
        >
          {isLoading ? (
            <p>
              <Icon name="spinner" className="u-animation--spin" />
              &nbsp;Deleting policy...
            </p>
          ) : (
            <p>
              Are you sure you want to delete this policy? This action cannot be
              undone.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

export default ModelsTable;
