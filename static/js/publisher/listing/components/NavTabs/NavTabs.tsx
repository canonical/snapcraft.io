import React from "react";

type Props = {
  snapName: string;
};

function NavTabs({ snapName }: Props) {
  return (
    <nav className="p-tabs">
      <ul
        className="p-tabs__list u-float-right u-no-margin--bottom"
        role="tablist"
      >
        <li className="p-tabs__item" role="presentation">
          <a
            data-tour="listing-intro"
            href={`/${snapName}/listing`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
            aria-selected="true"
          >
            Listing
          </a>
        </li>
        <li className="p-tabs__item" role="presentation">
          <a
            href={`/${snapName}/builds`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
          >
            Builds
          </a>
        </li>
        <li className="p-tabs__item" role="presentation">
          <a
            href={`/${snapName}/releases`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
          >
            Releases
          </a>
        </li>
        <li className="p-tabs__item" role="presentation">
          <a
            href={`/${snapName}/metrics`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
          >
            Metrics
          </a>
        </li>
        <li className="p-tabs__item" role="presentation">
          <a
            href={`/${snapName}/publicise`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
          >
            Publicise
          </a>
        </li>
        <li className="p-tabs__item" role="presentation">
          <a
            href={`/${snapName}/settings`}
            className="p-tabs__link"
            tabIndex={0}
            role="tab"
          >
            Settings
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default NavTabs;
