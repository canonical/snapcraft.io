import { createRoot } from "react-dom/client";
import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import ReleasesController from "./release/releasesController";
import releases from "./release/reducers";

// setup redux store with thunk middleware and devtools extension:
// https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const initReleases = (
  id: any,
  snapName: any,
  releasesData: { releasesData: any },
  channelMap: { channelMap: any },
  tracks: any,
  options: { [key: string]: any }
) => {
  const store = createStore(
    releases,
    {
      currentTrack: options.defaultTrack || "latest",
      defaultTrack: options.defaultTrack,
      options: {
        ...options,
        // @ts-ignore
        snapName,
        tracks,
      },
    },
    composeEnhancers(applyMiddleware(thunk))
  );
  const container = document.querySelector(id);
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <ReleasesController
          snapName={snapName}
          releasesData={releasesData}
          // @ts-ignore
          channelMap={channelMap}
          options={options}
        />
      </DndProvider>
    </Provider>
  );
};

export { initReleases };
