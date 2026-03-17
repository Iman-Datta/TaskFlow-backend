function sendRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function sendAccessTokenTempCookie(res, token) {
  res.cookie("accessToken", token, {
    httpOnly: false, // JS can read
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 10 * 1000,
  });
}

module.exports = { sendRefreshTokenCookie, sendAccessTokenTempCookie };
