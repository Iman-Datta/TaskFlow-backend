const rateLimit = require("express-rate-limit");

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: {
    message: "Too many reset attempts. Try again later.",
  },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: {
    message: "Too many verification requests. Try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // only 5 attempts
  message: {
    message: "Too many login attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  forgotPasswordLimiter,
  verificationLimiter,
  loginLimiter,
};
