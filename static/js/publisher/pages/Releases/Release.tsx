import { legacy_createStore as createStore, applyMiddleware, compose, StoreEnhancer } from "redux";
import { thunk } from "redux-thunk";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import ReleasesController from "./releasesController";
import releasesReducers from "./reducers";
import {
  ReleasesAPIResponse,
  ReleasesReduxState,
  ReleasesReduxStore,
} from "../../types/releaseTypes";
import { RootAction } from "./actions";

// setup redux store with thunk middleware and devtools extension:
// https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

type Props = {
  snapName: string;
  apiData: ReleasesAPIResponse;
};

function Release({
  snapName,
  apiData,
}: Props): React.JSX.Element {
  const store: ReleasesReduxStore = createStore<ReleasesReduxState, RootAction>(
    releasesReducers,
    composeEnhancers(applyMiddleware(thunk)) as StoreEnhancer,
  );

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <ReleasesController
          snapName={snapName}
          apiData={apiData}
        />
      </DndProvider>
    </Provider>
  );
}

export default Release;
