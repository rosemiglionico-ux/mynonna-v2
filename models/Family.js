const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:  { type: String },
  avatar:    { type: String },
  text:      { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const familySchema = new mongoose.Schema({
  name:           { type: String, default: 'My Family' },
  adminId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingInvites: [{ type: String }],
  chatMessages:   [messageSchema],
  sharedPhotos:   [{ type: String }],
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Family', familySchema);
