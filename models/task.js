const mongoose = require("mongoose");

// Task Schema
const taskSchema = new mongoose.Schema(
  {
    taskname: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },

    status: {
      type: String,
      enum: ["Todo", "Completed"],
      default: "Todo",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deadline: { type: Date },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Task Model
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
