import React from "react";
import { Link, useParams } from "react-router-dom";
import type { RouteParams } from "../../types/shared";

function SectionNav({ sectionName }: { sectionName: string }) {
  const { id } = useParams<RouteParams>();

  return (
    <div className="p-tabs">
      <ul className="p-tabs__list">
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/snaps`}
            className="p-tabs__link"
            aria-selected={sectionName === "snaps"}
            role="tab"
          >
            Snaps
          </Link>
        </li>
        {/* <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/models`}
            className="p-tabs__link"
            aria-selected={sectionName === "models"}
            role="tab"
          >
            Models
          </Link>
        </li>
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/signing-keys`}
            className="p-tabs__link"
            aria-selected={sectionName === "signing-keys"}
            role="tab"
          >
            Signing keys
          </Link>
        </li> */}
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/members`}
            className="p-tabs__link"
            aria-selected={sectionName === "members"}
            role="tab"
          >
            Members
          </Link>
        </li>
        <li className="p-tabs__item">
          <Link
            to={`/admin/${id}/settings`}
            className="p-tabs__link"
            aria-selected={sectionName === "settings"}
            role="tab"
          >
            Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default SectionNav;
