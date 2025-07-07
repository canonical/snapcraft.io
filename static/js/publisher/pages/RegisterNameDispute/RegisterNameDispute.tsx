import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import RegisterNameDisputeForm from "./RegisterNameDisputeForm";
import RegisterNameDisputeSuccess from "./RegisterNameDisputeSuccess";

import { useBrandStores } from "../../hooks";

import { setPageTitle } from "../../utils";

import type { Store } from "../../types/shared";

function RegisterNameDispute(): React.JSX.Element {
  setPageTitle("Register name dispute");

  const [searchParams] = useSearchParams();
  const snapName = searchParams.get("snap-name");
  const store = searchParams.get("store");

  const [claimSubmitted, setClaimSubmitted] = useState<boolean>(false);

  const { data, isLoading } = useBrandStores();

  const getStoreName = (storeId: string | null, stores: Store[]) => {
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
