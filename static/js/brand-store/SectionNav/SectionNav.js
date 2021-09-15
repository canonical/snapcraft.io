import React from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";

function SectionNav({ sectionName }) {
  const { id } = useParams();

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

SectionNav.propTypes = {
  sectionName: PropTypes.string.isRequired,
};

export default SectionNav;
