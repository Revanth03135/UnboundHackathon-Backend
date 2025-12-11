const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: String,
  command: String,
  actionTaken: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);