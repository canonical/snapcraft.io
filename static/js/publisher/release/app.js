import React, { Component } from 'react';

import { Button } from 'vanilla-framework-react';

export default class App extends Component {
  onButtonClick() {
    alert("Hello from React!");
  }

  render() {
    return (
      <div className="row">
        <div className="col-12">
          <Button brand value="Hello World!" onClick={this.onButtonClick}/>
        </div>
      </div>
    );
  }
}
