import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

import {
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
  AVAILABLE_REVISIONS_SELECT_ALL
} from "../../constants";

const menuLabels = {
  [AVAILABLE_REVISIONS_SELECT_ALL]: {
    label: "Most recent"
  },
  [AVAILABLE_REVISIONS_SELECT_LAUNCHPAD]: {
    label: "Launchpad",
    description: "Revisions built on Launchpad"
  }
};

const AvailableRevisionsTabs = ({ children }) => {
  const [currentTab, setCurrentTab] = useState(AVAILABLE_REVISIONS_SELECT_ALL);

  const renderItem = item => {
    return (
      <li
        key={`available-menu-item-${item}`}
        className={`p-tabs__item`}
        role="presentation"
      >
        <a
          className="p-tabs__link"
          tabIndex="0"
          role="tab"
          aria-selected={currentTab === item}
          onClick={() => setCurrentTab(item)}
        >
          {menuLabels[item].label}
        </a>
      </li>
    );
  };

  const renderItems = () => {
    return Object.keys(menuLabels).map(renderItem);
  };

  return (
    <Fragment>
      <nav className="p-tabs">
        <ul className="p-tabs__list u-float-right" role="tablist">
          {renderItems()}
        </ul>
      </nav>
      {children && children(currentTab)}
    </Fragment>
  );
};

AvailableRevisionsTabs.propTypes = {
  children: PropTypes.func
};

export default AvailableRevisionsTabs;
