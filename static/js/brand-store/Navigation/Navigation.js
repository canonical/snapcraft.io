import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { brandStoresListSelector } from "../selectors";

function Navigation() {
  const brandStoresList = useSelector(brandStoresListSelector);

  return (
    <ul>
      {brandStoresList.map((item) => (
        <li key={item.id}>
          <NavLink to={`/admin/${item.id}/snaps`}>{item.name}</NavLink>
        </li>
      ))}
    </ul>
  );
}

export default Navigation;
