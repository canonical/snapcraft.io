import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import ReleasesController from "./release/releasesController";

import releases from "./release/reducers";

// setup redux store with thunk middleware and devtools extension:
// https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(releases, composeEnhancers(applyMiddleware(thunk)));

const initReleases = (id, snapName, releasesData, channelMapsList, options) => {
  ReactDOM.render(
    <Provider store={store}>
      <ReleasesController
        snapName={snapName}
        channelMapsList={channelMapsList}
        releasesData={releasesData}
        options={options}
      />
    </Provider>,
    document.querySelector(id)
  );
};

export { initReleases };
