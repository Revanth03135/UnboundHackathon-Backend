const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  apiKey: { type: String, unique: true, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  credits: { type: Number, default: 100 }
});

module.exports = mongoose.model('User', UserSchema);