import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Row,
  Col,
  MainTable,
  Icon,
  Notification,
  Button,
} from "@canonical/react-components";

import { useValidationSets } from "../../hooks";

import type { ValidationSet } from "../../types";

function ValidationSets(): JSX.Element {
  const { status, data: validationSets } = useValidationSets();
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredValidationSets: ValidationSet[] =
    validationSets && validationSets.length
      ? validationSets.filter((validationSet: ValidationSet) => {
          const query = searchParams.get("filter");

          if (!query) {
            return true;
          }

          return validationSet.name.includes(query);
        })
      : [];

  return (
    <>
      <h1 className="p-heading--4">My validation sets</h1>

      <Row>
        <Col size={6}>
          <div className="p-search-box">
            <label className="u-off-screen" htmlFor="search">
              Search validation sets
            </label>
            <input
              required
              type="search"
              id="search"
              name="search"
              className="p-search-box__input"
              placeholder="Search validation sets"
              autoComplete="off"
              value={searchParams.get("filter") || ""}
              onChange={(e) => {
                if (e.target.value) {
                  setSearchParams({ filter: e.target.value });
                } else {
                  setSearchParams();
                }
              }}
            />
            <Button
              type="reset"
              className="p-search-box__reset"
              onClick={() => {
                setSearchParams();
              }}
            >
              <Icon name="close">Clear filter</Icon>
            </Button>
            <Button type="submit" className="p-search-box__button">
              <Icon name="search">Search</Icon>
            </Button>
          </div>
        </Col>
      </Row>

      {status === "loading" && (
        <p>
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;&nbsp;Fetching validation sets
        </p>
      )}

      {status === "success" && filteredValidationSets.length === 0 && (
        <Notification severity="information">
          There are no validation sets to display
        </Notification>
      )}

      {status === "error" && (
        <Notification severity="negative">
          Unable to load validation sets
        </Notification>
      )}

      {status === "success" && filteredValidationSets.length > 0 && (
        <MainTable
          sortable
          headers={[
            {
              content: `Name (${filteredValidationSets.length})`,
              sortKey: "name",
            },
            {
              content: "Revision",
              className: "u-align--right",
              sortKey: "revision",
            },
            {
              content: "Sequence",
              className: "u-align--right",
              sortKey: "sequence",
            },
            {
              content: "Referenced snaps",
              className: "u-align--right",
              sortKey: "snaps",
            },
            {
              content: "Last updated",
              className: "u-align--right",
              sortKey: "updated",
            },
          ]}
          rows={filteredValidationSets.map((validationSet: ValidationSet) => {
            return {
              columns: [
                {
                  content: (
                    <Link to={`/validation-sets/${validationSet.name}`}>
                      {validationSet.name}
                    </Link>
                  ),
                },
                {
                  content: validationSet.revision || "-",
                  className: "u-align--right",
                },
                {
                  content: validationSet.sequence || "-",
                  className: "u-align--right",
                },
                {
                  content: validationSet.snaps.length,
                  className: "u-align--right",
                },
                {
                  content: format(
                    new Date(validationSet.timestamp),
                    "dd/MM/yyyy"
                  ),
                  className: "u-align--right",
                },
              ],
              sortData: {
                name: validationSet.name,
                revision: validationSet.revision,
                sequence: validationSet.sequence,
                snaps: validationSet.snaps.length,
                updated: validationSet.timestamp,
              },
            };
          })}
        />
      )}
    </>
  );
}

export default ValidationSets;
