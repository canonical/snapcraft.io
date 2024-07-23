function arraysEqual(oldArray: unknown[], newArray: unknown[]): boolean {
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

  const _oldArray = [...oldArray];
  const _newArray = [...newArray];

  _oldArray.sort();
  _newArray.sort();

  for (let i = 0; i < _oldArray.length; i++) {
    if (JSON.stringify(_oldArray[i]) !== JSON.stringify(_newArray[i])) {
      return false;
    }
  }

  return true;
}

function arrayChunk(arr: unknown[], chunkSize: number): any[] {
  const chunks = [];
  const arrCopy = arr.slice(0);

  for (let i = 0, ii = arrCopy.length; i < ii; i += chunkSize) {
    chunks.push(arrCopy.splice(0, chunkSize));
  }

  return chunks;
}

function arraysMerge(arr1: unknown[], arr2: unknown[]): unknown[] {
  const arr3 = [...arr1, ...arr2];

  return arr3.filter((item, i) => arr3.indexOf(item) === i);
}

export { arraysEqual, arrayChunk, arraysMerge };
