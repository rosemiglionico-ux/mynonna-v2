const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  ingredients: [{ type: String }],
  steps:       [{ type: String }],
  imageUrl:    { type: String, default: null },
  prepTime:    { type: String, default: '' },
  servings:    { type: String, default: '' },
  tags:        [{ type: String }],
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Family', default: null },
  personaId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', default: null },
  cookCount:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

recipeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);
