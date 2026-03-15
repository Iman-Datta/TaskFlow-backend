const crypto = require("crypto");

function magicLinkToken() {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  return {
    verificationToken,
    hashedToken,
  };
}

module.exports = magicLinkToken;
