import { setPageTitle } from "../../utils";

function StoreNotFound() {
  setPageTitle("Store not found");

  return (
    <main className="l-main">
      <div className="p-panel--settings">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <h1>Store not found</h1>
            <p>
              Either this store does not exist or you do not have access to it.
              If you believe this to be incorrect please contact your admin.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default StoreNotFound;
