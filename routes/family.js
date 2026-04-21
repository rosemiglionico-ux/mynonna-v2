const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Family = require('../models/Family');
const authMiddleware = require('../middleware/auth');

// GET /api/family
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user.familyId) return res.json({ family: null, members: [] });
    const family = await Family.findById(user.familyId).populate('members', 'name username avatar email');
    res.json({ family });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/family/invite
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user.familyId) return res.status(400).json({ error: 'No family found' });

    const family = await Family.findById(user.familyId);
    const invited = await User.findOne({ email: email.toLowerCase() });

    if (invited) {
      if (!family.members.map(m => m.toString()).includes(invited._id.toString())) {
        family.members.push(invited._id);
        invited.familyId = family._id;
        await invited.save();
      }
      await family.save();
      res.json({ success: true, message: 'Member added to family!' });
    } else {
      if (!family.pendingInvites.includes(email.toLowerCase())) {
        family.pendingInvites.push(email.toLowerCase());
        await family.save();
      }
      res.json({ success: true, message: 'Invite sent for when they join!' });
    }
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/family/members/:memberId
router.delete('/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const family = await Family.findById(user.familyId);
    if (!family || family.adminId.toString() !== req.session.userId)
      return res.status(403).json({ error: 'Only admins can remove members' });
    family.members = family.members.filter(m => m.toString() !== req.params.memberId);
    await family.save();
    await User.findByIdAndUpdate(req.params.memberId, { familyId: null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/family/chat  — last 100 messages
router.get('/chat', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user.familyId) return res.json({ messages: [] });
    const family = await Family.findById(user.familyId).select('chatMessages').lean();
    const messages = (family?.chatMessages || []).slice(-100);
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/family/chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Empty message' });
    const user = await User.findById(req.session.userId);
    if (!user.familyId) return res.status(400).json({ error: 'No family' });
    const msg = { userId: user._id, username: user.username || user.name, avatar: user.avatar, text: text.trim(), timestamp: new Date() };
    await Family.findByIdAndUpdate(user.familyId, { $push: { chatMessages: msg } });
    res.json({ message: msg });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
