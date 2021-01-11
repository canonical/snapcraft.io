import { UserFacingStatus } from "./builds/helpers";

function getStatuses() {
  return fetch("/snap-builds.json").then((r) => r.json());
}

function addBuildStatus(row, data) {
  const snapName = row.dataset.snapName;
  const releaseData = data.find((d) => d.name === snapName);
  const buildStatus = UserFacingStatus[releaseData.status].statusMessage;
  const buildColumn = row.querySelector("[data-js='snap-build-status']");

  if (buildColumn && buildStatus && buildStatus.toLowerCase() !== "unknown") {
    buildColumn.innerText = buildStatus;
  } else {
    buildColumn.innerText = buildColumn.dataset.status;
  }
}

function buildStatus() {
  getStatuses()
    .then((data) => {
      const snapListRows = document.querySelectorAll(
        "[data-js='snap-list-row']"
      );

      snapListRows.forEach((row) => addBuildStatus(row, data));
    })
    .catch((e) => console.error(e));
}

export default buildStatus;
