import React from "react";

import NavTabs from "../NavTabs";

type Props = {
  snapName: string;
};

function PageHeader({ snapName }: Props) {
  return (
    <section className="p-strip is-shallow u-no-padding--bottom">
      <div className="u-fixed-width">
        <a href="/snaps">&lsaquo;&nbsp;My snaps</a>
        <h1 className="p-heading--3">{snapName}</h1>
        <NavTabs snapName={snapName} />
      </div>
    </section>
  );
}

export default PageHeader;
