import React from "react";
import ReactDOM from "react-dom";

import MainTable from "@canonical/react-components/dist/components/MainTable";

export function initBuilds(id, snapName, dummyData) {
  const rows = dummyData.payload.builds.map(build => {
    const id = build.self_link.substr(build.self_link.lastIndexOf("/") + 1);
    return {
      columns: [
        {
          content: <a href={build.web_link}>{id}</a>
        },
        {
          content: build.arch_tag
        },
        {
          content: build.duration
        },
        {
          content: <a href={build.build_log_url}>{build.buildstate}</a>
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
