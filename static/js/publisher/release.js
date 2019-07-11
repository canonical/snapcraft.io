import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

import ReleasesController from "./release/releasesController";
import releases from "./release/reducers";

// setup redux store with thunk middleware and devtools extension:
// https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const initReleases = (id, snapName, releasesData, channelMapsList, options) => {
  const store = createStore(
    releases,
    {
      currentTrack: options.defaultTrack || "latest",
      defaultTrack: options.defaultTrack,
      options: {
        ...options,
        snapName
      }
    },
    composeEnhancers(applyMiddleware(thunk))
  );

  ReactDOM.render(
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <ReleasesController
          snapName={snapName}
          channelMapsList={channelMapsList}
          releasesData={releasesData}
          options={options}
        />
      </DndProvider>
    </Provider>,
    document.querySelector(id)
  );
};

export { initReleases };
