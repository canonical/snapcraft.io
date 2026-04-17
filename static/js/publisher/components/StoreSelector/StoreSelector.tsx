import { useAtomValue } from "jotai";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { brandStoresState } from "../../state/brandStoreState";
import ComboBox from "../ComboBox/ComboBox";

function StoreSelector(): React.JSX.Element {
  const { id: storeId } = useParams();
  const navigate = useNavigate();
  const brandStoresList = useAtomValue(brandStoresState);

  const comboBoxOptions = useMemo(
    () =>
      brandStoresList.map((store) => ({
        label: store.name,
        value: store.id,
      })),
    [brandStoresList],
  );

  return (
    <ComboBox
      options={comboBoxOptions}
      value={storeId ?? ""}
      label="Select store"
      placeholder="Select store"
      labelClassName="u-off-screen"
      required
      onChange={(newStoreId) => {
        if (!newStoreId) return;
        if (storeId === newStoreId) return;
        navigate(`/admin/${newStoreId}/snaps`);
      }}
    />
  );
}

export default StoreSelector;
