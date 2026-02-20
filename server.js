// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

// Start express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log(error)); // Mongoose return promise

// Task Schema (Schema Definition Object + Schema Options Object)
const taskSchema = new mongoose.Schema(
  {
    // Schema Definition Object
    taskname: { type: String, required: true },
    category: { type: String, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }, // Schema Options Object
);

// Task Model
const Task = mongoose.model("Task", taskSchema);

// Rout -> API

// POST
app.post("/tasks", async (req, res) => {
  try {
    const { taskname } = req.body; // const task_name = req.body.taskname;
    const task = new Task(req.body);

    console.log(`Creating task: ${taskname}`);

    const savedTask = await task.save();
    console.log(`Task saved with ID: ${savedTask._id}`);

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET for all and filter
app.get("/tasks", async (req, res) => {
  try {
    const { fields, ...filter } = req.query;

    let query = Task.find(filter).sort({ createdAt: -1 }); // Filtering

    if (fields) {
      const selectedFields = fields.split(",").join(" ");
      query = query.select(selectedFields); // If specific fields are requested, apply field selection (projection)
    }

    const tasks = await query;

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET via ID
app.get("/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update all field
app.put("/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Allowed fields to update & category intentionally NOT updated
    const { taskname, deadline, status } = req.body;

    if (taskname !== undefined) task.taskname = taskname;
    if (deadline !== undefined) task.deadline = deadline;
    if (status !== undefined) task.status = status;

    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/tasks/:id/status", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({ message: "Status is required" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    task.status = status;
    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
app.delete("/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});