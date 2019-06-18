const shallowDiff = (firstState, secondState) => {
  let diff = Object.keys(firstState).some(key => {
    const value = firstState[key];
    if (secondState[key] === undefined) {
      return key;
    } else if (JSON.stringify(secondState[key]) !== JSON.stringify(value)) {
      return key;
    }
  });

  if (!diff) {
    diff = Object.keys(secondState).some(key => {
      if (firstState[key] === undefined) {
        return key;
      }
    });
  }

  return diff;
};

export { shallowDiff as default };
