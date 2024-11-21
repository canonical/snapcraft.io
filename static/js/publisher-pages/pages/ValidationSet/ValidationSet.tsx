import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Icon,
  Notification,
  MainTable,
  Row,
  Col,
} from "@canonical/react-components";

import { useValidationSet } from "../../hooks";

import type { ValidationSet, Snap } from "../../types";

function ValidationSet(): JSX.Element {
  const { validationSetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    status,
    data: validationSetSequences,
    isFetching,
  } = useValidationSet(validationSetId);

  const getSelectedSquence = () => {
    const sequenceQuery = searchParams.get("sequence");

    if (sequenceQuery) {
      return parseInt(sequenceQuery) - 1;
    }

    return validationSetSequences.length - 1;
  };

  const showValidationSetSnaps =
    !isFetching && status === "success" && validationSetSequences.length > 0;

  return (
    <>
      <h1 className="p-heading--4">
        <Link to="/validation-sets">My validation sets</Link> /{" "}
        {validationSetId}
      </h1>

      {showValidationSetSnaps && (
        <Row>
          <Col size={3}>
            <div style={{ display: "flex" }}>
              <label
                htmlFor="sequence-selector"
                style={{ display: "inline-block", marginRight: "1rem" }}
              >
                Sequence
              </label>
              <select
                name="sequence-selector"
                id="sequence-selector"
                style={{ minWidth: "64px", width: "64px" }}
                defaultValue={
                  searchParams.get("sequence") || validationSetSequences.length
                }
                onChange={(e) => {
                  setSearchParams({ sequence: e.target.value });
                }}
              >
                {validationSetSequences.map(
                  (validateSetSequence: ValidationSet) => (
                    <option
                      key={validateSetSequence.timestamp}
                      value={validateSetSequence.sequence}
                    >
                      {validateSetSequence.sequence}
                    </option>
                  ),
                )}
              </select>
            </div>
          </Col>
        </Row>
      )}

      {status === "loading" && (
        <p>
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;&nbsp;Fetching validation set snaps
        </p>
      )}

      {status === "success" && validationSetSequences.length === 0 && (
        <Notification severity="information">
          There are no snaps in this validation set to display
        </Notification>
      )}

      {status === "error" && (
        <Notification severity="negative">
          Unable to load validation set snaps
        </Notification>
      )}

      {showValidationSetSnaps && (
        <MainTable
          sortable
          headers={[
            {
              content: "Snap name",
              sortKey: "name",
            },
            {
              content: "ID",
              sortKey: "id",
              className: "u-align--right",
            },
            {
              content: "Revision",
              sortKey: "revision",
              className: "u-align--right",
            },
            {
              content: "Presence",
              sortKey: "presence",
            },
            {
              content: "Publisher",
              sortKey: "publisher",
            },
            {
              content: "Release date",
              sortKey: "releaseDate",
              className: "u-align--right",
            },
          ]}
          rows={validationSetSequences[getSelectedSquence()].snaps.map(
            (snap: Snap) => {
              return {
                columns: [
                  {
                    content: <a href={`/${snap.name}`}>{snap.name}</a>,
                  },
                  {
                    content: snap.id,
                    className: "u-align--right u-truncate",
                  },
                  {
                    content: snap.revision || "-",
                    className: "u-align--right",
                  },
                  {
                    content: snap.presence || "-",
                  },
                  {
                    content: "-",
                  },
                  {
                    content: "-",
                    className: "u-align--right",
                  },
                ],
                sortData: {
                  name: "",
                  id: "",
                  revision: "",
                  presence: "",
                  publisher: "",
                  releaseDate: "",
                },
              };
            },
          )}
        />
      )}
    </>
  );
}

export default ValidationSet;
