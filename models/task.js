const mongoose = require("mongoose");

// Task Schema (Schema Definition Object + Schema Options Object)
const taskSchema = new mongoose.Schema(
  {
    // Schema Definition Object
    taskname: { type: String, required: true },
    description: { type: String }, // Not mandatory
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Completed"],
      default: "Todo",
    },
    deadline: { type: Date }, // Not mandatory
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }, // Schema Options Object
);

// Task Model
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;