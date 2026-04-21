const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: null },
  voiceId:     { type: String, default: 'XrExE9yKIg1WjnnlVkGX' }, // ElevenLabs Matilda (warm/grandmotherly)
  accent:      { type: String, default: 'Italian' },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Family', default: null },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Persona', personaSchema);
