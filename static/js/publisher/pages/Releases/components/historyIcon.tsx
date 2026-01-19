import React from "react";

interface HistoryIconProps {
  onClick: () => void;
}

export default function HistoryIcon({ onClick }: HistoryIconProps) {
  return (
    <span className="p-release-data__icon" onClick={onClick}>
      <span className="p-icon--chevron-down">History</span>
    </span>
  );
}
