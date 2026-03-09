const express = require("express");
const router = express.Router();

// Dependencies
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    console.log(`New user's maill id: ${newUser.email}`);
    res.status(201).json({ message: "Account created successfully", name });
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

    // Token creation
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // for production
      // secure: false, // Dev
      sameSite: "none", // Production
      // sameSite: "lax", // for dev
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: false, // true in production with HTTPS
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Cehck login or logout
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

module.exports = router;
