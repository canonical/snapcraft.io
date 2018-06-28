import React from 'react';
import ReactDOM from 'react-dom';

import RevisionsList from './release/revisionsList';

const initReleases = (id, data) => {
  ReactDOM.render(
    <RevisionsList revisions={data} />,
    document.querySelector(id)
  );
};

export {
  initReleases
};
