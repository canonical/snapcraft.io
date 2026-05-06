import { Link, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";

import { useEndpointAvailability } from "../../hooks";
import { brandIdState } from "../../state/brandStoreState";

function ModelNav({ sectionName }: { sectionName: string }): React.JSX.Element {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const { isRemodelAvailable, isSerialLogAvailable } = useEndpointAvailability(
    brandId,
    modelId,
  );

  return (
    <nav className="p-tabs">
      <ul className="p-tabs__list">
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/models/${modelId}`}
            className="p-tabs__link"
            aria-selected={sectionName === "overview"}
            role="tab"
          >
            Overview
          </Link>
        </li>
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/models/${modelId}/policies`}
            className="p-tabs__link"
            aria-selected={sectionName === "policies"}
            role="tab"
          >
            Policies
          </Link>
        </li>
        {isRemodelAvailable && (
          <li className="p-tabs__item">
            <Link
              to={`/admin/${id}/models/${modelId}/remodel`}
              className="p-tabs__link"
              aria-selected={sectionName === "remodel"}
              role="tab"
            >
              Remodel
            </Link>
          </li>
        )}
        {isSerialLogAvailable && (
          <li className="p-tabs__item">
            <Link
              to={`/admin/${id}/models/${modelId}/serial-log`}
              className="p-tabs__link"
              aria-selected={sectionName === "serial-log"}
              role="tab"
            >
              Serial log
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default ModelNav;
