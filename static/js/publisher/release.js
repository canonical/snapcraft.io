import React from "react";
import ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import ReleasesController from "./release/releasesController";

import releases from "./release/reducers";

const store = createStore(
  releases,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

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
