import Navigation from "../../components/Navigation";
import { setPageTitle } from "../../utils";

function StoreNotFound(): React.JSX.Element {
  setPageTitle("Store not found");

  return (
    <div className="l-application">
      <Navigation />

      <main className="l-main">
        <div className="p-panel--not_found">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <h1>Store not found</h1>
              <p>
                Either this store does not exist or you do not have access to
                it. If you believe this to be incorrect please contact your
                admin.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StoreNotFound;
