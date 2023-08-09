import React from "react";
import { Link, useParams } from "react-router-dom";

function ModelNav({ sectionName }: { sectionName: string }) {
  const { id, model_id } = useParams();

  return (
    <nav className="p-tabs">
      <ul className="p-tabs__list">
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/models/${model_id}`}
            className="p-tabs__link"
            aria-selected={sectionName === "overview"}
            role="tab"
          >
            Overview
          </Link>
        </li>
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/models/${model_id}/policies`}
            className="p-tabs__link"
            aria-selected={sectionName === "policies"}
            role="tab"
          >
            Policies
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default ModelNav;
