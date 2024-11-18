import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import ReleasesController from "./releasesController";
import releases from "./reducers";
import {
  ReleasesData,
  ChannelMap,
  Track,
  Options,
} from "../../types/releaseTypes";

// setup redux store with thunk middleware and devtools extension:
// https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

type Props = {
  snapName: string;
  releasesData: ReleasesData;
  channelMap: ChannelMap[];
  tracks: Track[];
  options: Options;
};

function Release({
  snapName,
  releasesData,
  channelMap,
  tracks,
  options,
}: Props): JSX.Element {
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
    composeEnhancers(applyMiddleware(thunk)),
  );

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <ReleasesController
          snapName={snapName}
          releasesData={releasesData}
          channelMap={channelMap}
          // @ts-ignore
          options={options}
        />
      </DndProvider>
    </Provider>
  );
}

export default Release;
