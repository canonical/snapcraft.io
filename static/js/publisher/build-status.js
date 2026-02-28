import { UserFacingStatus } from "./builds/helpers";

function getStatuses() {
  return fetch("/snap-builds.json").then((r) => r.json());
}

function addBuildStatus(row, data) {
  const snapName = row.dataset.snapName;
  const releaseData = data.find((d) => d.name === snapName);
  const buildStatus = UserFacingStatus[releaseData.status].statusMessage;
  const buildColumn = row.querySelector("[data-js='snap-build-status']");

  const failedStatuses = ["failed_to_build", "release_failed"];

  const errorIcon = document.createElement("i");
  errorIcon.classList.add("p-icon--error");

  const buildLink = document.createElement("a");
  buildLink.href = `/${snapName}/builds`;

  if (buildColumn && buildStatus && buildStatus.toLowerCase() !== "unknown") {
    if (failedStatuses.includes(releaseData.status)) {
      buildColumn.innerText = "";
      buildColumn.appendChild(errorIcon);
      buildLink.innerText = buildStatus;
      buildColumn.appendChild(buildLink);
    } else {
      buildColumn.innerText = buildStatus;
    }
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
