const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

// POST /api/tts/speak  — proxy to ElevenLabs, returns audio as base64
router.post('/speak', authMiddleware, async (req, res) => {
  try {
    const { text, voiceId = 'XrExE9yKIg1WjnnlVkGX' } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    res.json({ audio: audioBase64, mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('TTS error:', err.response?.data || err.message);
    res.status(500).json({ error: 'TTS failed', details: err.message });
  }
});

module.exports = router;
