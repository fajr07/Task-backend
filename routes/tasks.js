const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth'); // ✅ import your existing middleware

// 🔒 Apply auth middleware to all task routes
router.use(auth);

// ✅ GET /api/tasks — Get all tasks for the logged-in user (with filters)
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id; // ✅ user from JWT
    const { status, priority, dueBefore, query } = req.query;

    const filter = { owner: userId }; // ✅ user-specific filter

    if (status && status.trim() !== '') filter.status = status;
    if (priority && priority.trim() !== '') filter.priority = priority;
    if (dueBefore && dueBefore.trim() !== '') {
      filter.dueDate = { $lte: new Date(dueBefore) };
    }
    if (query && query.trim() !== '') {
      filter.title = { $regex: query, $options: 'i' }; // case-insensitive search
    }

    const tasks = await Task.find(filter).lean();
    return res.json({ tasks });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ GET /api/tasks/:id — Get a single task (user-specific)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json({ task });
  } catch (err) {
    console.error(`GET /api/tasks/${req.params.id} error:`, err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ POST /api/tasks — Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, completed, dueDate, priority, status } = req.body;
    const userId = req.user._id;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const task = await Task.create({
      title,
      description: description || '',
      completed: completed ?? false,
      owner: userId, // ✅ assign task to logged-in user
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
      status: status || 'Pending',
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ PUT /api/tasks/:id — Update a task (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      updates,
      { new: true }
    ).lean();

    if (!task) return res.status(404).json({ message: 'Task not found or not authorized' });

    return res.json({ task });
  } catch (err) {
    console.error(`PUT /api/tasks/${req.params.id} error:`, err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// ✅ DELETE /api/tasks/:id — Delete a task (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: userId }).lean();

    if (!task) return res.status(404).json({ message: 'Task not found or not authorized' });

    return res.json({ message: 'Deleted successfully', task });
  } catch (err) {
    console.error(`DELETE /api/tasks/${req.params.id} error:`, err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

module.exports = router;
