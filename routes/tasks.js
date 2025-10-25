const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Create
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    const task = new Task({
      user: req.user._id,
      title,
      description,
      status,
      dueDate,
      priority
    });
    await task.save();
    res.json(task);
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

// Read: list (with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, dueBefore, dueAfter, search } = req.query;
    const query = { user: req.user._id };
    if(status) query.status = status;
    if(priority) query.priority = priority;
    if(dueBefore) query.dueDate = { ...(query.dueDate||{}), $lte: new Date(dueBefore) };
    if(dueAfter) query.dueDate = { ...(query.dueDate||{}), $gte: new Date(dueAfter) };
    if(search) query.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') }
    ];
    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

// Read single
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if(!task || task.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

// Update
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if(!task || task.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Not found' });
    const { title, description, status, dueDate, priority } = req.body;
    if(title !== undefined) task.title = title;
    if(description !== undefined) task.description = description;
    if(status !== undefined) task.status = status;
    if(dueDate !== undefined) task.dueDate = dueDate;
    if(priority !== undefined) task.priority = priority;
    await task.save();
    res.json(task);
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if(!task || task.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Not found' });
    await task.remove();
    res.json({ message: 'Deleted' });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

module.exports = router;
