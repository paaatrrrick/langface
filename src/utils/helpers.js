const mongoose = require('mongoose');
const crypto = require('crypto');


function convertToObjectId(value) {
  if (typeof value === 'string') {
    return new mongoose.Types.ObjectId(value);
  }
  return value;
}

const randomStringToHash24Bits = (inputString) => {
  return crypto.createHash('sha256').update(inputString).digest('hex').substring(0, 24);
}

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
  convertToObjectId,
  randomStringToHash24Bits
};
