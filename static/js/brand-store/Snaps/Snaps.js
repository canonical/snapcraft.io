import React from "react";
import { useParams } from "react-router-dom";

function Snaps() {
  const { id } = useParams();

  return <h1>Snaps {id}</h1>;
}

export default Snaps;
