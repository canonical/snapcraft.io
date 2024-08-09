import { UserFacingStatus } from "./builds/helpers";

function getStatuses() {
  return fetch("/snap-builds.json").then((r) => r.json());
}

function addBuildStatus(
  row: HTMLElement,
  data: Array<{ name: string; status: string }>
): void {
  const snapName: string | undefined = row.dataset.snapName;
  const releaseData: { name: string; status: string } | undefined = data.find(
    (d) => d.name === snapName
  );

  let buildStatus: string | undefined;

  if (releaseData && releaseData.status) {
    buildStatus = UserFacingStatus[releaseData.status].statusMessage;
  }

  const buildColumn = row.querySelector(
    "[data-js='snap-build-status']"
  ) as HTMLElement;

  const failedStatuses: string[] = ["failed_to_build", "release_failed"];

  const errorIcon = document.createElement("i") as HTMLElement;
  errorIcon.classList.add("p-icon--error");

  const buildLink = document.createElement("a");
  buildLink.href = `/${snapName}/builds`;

  if (buildColumn && buildStatus && buildStatus.toLowerCase() !== "unknown") {
    if (releaseData && failedStatuses.includes(releaseData.status)) {
      buildColumn.innerText = "";
      buildColumn.appendChild(errorIcon);
      buildLink.innerText = buildStatus;
      buildColumn.appendChild(buildLink);
    } else {
      buildColumn.innerText = buildStatus;
    }
  } else {
    buildColumn.innerText = buildColumn.dataset.status as string;
  }
}

function buildStatus(): void {
  getStatuses()
    .then((data) => {
      const snapListRows = document.querySelectorAll(
        "[data-js='snap-list-row']"
      ) as NodeListOf<HTMLElement>;

      snapListRows.forEach((row) => addBuildStatus(row, data));
    })
    .catch((e) => console.error(e));
}

export default buildStatus;
