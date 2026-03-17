// Dependencies
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwtgenerateToken");
const {
  forgotPasswordLimiter,
  verificationLimiter,
  loginLimiter,
} = require("../middleware/rateLimiter");
const { sendRefreshTokenCookie } = require("../utils/sendTokenCookie");
const sendEmail = require("../utils/sendEmail");
const generateOTP = require("../utils/otpGenerator");
const magicLinkToken = require("../utils/magicLinkToken");

const verifyEmailTemplate = require("../emails/verifyEmailTemplate");
const otpEmailTemplate = require("../emails/otpEmailTemplate");

const authMiddleware = require("../middleware/authMiddleware");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.CLIENT_URL;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Create account
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.emailVerified) {
      return res.status(409).json({
        message: "Account already exists. Please login.",
      });
    }

    const { verificationToken, hashedToken } = magicLinkToken();

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (existingUser && !existingUser.emailVerified) {
      // reuse unverified account
      existingUser.password = hashedPassword;
      existingUser.name = name;
      existingUser.emailVerificationToken = hashedToken;
      existingUser.emailVerificationExpire = Date.now() + 10 * 60 * 1000;

      user = await existingUser.save({ validateBeforeSave: false });
    } else {
      user = new User({
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpire: Date.now() + 10 * 60 * 1000,
      });

      await user.save();
    }

    const verificationURL = `${process.env.SERVER_URL}/auth/verify-email?token=${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify your email",
      verifyEmailTemplate(verificationURL),
    );

    res.status(201).json({
      message: "Account created. Please check your email.",
      email: user.email,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Verify Email magic link
router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.redirect(`${FRONTEND_URL}/checkEmail?error=invalid_link`);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(
        `${FRONTEND_URL}/checkEmail?error=invalid_or_expired`,
      );
    }

    if (user.emailVerified) {
      return res.redirect(`${FRONTEND_URL}/AuthCallback`);
    }
    const refreshToken = generateRefreshToken(user._id);
    // hash refresh token
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // store in DB
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.refreshTokenHash = refreshTokenHash;
    await user.save({ validateBeforeSave: false });

    sendRefreshTokenCookie(res, refreshToken);

    return res.redirect(`${FRONTEND_URL}/task`);
  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/checkEmail?error=invalid_link`);
  }
});

// Login using JWT
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +refreshTokenHash",
    );
    if (!user) {
      console.log("User does not exist");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }
    const passwordIsMatch = await bcrypt.compare(password, user.password); // Hash password matching
    if (!passwordIsMatch) {
      console.log("Wrong password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Creating tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // hash refresh token
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // store hash in DB
    user.refreshTokenHash = refreshTokenHash;
    await user.save({ validateBeforeSave: false });

    // send cookie
    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      message: "Login successful",
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resend verification link
router.post("/resend-verification", verificationLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    const { verificationToken, hashedToken } = magicLinkToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save({ validateBeforeSave: false });

    const verificationURL = `${process.env.SERVER_URL}/auth/verify-email?token=${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify your email",
      verifyEmailTemplate(verificationURL),
    );
    return res.status(200).json({
      message: "Verification email sent",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (user) {
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// about me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.get("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token received" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token 0" });
    }

    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash",
    );

    if (!user || !user.refreshTokenHash) {
      console.log("Decoded:", decoded);
      console.log("User:", user);
      console.log("RefreshTokenHash in DB:", user?.refreshTokenHash);
      return res.status(401).json({ message: "Invalid refresh token 1" });
    }

    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    if (user.refreshTokenHash !== hashedRefreshToken) {
      return res.status(401).json({ message: "Invalid refresh token 2" });
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token 3" });
  }
});

// Redirect to google
router.get("/google", async (req, res) => {
  const googleURL =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    "&response_type=code" +
    "&scope=profile email";

  res.redirect(googleURL);
});

// Google Callback
router.get("/google/callback", async (req, res) => {
  try {
    // Exchange code for access token
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Authorization code missing");
    }

    const params = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to fetch Google token");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).send("Failed to get access token from Google");
    }
    const access_token = tokenData.access_token;

    // Get Google user profile
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const user = await userResponse.json();

    if (!user.verified_email) {
      return res.status(400).send("Google email not verified");
    }

    const email = user.email;
    const name = user.name;

    let dbUser = await User.findOne({ email });

    if (!dbUser) {
      dbUser = await User.create({ email, name, emailVerified: true });
    } else if (!dbUser.emailVerified) {
      dbUser.emailVerified = true;
      await dbUser.save({ validateBeforeSave: false });
    }

    // Creating a token and setting it in a cookie
    const refreshToken = generateRefreshToken(dbUser._id);
    // hash refresh token
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // store in DB
    dbUser.refreshTokenHash = refreshTokenHash;
    await dbUser.save({ validateBeforeSave: false });

    sendRefreshTokenCookie(res, refreshToken);

    return res.redirect(`${FRONTEND_URL}/task`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Google authentication failed");
  }
});

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Always send same response (prevents email enumeration)
    const genericResponse = {
      message: "If the email exists, OTP has been sent",
    };

    const user = await User.findOne({ email });

    // If user doesn't exist → still return same response
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Optional: block unverified users
    if (!user.emailVerified) {
      return res.status(400).json({
        message: "Please verify your email first",
      });
    }

    // Rate limiting (prevent OTP spam)
    // if (
    //   user.passwordResetExpire &&
    //   user.passwordResetExpire > Date.now() - 60 * 1000 // 1 min cooldown
    // ) {
    //   return res.status(429).json({
    //     message: "Please wait before requesting another OTP",
    //   });
    // }

    // Generate OTP
    const { otp, hashedOtp } = generateOTP();

    // Save hashed OTP + expiry
    user.passwordResetOTP = hashedOtp;
    user.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send OTP email
    await sendEmail(user.email, "Reset Password OTP", otpEmailTemplate(otp));

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Basic validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Hash incoming OTP
    const hashotp = crypto.createHash("sha256").update(otp).digest("hex");

    // Find user with matching OTP + not expired
    const user = await User.findOne({
      email,
      passwordResetOTP: hashotp,
      passwordResetExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpire = undefined;
    user.refreshTokenHash = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Password reset successful. Please login again.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
