const shallowDiff = (firstState, secondState) => {
  const diff = {};

  Object.keys(firstState).forEach(key => {
    const value = firstState[key];
    if (secondState[key] === undefined) {
      diff[key] = {
        state: "REMOVED",
        oldValue: value
      };
    } else if (JSON.stringify(secondState[key]) !== JSON.stringify(value)) {
      diff[key] = {
        state: "CHANGED",
        oldValue: value,
        newValue: secondState[key]
      };
    }
  });

  Object.keys(secondState).forEach(key => {
    const value = secondState[key];
    if (firstState[key] === undefined) {
      diff[key] = {
        state: "ADDED",
        newValue: value
      };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
};

export { shallowDiff as default };
