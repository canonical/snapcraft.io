import React from "react";
import ReactDOM from "react-dom";

import MainTable from "@canonical/react-components/dist/components/MainTable";

export function initBuilds(id, snapName, builds) {
  const rows = builds.map(build => {
    return {
      columns: [
        {
          content: <a href={build.link}>{build.id}</a>
        },
        {
          content: build.arch_tag
        },
        {
          content: build.duration
        },
        {
          content: <a href={build.logs}>{build.status}</a>
        }
      ]
    };
  });

  ReactDOM.render(
    <MainTable
      headers={[
        {
          content: "Build id"
        },
        {
          content: "Architecture"
        },
        {
          content: "Duration"
        },
        {
          content: "Result"
        }
      ]}
      rows={rows}
    />,
    document.querySelector(id)
  );
}
