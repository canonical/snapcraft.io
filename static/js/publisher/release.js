import React from 'react';
import ReactDOM from 'react-dom';

import App from './release/app';

const init = (id, data) => {
  // FIXME: just a debug
  window.console.log("render", id, data);

  ReactDOM.render(
    <App />
    , document.querySelector(id));
};

export {
  init
};
