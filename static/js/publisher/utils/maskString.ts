function maskString(str: string | undefined) {
  const visibleCharacterCount = 12;

  if (!str) {
    return "";
  }

  if (str.length <= visibleCharacterCount) {
    return str;
  }

  const strLength = str.length;
  const strEnd = str.slice(strLength - visibleCharacterCount, strLength);

  return `...${strEnd}`;
}

export default maskString;
