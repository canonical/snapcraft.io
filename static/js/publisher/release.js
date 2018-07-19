import React from 'react';
import ReactDOM from 'react-dom';

import RevisionsList from './release/revisionsList';
import RevisionsTable from './release/revisionsTable';


const initReleases = (id, data) => {
  ReactDOM.render(
    <div>
      <h4>Releases available for install</h4>
      <RevisionsTable revisions={data} />
      <h4>Revisions available</h4>
      <RevisionsList revisions={data} />
    </div>,
    document.querySelector(id)
  );
};

export {
  initReleases
};
