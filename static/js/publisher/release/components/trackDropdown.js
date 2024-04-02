import React, { useState } from "react";
import PropTypes from "prop-types";

const TrackDropdown = ({
  options,
  label,
  onChange,
  defaultTrack,
  currentTrack,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (value) => {
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className="track-dropdown">
      <div className="dropdown-toggle" onClick={handleToggle}>
        {label}
        <i className="p-icon--chevron-down u-float-right"></i>
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option, index) => (
            <div
              key={index}
              className="dropdown-item"
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
              {option.value === defaultTrack && (
                <div className="p-status-label">Default</div>
              )}
              {option.value === currentTrack && (
                <i className="p-icon--task-outstanding u-float-right"></i>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

TrackDropdown.propTypes = {
  options: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  currentTrack: PropTypes.string.isRequired,
  defaultTrack: PropTypes.string,
};

export default TrackDropdown;
