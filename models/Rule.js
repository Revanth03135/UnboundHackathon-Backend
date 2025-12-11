const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema({
  pattern: { type: String, required: true }, 
  action: { type: String, enum: ['AUTO_ACCEPT', 'AUTO_REJECT'], required: true }
});

module.exports = mongoose.model('Rule', RuleSchema);