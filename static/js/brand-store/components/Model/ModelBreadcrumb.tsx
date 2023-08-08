import React from "react";
import { Link, useParams } from "react-router-dom";

function ModelBreadcrumb() {
  const { id, model_id } = useParams();

  return (
    <nav className="p-breadcrumbs" aria-label="Breadcrumbs">
      <ol className="p-breadcrumbs__items u-no-margin--bottom">
        <li className="p-breadcrumbs__item">
          <Link to={`/admin/${id}/models`}>&lsaquo;&nbsp;Models</Link>
        </li>
        <li className="p-breadcrumbs__item">{model_id}</li>
      </ol>
    </nav>
  );
}

export default ModelBreadcrumb;
