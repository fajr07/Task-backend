const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Get profile + stats
router.get('/', auth, async (req, res) => {
  try {
    const total = await Task.countDocuments({ user: req.user._id });
    const completed = await Task.countDocuments({ user: req.user._id, status: 'Completed' });
    const pending = await Task.countDocuments({ user: req.user._id, status: 'Pending' });
    const inProgress = await Task.countDocuments({ user: req.user._id, status: 'In Progress' });
    // upcoming (next 7 days)
    const upcoming = await Task.countDocuments({ user: req.user._id, dueDate: { $gte: new Date(), $lte: new Date(Date.now()+7*24*60*60*1000) } });
    res.json({
      user: req.user,
      stats: { total, completed, pending, inProgress, upcoming }
    });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' });}
});

module.exports = router;
