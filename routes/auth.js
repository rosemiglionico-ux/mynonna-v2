const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Family = require('../models/Family');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, ...(username ? [{ username }] : [])] });
    if (existing) {
      return res.status(400).json({ error: existing.email === email.toLowerCase() ? 'Email already in use' : 'Username taken' });
    }

    const user = new User({ name, email, password, username });
    await user.save();

    // Auto-create a family circle for new users
    const family = new Family({ name: `${name}'s Kitchen`, adminId: user._id, members: [user._id] });
    await family.save();
    user.familyId = family._id;
    await user.save();

    req.session.userId = user._id.toString();
    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user._id.toString();
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { req.session.destroy(); return res.status(401).json({ error: 'User not found' }); }
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/update  (name, username, avatar as base64 dataURL)
router.put('/update', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { name, username, avatar } = req.body;
    const update = {};
    if (name)     update.name = name;
    if (username) update.username = username;
    if (avatar)   update.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.session.userId, update, { new: true });
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/auth/delete
router.delete('/delete', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await User.findByIdAndDelete(req.session.userId);
    req.session.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
