import React from "react";
import { Link, useParams } from "react-router-dom";

function ModelBreadcrumb() {
  const { id, model_id } = useParams();

  return (
    <h1 className="p-heading--4">
      <Link to={`/admin/${id}/models`}>&lsaquo;&nbsp;Models</Link> / {model_id}
    </h1>
  );
}

export default ModelBreadcrumb;
