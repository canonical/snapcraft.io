function arraysEqual(oldArray, newArray) {
  if (oldArray === newArray) {
    return true;
  }
  if (
    oldArray === null || newArray === null ||
    (oldArray.length !== newArray.length)) {
    return false;
  }

  oldArray.sort();
  newArray.sort();

  for(let i = 0; i < oldArray.length; i++) {
    if (oldArray[i] !== newArray[i]) {
      return false;
    }
  }

  return true;
}

export { arraysEqual };