export default function addDateToFilename(file: File, date: Date): File {
  const now = Math.round(date.getTime() / 1000);
  const nameParts = file.name.split(".");
  const extension = nameParts.pop();
  const newName = `${nameParts.join(".")}-${now}.${extension}`;
  return new File([file], newName);
}
