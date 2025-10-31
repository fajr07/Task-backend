const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = new User({ name: name.trim(), email: normalizedEmail, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ message: 'User created', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log(`[AUTH] Login attempt for: ${normalizedEmail}`);

    
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log('[AUTH] No user found for', normalizedEmail);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    console.log('[AUTH] User found. passwordPresent=', !!user.password);

    const match = await bcrypt.compare(password, user.password);
    console.log('[AUTH] Password match:', match);

    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    user.password = undefined;
    return res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    
    const payload = { message: 'Internal Server Error' };
    if (process.env.NODE_ENV !== 'production') payload.error = err.message;
    return res.status(500).json(payload);
  }
});

module.exports = router;