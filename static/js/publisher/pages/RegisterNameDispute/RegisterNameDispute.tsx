import { ReactNode, useState } from "react";
import { useSearchParams } from "react-router-dom";

import RegisterNameDisputeForm from "./RegisterNameDisputeForm";
import RegisterNameDisputeSuccess from "./RegisterNameDisputeSuccess";

import { useAvailableStores } from "../../hooks";

import { setPageTitle } from "../../utils";

function RegisterNameDispute(): ReactNode {
  setPageTitle("Register name dispute");

  const [searchParams] = useSearchParams();
  const snapName = searchParams.get("snap_name");
  const store = searchParams.get("store");

  const [claimSubmitted, setClaimSubmitted] = useState<boolean>(false);

  const { data, isLoading } = useAvailableStores();

  const getStoreName = (
    storeId: string | null,
    stores: { name: string; id: string }[],
  ) => {
    if (!storeId) {
      return;
    }

    const currentStore = stores.find((store) => store.id === storeId);

    if (currentStore) {
      return currentStore.name;
    }

    return;
  };

  return (
    <div className="u-fixed-width">
      {claimSubmitted ? (
        <RegisterNameDisputeSuccess snapName={snapName} />
      ) : (
        !isLoading &&
        data && (
          <RegisterNameDisputeForm
            snapName={snapName}
            store={getStoreName(store, data)}
            setClaimSubmitted={setClaimSubmitted}
          />
        )
      )}
    </div>
  );
}

export default RegisterNameDispute;
