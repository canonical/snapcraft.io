function isClosedPanel(path: string, key: string): boolean {
  const splitPath = path.split("/");
  const lastItemInPath = splitPath[splitPath.length - 1];
  return lastItemInPath !== key;
}

export default isClosedPanel;
