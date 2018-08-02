import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import RevisionsList from './release/revisionsList';
import RevisionsTable from './release/revisionsTable';


const initReleases = (id, data, options) => {
  ReactDOM.render(
    <Fragment>
      <RevisionsTable revisions={data} options={options}/>
      <RevisionsList revisions={data} />
    </Fragment>,
    document.querySelector(id)
  );
};

export {
  initReleases
};
