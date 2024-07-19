import { ReactElement } from "react";
import { useParams } from "react-router-dom";

import type { RouteParams } from "../../types/shared";

function Reviewer(): ReactElement {
  const { id } = useParams<RouteParams>();

  return (
    <div className="u-fixed-width">
      <h1>Reviewer</h1>
      <p>
        As a reviewer you can{" "}
        <a href={`${window.API_URL}stores/${id}/reviews/`}>
          review the snaps in this store on the dashboard
        </a>
        .
      </p>
    </div>
  );
}

export default Reviewer;
