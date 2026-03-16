import { useAtomValue } from "jotai";
import { useParams, useNavigate } from "react-router-dom";

import { brandStoresState } from "../../state/brandStoreState";
import ComboBox from "../ComboBox/ComboBox";

function StoreSelector(): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const brandStoresList = useAtomValue(brandStoresState);

  return (
    <ComboBox
      options={brandStoresList.map((store) => ({
        label: store.name,
        value: store.id,
      }))}
      value={id ?? ""}
      label="Select store"
      placeholder="Select store"
      labelClassName="u-off-screen"
      onChange={(storeId) => {
        if (!storeId) return;
        navigate(`/admin/${storeId}/snaps`);
      }}
    />
  );
}

export default StoreSelector;
