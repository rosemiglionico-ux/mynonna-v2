const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
const Recipe = require('../models/Recipe');
const authMiddleware = require('../middleware/auth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Memory storage for OpenAI Vision uploads
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/recipes/scan  — OpenAI Vision extracts recipe from photo
router.post('/scan', memUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    const b64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the recipe from this image. Return ONLY valid JSON (no markdown) in this exact format: {"title":"","description":"","ingredients":[],"steps":[],"prepTime":"","servings":""}' },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } }
        ]
      }],
      max_tokens: 2000
    });

    let content = response.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const recipe = JSON.parse(content);
    res.json({ recipe });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Failed to scan recipe', details: err.message });
  }
});

// GET /api/recipes/demo  — built-in demo recipe
router.get('/demo', (req, res) => {
  res.json({
    recipe: {
      title: "Nonna's Spaghetti al Pomodoro",
      description: "A timeless Italian pasta with fresh tomatoes and basil",
      ingredients: [
        "400g spaghetti", "800g San Marzano tomatoes (canned)", "4 cloves garlic, minced",
        "1/4 cup fresh basil leaves", "3 tbsp extra virgin olive oil",
        "1 tsp sugar", "Salt and pepper to taste", "Freshly grated Parmigiano-Reggiano"
      ],
      steps: [
        "Bring a large pot of generously salted water to a rolling boil. The pasta water should taste like the sea!",
        "In a large skillet, warm the olive oil over medium heat. Add the minced garlic and sauté gently for 1-2 minutes until fragrant and golden — don't let it burn!",
        "Pour in the crushed tomatoes, add a pinch of sugar, salt, and pepper. Simmer on low heat for 20-25 minutes, stirring occasionally, until the sauce thickens beautifully.",
        "Cook your spaghetti 2 minutes less than the package says — we'll finish it in the sauce, that's the secret!",
        "Before draining, scoop out 1 cup of the starchy pasta water — this liquid gold will bring everything together.",
        "Add the drained pasta directly into the sauce. Toss over medium heat, adding pasta water little by little until every strand is coated. This is the magic step, amore!",
        "Remove from heat and tear in the fresh basil leaves. Give it one final loving toss.",
        "Serve immediately in warm bowls, showered with freshly grated Parmigiano-Reggiano. Buon appetito!"
      ],
      prepTime: "40 minutes",
      servings: "4"
    }
  });
});

// GET /api/recipes  — all recipes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ ownerId: req.session.userId }).sort({ createdAt: -1 });
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recipes  — save recipe
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, ingredients, steps, imageUrl, personaId, tags, prepTime, servings } = req.body;
    const recipe = new Recipe({ title, description, ingredients, steps, imageUrl, personaId, tags, prepTime, servings, ownerId: req.session.userId });
    await recipe.save();
    res.status(201).json({ recipe });
  } catch (err) {
    console.error('Save recipe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Not found' });
    res.json({ recipe });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/recipes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Recipe.findOneAndDelete({ _id: req.params.id, ownerId: req.session.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
