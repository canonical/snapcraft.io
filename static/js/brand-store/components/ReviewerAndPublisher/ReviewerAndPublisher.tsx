import { useParams } from "react-router-dom";

import type { RouteParams } from "../../types/shared";

function ReviewerAndPublisher() {
  const { id } = useParams<RouteParams>();

  return (
    <div className="u-fixed-width">
      <h1>Reviewer and publisher</h1>
      <p>
        As a publisher you can{" "}
        <a href="/snaps">register a snap name on the Snap store</a> and{" "}
        <a href={`${window.API_URL}stores/snaps/`}>
          manage your snaps on the dashboard
        </a>
        .
      </p>
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

export default ReviewerAndPublisher;
