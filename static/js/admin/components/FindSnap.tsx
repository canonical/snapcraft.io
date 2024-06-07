import { useState, useRef } from "react";
import { useQuery } from "react-query";

import { Button } from "@canonical/react-components";

import type { SnapData } from "../types/SnapData";

type FindSnapProps = {
  addSnap: (snap: any) => void;
};

const searchSnap = async (queryString: string): Promise<SnapData[]> => {
  const response = await fetch(`/beta/store.json?q=${queryString}`);
  const responseJson = await response.json();
  return responseJson.packages;
};

const FindSnap = ({ addSnap }: FindSnapProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [focused, setFocused] = useState(false);
  const { data, isLoading } = useQuery(
    ["searchSnap", searchQuery],
    () => searchSnap(searchQuery),
    { enabled: searchQuery.length > 2 },
  );

  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchQuery(e.currentTarget.value);
  };

  const handleClick = (snap: any) => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setFocused(false);
    addSnap(snap);
  };

  const handleFocus = () => setFocused(true);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          zIndex: 10,
        }}
      >
        <input
          className="p-form-validation__input"
          type="text"
          name="snap"
          onChange={handleSearch}
          onFocus={handleFocus}
          ref={inputRef}
          placeholder="Search for a snap"
        />
        {data && focused && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              width: "500px",
              backgroundColor: "#fff",
              border: "1.5px solid #d9d9d9",
              height: "50vh",
              overflow: "auto",
            }}
          >
            {data.map((snap: any) => (
              <div
                key={snap.package.name}
                onClick={() => {
                  handleClick(snap);
                }}
                style={{
                  cursor: "pointer",
                  borderBottom: "1.5px solid #d9d9d9",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <div>
                    <img
                      src={snap.package.icon_url}
                      alt={snap.package.name}
                      width="32"
                      style={{ marginRight: "0.5rem" }}
                    />
                  </div>
                  <div>
                    <h3 className="p-heading--5 u-no-margin u-no-padding">
                      {snap.package.display_name}
                    </h3>
                    <p className="u-no-margin u-text--muted">
                      <em>{snap.publisher.display_name}</em>
                    </p>
                    <p className="u-no-margin">{snap.package.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FindSnap;
