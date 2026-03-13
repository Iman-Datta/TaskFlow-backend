const authMiddleware = require("../middleware/authMiddleware");

const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Task = require("../models/task");

// controllers

// Add task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { taskname } = req.body; // const task_name = req.body.taskname;
    const task = new Task({ ...req.body, user: req.user });

    console.log(`Creating task: ${taskname}`);

    const savedTask = await task.save();
    console.log(`Task saved with ID: ${savedTask._id}`);

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET for all and filter
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { fields, sortField, order, ...filter } = req.query;

    // Always restrict tasks to logged-in user
    filter.user = req.user;

    // Sorting workflow
    const allowedSortFields = ["deadline", "priority", "createdAt"];
    let finalSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // Build query with filtering
    let query = Task.find(filter);

    // Apply sorting
    query = query.sort({ [finalSortField]: sortOrder });

    // Apply field selection (projection)
    if (fields) {
      const selectedFields = fields.split(",").join(" ");
      query = query.select(selectedFields);
    }

    const tasks = await query;

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// restore task
router.patch("/:id/restore", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const reqUser = req.user;

    const task = await Task.findOne({
      _id: req.params.id,
      user: reqUser,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.isDeleted) {
      return res.status(400).json({ message: "Task is not in recycle bin" });
    }

    task.isDeleted = false;
    task.deletedAt = null;
    await task.save();
    res.status(200).json({ message: "Task restore successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task status (Todo to Completed and completed to todo)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const reqUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const { status } = req.body;

    const allowedStatuses = ["Todo", "Completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: reqUser,
    });

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

// GET via ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const reqUser = req.user;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({ _id: req.params.id, user: reqUser });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update all field
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const reqUser = req.user;
    const { id } = req.params;

    // Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({ _id: id, user: reqUser });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Allowed fields
    const allowedUpdates = [
      "taskname",
      "description",
      "category",
      "deadline",
      "priority",
      "status",
    ];

    const updates = Object.keys(req.body); // Take all the keys from request body

    // Validate update fields
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update),
    );

    if (!isValidOperation) {
      return res.status(400).json({ message: "Invalid update fields" });
    }

    // Apply updates dynamically
    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const reqUser = req.user;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: reqUser,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
