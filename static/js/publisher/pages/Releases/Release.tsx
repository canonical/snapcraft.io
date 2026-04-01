import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import ReleasesController from "./releasesController";
import { store } from "./store";
import type {
  ReleasesAPIResponse,
} from "../../types/releaseTypes";

type Props = {
  snapName: string;
  apiData: ReleasesAPIResponse;
};

function Release({
  snapName,
  apiData,
}: Props): React.JSX.Element {
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
