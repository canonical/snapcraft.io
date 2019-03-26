/**
 * Checks the items in an array are equal.
 * The order of the items doesn't matter
 *
 * @param {array} oldArray
 * @param {array} newArray
 * @returns {boolean}
 */
function arraysEqual(oldArray, newArray) {
  if (oldArray === newArray) {
    return true;
  }
  if (
    oldArray === null ||
    newArray === null ||
    oldArray.length !== newArray.length
  ) {
    return false;
  }

  const _oldArray = oldArray.splice(0);
  const _newArray = newArray.splice(0);

  _oldArray.sort();
  _newArray.sort();

  for (let i = 0; i < _oldArray.length; i++) {
    if (JSON.stringify(_oldArray[i]) !== JSON.stringify(_newArray[i])) {
      return false;
    }
  }

  return true;
}

export { arraysEqual };
