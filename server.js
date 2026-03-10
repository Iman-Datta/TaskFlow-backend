// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

require("./cron/deleteOldTasks");

// Load environment variables FIRST
dotenv.config();

// Start express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log(error)); // Mongoose return promise

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Tasks routes
const tasksRoutes = require("./routes/taskRoutes");
app.use("/tasks", tasksRoutes);

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
