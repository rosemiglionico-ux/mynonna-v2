const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Persona = require('../models/Persona');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `persona_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/personas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const personas = await Persona.find({ ownerId: req.session.userId }).sort({ createdAt: -1 });
    res.json({ personas });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/personas
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, voiceId, accent } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const persona = new Persona({
      name, description,
      voiceId: voiceId || 'XrExE9yKIg1WjnnlVkGX',
      accent: accent || 'Italian',
      imageUrl,
      ownerId: req.session.userId
    });
    await persona.save();
    res.status(201).json({ persona });
  } catch (err) {
    console.error('Create persona error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/personas/:id
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, voiceId } = req.body;
    const update = { name, description, voiceId };
    if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;
    const persona = await Persona.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.session.userId }, update, { new: true }
    );
    res.json({ persona });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/personas/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Persona.findOneAndDelete({ _id: req.params.id, ownerId: req.session.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
