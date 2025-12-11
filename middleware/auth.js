const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API Key missing' });
  
  try {
    const user = await User.findOne({ apiKey });
    if (!user) return res.status(401).json({ error: 'Invalid API Key' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database Authentication Error' });
  }
};

module.exports = authenticate;