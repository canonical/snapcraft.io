import { setPageTitle } from "../../utils";

function StoreNotFound(): React.JSX.Element {
  setPageTitle("Store not found");

  return (
    <div className="u-fixed-width">
      <h1>Store not found</h1>
      <p>
        Either this store does not exist or you do not have access to it. If you
        believe this to be incorrect please contact your admin.
      </p>
    </div>
  );
}

export default StoreNotFound;
