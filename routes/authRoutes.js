const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Dependencies
const User = require("../models/user");
const bcrypt = require("bcryptjs");

const generateToken = require("../utils/generateToken");
const sendTokenCookie = require("../utils/sendTokenCookie");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.CLIENT_URL;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Create account
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
    });

    await newUser.save();
    // Creating a token and setting it in a cookie
    const token = generateToken(newUser._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// Login using JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not exsit");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const passwordIsMatch = await bcrypt.compare(password, user.password); // Hash password matching
    if (!passwordIsMatch) {
      console.log("Wrong password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Creating a token and setting it in a cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({ message: "Logged out successfully" });
});

// Cehck login or logout state
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
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

// Google Oauth

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
      dbUser = await User.create({ email, name });
    }

    // Creating a token and setting it in a cookie
    const token = generateToken(dbUser._id);
    sendTokenCookie(res, token);

    return res.redirect(`${FRONTEND_URL}/oauth-success`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Google authentication failed");
  }
});

module.exports = router;
