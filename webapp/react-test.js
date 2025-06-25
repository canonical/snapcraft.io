// For PythonMonkey to work properly with React, the React needs to be patched-up not to depend on Node.js globals.
// There are changes needed to be made in React DOM code itself.
// See the comment on GH issue below for more details.
// https://github.com/Distributive-Network/PythonMonkey/issues/267#issuecomment-1987004749
// Additional context is also provided in the document:
// https://docs.google.com/document/d/1thu6NOBFpowzDBVKyqk-N-_CYV5qYYXvtHTU2Cjz_lg/edit?tab=t.pjdouz9iouzr
const renderToString = require("react-dom/server").renderToString;
const React = require("react");

// This includes the StatusLabel component from Canonical's React components.
// It needs to be imported directly from the component file itself to avoid problems with components that
// depend on SCSS includes.
// Possibly a propoer build step would allow importing any components and using JSX syntax,
// but for now, we are using the component directly.
const StatusLabel = require("@canonical/react-components/dist/components/StatusLabel/StatusLabel").default;

// A basic component for testing rendering from Jinja.
// We should be able to pass the value of the prop from Jinja template.
// We are using React.createElement directly to avoid adding JSX build step.
function ReactTestComponent({ name }) {
  if (name) {
    return React.createElement("div", null, `Hello, ${name}! ${Date.now()}`,
      React.createElement(StatusLabel, { appearance: "positive" }, "React!")
    );
  }
  return React.createElement("div", null, "Hello from React!");
}


// This function renders the ReactTestComponent to a string.
// It accepts a name prop to customize the greeting.
// This function is exposed from this module and will be available in Jinja templates.
// See: handlers.py code to see how it is imported and exposed to templates.
function renderReactComponent(name) {
  const element = React.createElement(ReactTestComponent, { name });
  return renderToString(element);
}

module.exports = renderReactComponent;
