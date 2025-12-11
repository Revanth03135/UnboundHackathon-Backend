require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// --- IN-MEMORY DATABASE (Resets on restart) ---
// This is your mock database
const USERS = [
    { _id: '1', username: 'SuperAdmin', apiKey: 'admin-secret-123', role: 'admin', credits: 999 }
];
const RULES = [
    { _id: '1', pattern: 'rm\\s+-rf\\s+/', action: 'AUTO_REJECT' }, // Block dangerous rm
    { _id: '2', pattern: 'git\\s+status', action: 'AUTO_ACCEPT' }   // Allow git status
];
const AUDIT_LOGS = [];

// --- MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API Key missing' });
  
  const user = USERS.find(u => u.apiKey === apiKey);
  if (!user) return res.status(401).json({ error: 'Invalid API Key' });
  
  req.user = user;
  next();
};

// --- ROUTES ---

// 1. Get User Info
app.get('/api/me', authenticate, (req, res) => {
  res.json(req.user);
});

// 2. Submit Command (The Core Logic)
app.post('/api/commands', authenticate, (req, res) => {
  const { command } = req.body;
  const user = req.user;

  // Credit Check
  if (user.credits <= 0) {
    return res.status(403).json({ status: 'rejected', message: 'Insufficient credits' });
  }

  // Rule Matching
  let action = 'AUTO_ACCEPT'; // Default
  let matchedRule = null;

  for (const rule of RULES) {
    try {
      const regex = new RegExp(rule.pattern);
      if (regex.test(command)) {
        action = rule.action;
        matchedRule = rule.pattern;
        break; 
      }
    } catch (e) { console.error("Regex Error", e); }
  }

  // Action: REJECT
  if (action === 'AUTO_REJECT') {
    const log = { 
        _id: Date.now().toString(), 
        user: user.username, 
        command, 
        actionTaken: 'REJECTED', 
        timestamp: new Date() 
    };
    AUDIT_LOGS.unshift(log); // Add to logs
    return res.json({ status: 'rejected', message: `Blocked by rule: ${matchedRule}` });
  }

  // Action: EXECUTE
  user.credits -= 1; // Deduct Credit
  const log = { 
      _id: Date.now().toString(), 
      user: user.username, 
      command, 
      actionTaken: 'EXECUTED', 
      timestamp: new Date() 
  };
  AUDIT_LOGS.unshift(log);
  
  console.log(`[EXECUTION] ${user.username} ran: ${command}`);
  res.json({ status: 'executed', new_balance: user.credits, message: 'Command executed successfully' });
});

// 3. Admin: Get Logs
app.get('/api/admin/logs', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  res.json(AUDIT_LOGS);
});

// 4. Admin: Add Rule
app.post('/api/admin/rules', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  const { pattern, action } = req.body;

  // Validate Regex
  try { new RegExp(pattern); } catch (e) { return res.status(400).json({ error: 'Invalid Regex' }); }

  const newRule = { _id: Date.now().toString(), pattern, action };
  RULES.push(newRule);
  res.json(newRule);
});

// 5. Admin: Create User
app.post('/api/admin/users', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    
    const newKey = 'user-' + Math.random().toString(36).substr(2, 9);
    const newUser = { 
        _id: Date.now().toString(),
        username: req.body.username, 
        apiKey: newKey, 
        role: 'member',
        credits: 100
    };
    USERS.push(newUser);
    res.json({ message: "User created", apiKey: newKey });
});
// 6. Member: Get My History
app.get('/api/my-history', authenticate, (req, res) => {
  // Filter logs to only show this user's actions
  const myLogs = AUDIT_LOGS.filter(log => log.user === req.user.username);
  res.json(myLogs);
});
// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT} (SAFE MODE)`));