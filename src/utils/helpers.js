function replaceStringInsideStringWithNewString(
  string,
  stringToReplace,
  newString
) {
  const index = string.indexOf(stringToReplace);
  if (index === -1) {
    return string;
  }
  const firstHalf = string.slice(0, index);
  const secondHalf = string.slice(index + stringToReplace.length);
  return firstHalf + newString + secondHalf;
}

function arrayToString (array) {
  var string = "";
  for (let i = 0; i < array.length; i++) {
    string += array[i];
    if (i !== array.length - 1) {
      string += ", ";
    }
  }
  return string;
};

module.exports = {
  replaceStringInsideStringWithNewString,
  arrayToString,
};
