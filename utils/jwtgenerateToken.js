const jwt = require("jsonwebtoken");

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "20m",
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
