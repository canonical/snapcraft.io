function formatFileSize(fileSize: number) {
  if (fileSize < 1000000) {
    return `${fileSize / 1000}kB`;
  }

  return `${fileSize / 1000000}MB`;
}

export default formatFileSize;
