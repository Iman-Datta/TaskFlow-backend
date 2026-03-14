// For dev:
// function sendTokenCookie(res, token) {
//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: false,
//     sameSite: "lax",
//     maxAge: 3600000,
//   });
// }

// For Production:
function sendTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 3600000,
  });
}


module.exports = sendTokenCookie;