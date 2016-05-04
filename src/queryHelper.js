const isAffirmative = (text) => {
  return /^(yes|yeah|yea|yep|yeap|y)$/i.test(text);
}

const isNegative = (text) => {
  return /^(no|nop|nope|n)$/i.test(text);
}

module.exports = {
  isAffirmative,
  isNegative
};
