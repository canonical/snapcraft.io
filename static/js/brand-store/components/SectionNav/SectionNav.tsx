import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useBrand } from "../../hooks";

import type { RouteParams } from "../../types/shared";

function SectionNav({ sectionName }: { sectionName: string }) {
  const { id } = useParams<RouteParams>();
  const { isLoading, isSuccess, data } = useBrand(id);
  const [searchParams] = useSearchParams();


  return (
    <nav className="p-tabs">
      <ul className="p-tabs__list brand-store-tabs">
        {!isLoading && isSuccess && (
          <>
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
            {/* If success then models and signing keys are available */}
            {data.success && !data.data?.Code && (
              <>
                <li className="p-tabs__item">
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
                </li>
              </>
            )}
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
          </>
        )}
      </ul>
    </nav>
  );
}

export default SectionNav;
