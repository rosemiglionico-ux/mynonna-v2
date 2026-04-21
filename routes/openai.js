const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const authMiddleware = require('../middleware/auth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/openai/ask  — Nonna persona answers a question mid-recipe
router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { question, personaName, personaDescription, recipeTitle, currentStep } = req.body;

    const systemPrompt = `You are ${personaName || 'Nonna'}, a warm and loving Italian grandmother cooking guide.
${personaDescription ? `About you: ${personaDescription}` : ''}
You are helping someone cook "${recipeTitle || 'a delicious recipe'}". They are currently on this step: "${currentStep || ''}".
Respond in character — warm, encouraging, a little old-fashioned but full of wisdom. Keep answers short (2-4 sentences). Occasionally use Italian words or phrases naturally. Never break character.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      max_tokens: 300,
      temperature: 0.85
    });

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error('OpenAI ask error:', err);
    res.status(500).json({ error: 'AI response failed', details: err.message });
  }
});

module.exports = router;
