const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Rule = require('../models/Rule');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');

// 1. Get User Info
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// 2. Submit Command (Core Logic)
router.post('/commands', authenticate, async (req, res) => {
  const { command } = req.body;
  const user = req.user;

  if (user.credits <= 0) {
    return res.status(403).json({ status: 'rejected', message: 'Insufficient credits' });
  }

  // Fetch all rules
  const rules = await Rule.find({});
  let action = 'AUTO_ACCEPT';
  let matchedRule = null;

  // Regex Matching
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern);
      if (regex.test(command)) {
        action = rule.action;
        matchedRule = rule.pattern;
        break; // First match wins
      }
    } catch (e) {
      console.error("Invalid Regex in DB:", rule.pattern);
    }
  }

  // Action: REJECT
  if (action === 'AUTO_REJECT') {
    await AuditLog.create({ 
        user: user.username, 
        command, 
        actionTaken: 'REJECTED' 
    });
    return res.json({ status: 'rejected', message: `Blocked by rule: ${matchedRule}` });
  }

  // Action: EXECUTE
  try {
      user.credits -= 1;
      await user.save(); 

      await AuditLog.create({ 
          user: user.username, 
          command, 
          actionTaken: 'EXECUTED' 
      });

      console.log(`[EXECUTION] ${user.username}: ${command}`);
      res.json({ status: 'executed', new_balance: user.credits, message: 'Command executed successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Execution failed during database update.' });
  }
});

// 3. Admin: Get Logs
router.get('/admin/logs', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  const logs = await AuditLog.find().sort({ timestamp: -1 });
  res.json(logs);
});

// 4. Admin: Add Rule
router.post('/admin/rules', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  const { pattern, action } = req.body;

  try { new RegExp(pattern); } catch (e) { return res.status(400).json({ error: 'Invalid Regex pattern' }); }

  const rule = await Rule.create({ pattern, action });
  res.json(rule);
});

// 5. Admin: Create User (DEBUG VERSION)
router.post('/admin/users', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    
    console.log("👉 Receiving Create User Request:", req.body); 

    const newKey = 'user-' + Math.random().toString(36).substr(2, 9);
    
    try {
        const newUser = await User.create({ 
            username: req.body.username, 
            apiKey: newKey, 
            role: 'member',
            credits: 100 
        });
        console.log("✅ User Created in DB:", newUser);
        res.json({ message: "User created", apiKey: newKey });
    } catch (err) {
        console.error("❌ MONGODB ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 6. Member: Get My History
router.get('/my-history', authenticate, async (req, res) => {
  const myLogs = await AuditLog.find({ user: req.user.username }).sort({ timestamp: -1 });
  res.json(myLogs);
});

module.exports = router;